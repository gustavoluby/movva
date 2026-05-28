-- ============================================================
-- BUCKET tribe-covers
-- ============================================================
-- Capas das tribos. Public read, write policies vêm na fase de auth.

insert into storage.buckets (id, name, public)
values ('tribe-covers', 'tribe-covers', true)
on conflict (id) do nothing;
