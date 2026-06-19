import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type CouponValidation =
  | { ok: true; code: string; discountCents: number; finalCents: number }
  | { ok: false; error: string };

// Valida um cupom contra um evento + preço base e devolve o desconto e o preço
// final em centavos. Fonte única de verdade: usada tanto na UI do checkout
// (preview do desconto) quanto no momento de criar a cobrança (revalidação —
// nunca confiamos no valor que volta do client). Lê via service-role porque a
// tabela coupons tem RLS travada (sem leitura anônima).
export async function validateCoupon(
  rawCode: string,
  eventId: string,
  basePriceCents: number,
): Promise<CouponValidation> {
  const code = rawCode.trim();
  if (!code) return { ok: false, error: "Digite um cupom." };

  const admin = createAdminClient();
  const { data: coupon } = await admin
    .from("coupons")
    .select(
      "code, discount_type, discount_value, event_id, max_uses, uses_count, valid_until, is_active",
    )
    .ilike("code", code)
    .maybeSingle();

  if (!coupon || !coupon.is_active) {
    return { ok: false, error: "Cupom inválido." };
  }
  if (coupon.event_id && coupon.event_id !== eventId) {
    return { ok: false, error: "Esse cupom não vale pra esta experiência." };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return { ok: false, error: "Esse cupom expirou." };
  }
  if (coupon.max_uses != null && (coupon.uses_count ?? 0) >= coupon.max_uses) {
    return { ok: false, error: "Esse cupom esgotou." };
  }

  // Schema do init: 'percentage' (em %) | 'fixed' (centavos).
  const rawDiscount =
    coupon.discount_type === "percentage"
      ? Math.round((basePriceCents * coupon.discount_value) / 100)
      : coupon.discount_value;
  const discountCents = Math.min(rawDiscount, basePriceCents);
  const finalCents = basePriceCents - discountCents;

  // O Mercado Pago não cobra valores irrisórios; piso de R$1 pra não quebrar o
  // checkout. Cupom que zeraria o valor precisaria de fluxo grátis (fora daqui).
  if (finalCents < 100) {
    return {
      ok: false,
      error: "Esse cupom zera o valor — não dá pra finalizar pelo checkout.",
    };
  }

  return { ok: true, code: coupon.code, discountCents, finalCents };
}
