-- PENDENTE (rodar com token sbp_ quando habilitar comentários nas Ideias).
-- As tabelas ideas/idea_likes já existem (schema inicial). likes_count é mantido
-- pela server action via service-role, então NÃO criamos trigger de likes aqui
-- (evita contagem dupla). Isto adiciona: comentários de ideias + contagem
-- automática + as policies que faltavam em ideas (revelar/apagar pela autora).

create table if not exists public.idea_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_idea_comments_idea
  on public.idea_comments (idea_id);

-- comments_count automático (espelha update_post_comments_count)
create or replace function update_idea_comments_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.ideas set comments_count = comments_count + 1 where id = new.idea_id;
  elsif (tg_op = 'DELETE') then
    update public.ideas set comments_count = greatest(comments_count - 1, 0) where id = old.idea_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_idea_comments_update_count on public.idea_comments;
create trigger trg_idea_comments_update_count
after insert or delete on public.idea_comments
for each row execute function update_idea_comments_count();

alter table public.idea_comments enable row level security;
drop policy if exists "Comentários de ideia visíveis" on public.idea_comments;
create policy "Comentários de ideia visíveis" on public.idea_comments
  for select using (true);
drop policy if exists "Comente ideia como você" on public.idea_comments;
create policy "Comente ideia como você" on public.idea_comments
  for insert with check (auth.uid() = user_id);
drop policy if exists "Apague seu comentário de ideia" on public.idea_comments;
create policy "Apague seu comentário de ideia" on public.idea_comments
  for delete using (auth.uid() = user_id);

-- policies que faltavam em ideas (hoje o reveal/delete vai por service-role)
drop policy if exists "Edite sua ideia" on public.ideas;
create policy "Edite sua ideia" on public.ideas
  for update using (auth.uid() = user_id);
drop policy if exists "Apague sua ideia" on public.ideas;
create policy "Apague sua ideia" on public.ideas
  for delete using (auth.uid() = user_id);
