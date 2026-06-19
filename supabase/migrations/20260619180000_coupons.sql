-- A tabela public.coupons já existe desde o init (PK = code; campos
-- discount_type 'fixed'|'percentage', discount_value, is_active, uses_count,
-- max_uses, valid_until, ...). Aqui só:
--   1) adiciona event_id (cupom opcionalmente restrito a uma experiência)
--   2) cria o incremento atômico de uso, chamado quando o pagamento confirma.
--
-- O desconto é aplicado do NOSSO lado (server) antes de criar a preferência do
-- Mercado Pago: validamos o código, recalculamos o preço e mandamos o
-- unit_price já com desconto. O MP só cobra o valor final.

alter table public.coupons
  add column if not exists event_id uuid references events(id) on delete cascade;

create index if not exists idx_coupons_event on public.coupons (event_id);

-- Incremento atômico do contador de uso (uses_count), por código.
create or replace function public.increment_coupon_use(p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.coupons
     set uses_count = coalesce(uses_count, 0) + 1
   where lower(code) = lower(p_code);
$$;
