// Preço escalonado por vagas (lotes). Ver migration event_price_tiers.
//
// O preço base (price_cents) é o 1º lote, válido nas primeiras `tier1_capacity`
// vagas VENDIDAS (pagas). Esgotado o 1º lote, o preço sobe pra `price_tier2_cents`.
// Sem os dois campos preenchidos, o evento tem preço único (price_cents).

export type EventPricing = {
  price_cents: number;
  tier1_capacity?: number | null;
  price_tier2_cents?: number | null;
};

/** true quando o evento tem lote configurado (os dois campos preenchidos). */
export function hasPriceTiers(e: EventPricing): boolean {
  return e.tier1_capacity != null && e.price_tier2_cents != null;
}

/**
 * Preço ativo agora, dado o número de vendas pagas (`sold`).
 * Sem lote configurado → sempre price_cents.
 * Com lote → price_cents enquanto sold < tier1_capacity; senão price_tier2_cents.
 */
export function activePriceCents(e: EventPricing, sold: number): number {
  if (hasPriceTiers(e) && sold >= (e.tier1_capacity as number)) {
    return e.price_tier2_cents as number;
  }
  return e.price_cents;
}

/**
 * Quantas vagas ainda restam no 1º lote (preço promocional), dado `sold`.
 * 0 quando o lote esgotou; null quando o evento não usa lote.
 */
export function tier1SpotsLeft(e: EventPricing, sold: number): number | null {
  if (!hasPriceTiers(e)) return null;
  return Math.max(0, (e.tier1_capacity as number) - sold);
}
