-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- 4 public read buckets. Upload/write policies are added later
-- in the auth phase (Fase 5) so only owners can write to their
-- own paths.

insert into storage.buckets (id, name, public)
values
  ('event-images',        'event-images',        true),
  ('professional-images', 'professional-images', true),
  ('feed-photos',         'feed-photos',         true),
  ('avatars',             'avatars',             true)
on conflict (id) do nothing;
