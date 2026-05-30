-- ============================================================
-- Perfil: handle do Instagram da usuária
-- ============================================================
-- profiles só tinha instagram em hosts; agora a própria usuária
-- cadastra o dela no perfil.

alter table public.profiles
  add column if not exists instagram text; -- "@nicolebenato" ou "nicolebenato"
