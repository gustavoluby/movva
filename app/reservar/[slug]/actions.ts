"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Preference } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { mpClient } from "@/lib/mercadopago";

export type ReservaState = { error?: string } | null;

// Cria a reserva (status 'confirmed', pagamento pendente) de forma
// idempotente. Disparada por um clique explícito — não no render da
// página — pra evitar que prefetch/re-render gravem reserva sem ação.
export async function confirmarReserva(
  _prev: ReservaState,
  formData: FormData,
): Promise<ReservaState> {
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return { error: "Evento inválido." };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa entrar pra reservar." };

  const { data: event } = await supabase
    .from("events")
    .select("id, price_cents, capacity, going_count")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!event) return { error: "Evento não encontrado." };

  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_id", event.id)
    .maybeSingle();

  if (!existing) {
    if ((event.going_count ?? 0) >= event.capacity) {
      return { error: "Esse evento esgotou as vagas." };
    }

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      event_id: event.id,
      amount_cents: event.price_cents,
      payment_status: "pending",
      status: "confirmed",
    });

    // unique(user_id, event_id): em corrida, o duplicate é benigno.
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return { error: `Não rolou criar a reserva: ${error.message}` };
    }
  }

  // Re-renderiza a página de reserva (mostra a confirmação), atualiza
  // "Minhas" e o going_count na vitrine/detalhe.
  revalidatePath(`/reservar/${slug}`);
  revalidatePath("/minhas");
  revalidatePath(`/eventos/${slug}`);
  revalidatePath("/");
  return null;
}

// Cria uma preferência de Checkout Pro no Mercado Pago pra reserva pendente
// e redireciona pra tela de pagamento do MP (Pix + cartão). A confirmação
// volta via webhook + reconferência no retorno (ver page.tsx).
export async function criarPagamento(
  _prev: ReservaState,
  formData: FormData,
): Promise<ReservaState> {
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return { error: "Evento inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa entrar pra pagar." };

  // Carrega evento + reserva (precisa existir e estar pendente).
  const { data: event } = await supabase
    .from("events")
    .select("id, title, price_cents")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!event) return { error: "Evento não encontrado." };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, amount_cents, payment_status")
    .eq("user_id", user.id)
    .eq("event_id", event.id)
    .maybeSingle();
  if (!booking) return { error: "Reserva não encontrada. Reserve antes de pagar." };
  if (booking.payment_status === "paid") {
    return { error: "Essa reserva já está paga." };
  }

  // Origem dinâmica: funciona em localhost e em produção.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const backUrl = `${origin}/reservar/${slug}`;

  let checkoutUrl: string | undefined;
  try {
    const pref = await new Preference(mpClient()).create({
      body: {
        items: [
          {
            id: event.id,
            title: event.title,
            quantity: 1,
            unit_price: (booking.amount_cents ?? event.price_cents) / 100,
            currency_id: "BRL",
          },
        ],
        // Liga a cobrança à reserva — o webhook usa isso pra achar a booking.
        external_reference: booking.id,
        back_urls: {
          success: backUrl,
          pending: backUrl,
          failure: backUrl,
        },
        // auto_return e webhook só com HTTPS público: o MP rejeita auto_return
        // com back_url http://localhost, e o webhook não alcança localhost.
        // Em dev a volta é manual ("voltar ao site") e a reconferência no
        // retorno (?payment_id) cobre a confirmação.
        ...(origin.startsWith("https://")
          ? {
              auto_return: "approved",
              notification_url: `${origin}/api/webhooks/mercadopago`,
            }
          : {}),
      },
    });
    checkoutUrl = pref.init_point ?? pref.sandbox_init_point ?? undefined;
  } catch (err) {
    console.error("[criarPagamento] erro criando preferência:", err);
    return { error: "Não rolou iniciar o pagamento. Tenta de novo." };
  }

  if (!checkoutUrl) {
    return { error: "Não rolou iniciar o pagamento. Tenta de novo." };
  }

  // redirect() lança por design — fica fora do try.
  redirect(checkoutUrl);
}
