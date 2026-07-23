"use server";

import { revalidatePath } from "next/cache";
import { PaymentRefund } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mpClient } from "@/lib/mercadopago";
import { isAdmin } from "@/lib/admin";

// Marca a reserva como estornada/cancelada. NÃO apaga a linha: preserva o
// registro financeiro (quem comprou, quanto, payment_id). A trigger
// trg_bookings_update_event_count vê payment_status sair de 'paid' e decrementa
// o going_count; getEventAvailability só conta 'paid', então a vaga volta ao
// estoque na hora. Recompra segue possível (reservarEPagar reusa a linha quando
// não está 'paid'). Idempotente pelo filtro .eq('payment_status','paid').
async function softCancel(bookingId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("bookings")
    .update({
      payment_status: "refunded",
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("payment_status", "paid");
  return error ? error.message : null;
}

async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdmin(user?.email);
}

// Só libera a vaga (sem estorno no MP). Para quando o estorno já foi feito
// manualmente ou não se aplica.
export async function removerVenda(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;
  if (!(await requireAdmin())) return;

  const err = await softCancel(bookingId);
  if (err) throw new Error(err);
  revalidatePath("/admin/eventos");
}

// Estorna o pagamento no Mercado Pago (estorno total) e, se der certo, libera a
// vaga. A ordem importa: estorna primeiro, depois marca no banco — se o estorno
// falhar, a venda continua listada e nada é liberado. O idempotencyKey por
// booking evita estorno duplicado em retentativa.
export async function estornarERemover(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;
  if (!(await requireAdmin())) return;

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, payment_id, payment_status")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking || booking.payment_status !== "paid") return;
  if (!booking.payment_id) {
    throw new Error(
      "Reserva sem payment_id — não dá pra estornar pela API. Use 'Só liberar' e estorne manualmente no Mercado Pago.",
    );
  }

  try {
    await new PaymentRefund(mpClient()).total({
      payment_id: booking.payment_id,
      requestOptions: { idempotencyKey: `refund-${bookingId}` },
    });
  } catch (err) {
    console.error("[estornarERemover] estorno MP falhou:", err);
    throw new Error(
      "O estorno no Mercado Pago falhou. Tenta de novo ou estorne manualmente no painel.",
    );
  }

  const dbErr = await softCancel(bookingId);
  if (dbErr) throw new Error(dbErr);
  revalidatePath("/admin/eventos");
}

// ============================================================
// Adicionar pagante manual (venda por fora: Pix direto, cortesia, etc.)
// ============================================================

export type AddSaleState = { error?: string; ok?: string } | null;

// "139" | "139,90" | "R$ 139,90" | "139.90" → centavos. Aceita 0 (cortesia).
// Devolve null quando não dá pra interpretar como valor.
function parseAmountToCents(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return null;
  // Se tem vírgula, ela é o separador decimal (pt-BR) e o ponto é milhar.
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

// Procura uma conta existente pelo email (auth.users). Pagina até achar ou
// esgotar. Usado pra anexar a venda a quem já tem conta (ex.: esqueceu a senha).
async function findUserIdByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<string | null> {
  const target = email.toLowerCase();
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    const users = data?.users ?? [];
    if (error || users.length === 0) break;
    const hit = users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit.id;
    if (users.length < perPage) break;
  }
  return null;
}

// Registra uma compradora à mão, pra pagamento feito fora do app (Pix direto,
// dinheiro, cortesia). Resolve a conta em três casos:
//   1. Email de conta que já existe  → anexa a venda a essa conta.
//   2. Email novo                    → cria a conta (ela pode acessar depois).
//   3. Sem email                     → cria uma conta interna só pro registro.
// A reserva entra como paga/confirmada, com reminder_sent_at preenchido pra
// NÃO disparar o lembrete automático de 24h.
export async function adicionarPagante(
  _prev: AddSaleState,
  formData: FormData,
): Promise<AddSaleState> {
  if (!(await requireAdmin())) return { error: "Sem permissão." };

  const eventId = String(formData.get("eventId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const methodRaw = String(formData.get("method") ?? "pix").trim();
  const method = ["pix", "dinheiro", "card", "cortesia"].includes(methodRaw)
    ? methodRaw
    : "pix";

  if (!eventId) return { error: "Escolhe o evento." };
  if (!name) return { error: "Informe o nome da pagante." };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Esse email não parece válido." };
  }

  // Cortesia pode ser 0; nos outros métodos o valor é obrigatório.
  const amountCents = parseAmountToCents(amountRaw);
  if (amountCents == null) return { error: "Informe um valor válido." };
  if (amountCents === 0 && method !== "cortesia") {
    return { error: "Valor 0 só faz sentido como cortesia." };
  }

  const admin = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select("id, title")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return { error: "Evento não encontrado." };

  // ---- Resolve o usuário ----
  let userId: string | null = email
    ? await findUserIdByEmail(admin, email)
    : null;

  if (userId) {
    // Conta já existe: completa nome/telefone só se estiverem vazios (não
    // sobrescreve o que a própria pessoa preencheu).
    const { data: prof } = await admin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .maybeSingle();
    const patch: { phone?: string; full_name?: string } = {};
    if (phone && !prof?.phone) patch.phone = phone;
    if (!prof?.full_name || prof.full_name.trim() === "") patch.full_name = name;
    if (Object.keys(patch).length > 0) {
      await admin.from("profiles").update(patch).eq("id", userId);
    }
  } else {
    // Sem conta: cria uma. Com email real, a pessoa acessa depois (recuperar
    // senha). Sem email, gera um endereço interno só pro registro — não recebe
    // nada, é só pra pendurar a reserva.
    const effectiveEmail =
      email || `manual.${Date.now()}.${Math.round(Math.random() * 1e6)}@moodpass.com.br`;
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: effectiveEmail,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (cErr || !created?.user) {
      return {
        error: `Não deu pra criar a conta: ${cErr?.message ?? "erro"}`,
      };
    }
    userId = created.user.id;
    // O trigger handle_new_user já criou o profile com o full_name; completa o
    // telefone.
    if (phone) await admin.from("profiles").update({ phone }).eq("id", userId);
  }

  // ---- Cria/atualiza a reserva paga ----
  const { data: existing } = await admin
    .from("bookings")
    .select("id, payment_status")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing?.payment_status === "paid") {
    return { error: "Essa pessoa já consta como compradora desse evento." };
  }

  const now = new Date().toISOString();
  const bookingFields = {
    amount_cents: amountCents,
    discount_cents: 0,
    coupon_code: null,
    payment_status: "paid",
    payment_method: method,
    payment_id: null, // venda por fora não tem pagamento no Mercado Pago
    status: "confirmed",
    paid_at: now,
    reminder_sent_at: now, // não dispara o lembrete automático
    updated_at: now,
  };

  const { error: bErr } = existing
    ? await admin.from("bookings").update(bookingFields).eq("id", existing.id)
    : await admin
        .from("bookings")
        .insert({ user_id: userId, event_id: eventId, ...bookingFields });
  if (bErr) return { error: `Não deu pra registrar a venda: ${bErr.message}` };

  revalidatePath("/admin/eventos");
  return {
    ok: `${name} registrada como compradora de "${event.title}"${
      email ? "" : " (sem email — registro só pra controle)"
    }.`,
  };
}
