-- Preço escalonado por vagas (lotes). Opcional por evento.
--
-- Modelo: o preço base (events.price_cents) é o 1º lote, válido nas primeiras
-- `tier1_capacity` vagas VENDIDAS (pagas). A partir daí o preço sobe pra
-- `price_tier2_cents` (2º lote). Ambas nulas = evento sem lote (comportamento
-- antigo, preço único).
--
-- Ex.: price_cents=13900, tier1_capacity=10, price_tier2_cents=15900 →
-- primeiras 10 vagas a R$139, depois R$159.

alter table public.events
  add column if not exists tier1_capacity int,
  add column if not exists price_tier2_cents int;

comment on column public.events.tier1_capacity is
  'Vagas no 1º lote (preço = price_cents). Null = sem lote.';
comment on column public.events.price_tier2_cents is
  'Preço do 2º lote em centavos, cobrado após esgotar o 1º lote. Null = sem lote.';
