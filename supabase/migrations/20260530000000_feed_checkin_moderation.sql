-- ============================================================
-- CHECK-IN / COMUNIDADE: moderação + localização digitada
-- ============================================================
-- Todo post (check-in) entra como 'pending' e só aparece no feed
-- depois que o admin aprova. A localização passa a ser digitada
-- pela usuária no momento do check-in (campo livre).

alter table public.feed_posts
  add column if not exists status text default 'pending', -- 'pending' | 'approved' | 'rejected'
  add column if not exists location_name text;            -- "Catedral de Curitiba", "Batel", etc.

-- Posts que já existiam (seed) viram aprovados pra não sumirem do feed.
-- (Adicionar a coluna com default 'pending' já preenche as linhas atuais com
-- 'pending'; como nesta migration só existem posts de seed, aprovamos todos.
-- Novos check-ins inseridos depois nascem 'pending' pela coluna default.)
update public.feed_posts set status = 'approved';

create index if not exists idx_feed_posts_status
  on public.feed_posts(status, created_at desc);

-- RLS: o feed público mostra só aprovados; a autora enxerga os próprios
-- (inclusive pendentes/rejeitados). Substitui a policy antiga "using (true)".
drop policy if exists "Posts visíveis" on public.feed_posts;

create policy "Posts aprovados ou seus"
  on public.feed_posts
  for select
  using (status = 'approved' or auth.uid() = user_id);
