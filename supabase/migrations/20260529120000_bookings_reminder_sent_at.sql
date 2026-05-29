-- Marca quando o lembrete de 24h foi enviado, pra não disparar duplicado.
alter table public.bookings
  add column if not exists reminder_sent_at timestamptz;
