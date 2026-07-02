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
