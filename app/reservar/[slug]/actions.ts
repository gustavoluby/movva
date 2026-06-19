"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Preference } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mpClient } from "@/lib/mercadopago";
import { getEventAvailability } from "@/lib/events/availability";
import { validateCoupon, type CouponValidation } from "@/lib/coupons/validate";

export type ReservaState = { error?: string } | null;

// Valida um cupom pra UI do checkout (preview do desconto). Não cobra nada —
// só devolve o desconto/preço final pra exibir o "de R$X por R$Y". A cobrança
// revalida o cupom de novo, então o valor não é confiado a partir daqui.
export async function validarCupom(
  slug: string,
  code: string,
): Promise<CouponValidation> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Entre pra usar um cupom." };

  const { data: event } = await supabase
    .from("events")
    .select("id, price_cents")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!event) return { ok: false, error: "Evento não encontrado." };

  return validateCoupon(code, event.id, event.price_cents);
}

// Cria a preferência de Checkout Pro no Mercado Pago pra uma reserva e devolve
// a URL do checkout (Pix + cartão). A confirmação volta via webhook +
// reconferência no retorno (ver page.tsx).
async function criarPreferencia(args: {
  bookingId: string;
  slug: string;
  itemId: string;
  title: string;
  unitPriceCents: number;
}): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const backUrl = `${origin}/reservar/${args.slug}`;

  const pref = await new Preference(mpClient()).create({
    body: {
      items: [
        {
          id: args.itemId,
          title: args.title,
          quantity: 1,
          unit_price: args.unitPriceCents / 100,
          currency_id: "BRL",
        },
      ],
      // Liga a cobrança à reserva — o webhook usa isso pra achar a booking.
      external_reference: args.bookingId,
      back_urls: { success: backUrl, pending: backUrl, failure: backUrl },
      // auto_return e webhook só com HTTPS público: o MP rejeita auto_return
      // com back_url http://localhost, e o webhook não alcança localhost.
      ...(origin.startsWith("https://")
        ? {
            auto_return: "approved",
            notification_url: `${origin}/api/webhooks/mercadopago`,
          }
        : {}),
    },
  });

  const url = pref.init_point ?? pref.sandbox_init_point;
  if (!url) throw new Error("checkout sem init_point");
  return url;
}

// Fluxo único: cria a reserva (se ainda não existir) e abre direto o checkout
// do Mercado Pago. Substitui o antigo passo "Confirmar reserva" → "Pagar".
// Idempotente; disparada por clique explícito (não no render).
export async function reservarEPagar(
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
    .select("id, title, price_cents, capacity")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!event) return { error: "Evento não encontrado." };

  const { data: existing } = await supabase
    .from("bookings")
    .select("id, amount_cents, payment_status")
    .eq("user_id", user.id)
    .eq("event_id", event.id)
    .maybeSingle();

  if (existing?.payment_status === "paid") {
    return { error: "Você já garantiu esse evento." };
  }

  // Trava de esgotamento (server-side): conta vendas pagas de todas. Quem
  // ainda não pagou não consegue iniciar o checkout depois de lotar.
  const { soldOut } = await getEventAvailability(event.id, event.capacity);
  if (soldOut) {
    return { error: "As vagas desse evento esgotaram." };
  }

  // Cupom: revalida do zero (nunca confia no client) e recalcula o preço a
  // partir do valor cheio do evento.
  const couponCode = String(formData.get("coupon") ?? "").trim();
  let amountCents = event.price_cents;
  let discountCents = 0;
  let appliedCoupon: string | null = null;
  if (couponCode) {
    const v = await validateCoupon(couponCode, event.id, event.price_cents);
    if (!v.ok) return { error: v.error };
    amountCents = v.finalCents;
    discountCents = v.discountCents;
    appliedCoupon = v.code;
  }

  let booking = existing;
  if (!booking) {
    const { error: insErr } = await supabase.from("bookings").insert({
      user_id: user.id,
      event_id: event.id,
      amount_cents: amountCents,
      discount_cents: discountCents,
      coupon_code: appliedCoupon,
      payment_status: "pending",
      status: "confirmed",
    });
    // unique(user_id, event_id): em corrida, o duplicate é benigno.
    if (insErr && !insErr.message.toLowerCase().includes("duplicate")) {
      return { error: `Não rolou criar a reserva: ${insErr.message}` };
    }
    const { data: refetched } = await supabase
      .from("bookings")
      .select("id, amount_cents, payment_status")
      .eq("user_id", user.id)
      .eq("event_id", event.id)
      .maybeSingle();
    booking = refetched;
  } else {
    // Reserva pendente já existia: atualiza o valor/cupom (admin client p/ não
    // depender de policy de update de bookings). Reflete reaplicar/trocar cupom.
    await createAdminClient()
      .from("bookings")
      .update({
        amount_cents: amountCents,
        discount_cents: discountCents,
        coupon_code: appliedCoupon,
      })
      .eq("id", booking.id);
    booking = { ...booking, amount_cents: amountCents };
  }

  if (!booking) return { error: "Não rolou criar a reserva. Tenta de novo." };

  let checkoutUrl: string;
  try {
    checkoutUrl = await criarPreferencia({
      bookingId: booking.id,
      slug,
      itemId: event.id,
      title: event.title,
      unitPriceCents: booking.amount_cents ?? event.price_cents,
    });
  } catch (err) {
    console.error("[reservarEPagar] erro criando preferência:", err);
    return { error: "Não rolou iniciar o pagamento. Tenta de novo." };
  }

  // redirect() lança por design — fica fora do try.
  redirect(checkoutUrl);
}
