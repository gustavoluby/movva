-- Diagnóstico de pagamento: guarda o último status do MP e o motivo da recusa
-- na própria reserva, pra agregar por dias (em vez de só nos logs de runtime).
-- Não substitui o `payment_status` (nosso enum interno pending/paid/...); é só
-- metadado do que o MP respondeu.

alter table public.bookings
  add column if not exists mp_status text,
  add column if not exists mp_status_detail text;

comment on column public.bookings.mp_status is
  'Último status do pagamento no MP (approved/rejected/pending/cancelled) — diagnóstico.';
comment on column public.bookings.mp_status_detail is
  'status_detail do MP (ex.: cc_rejected_high_risk) — diagnóstico de recusa.';
