-- ============================================================
-- Mantém feed_posts.comments_count automaticamente
-- ============================================================
-- Espelha o trigger já existente de likes (update_post_likes_count).
-- Sem isso, o contador de comentários no feed não atualiza.

create or replace function update_post_comments_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update feed_posts set comments_count = coalesce(comments_count, 0) + 1
    where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update feed_posts set comments_count = greatest(coalesce(comments_count, 0) - 1, 0)
    where id = OLD.post_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

drop trigger if exists trg_post_comments_update_count on post_comments;
create trigger trg_post_comments_update_count
after insert or delete on post_comments
for each row execute function update_post_comments_count();

-- Reconcilia contagens existentes (caso já haja comentários).
update feed_posts fp
set comments_count = (
  select count(*) from post_comments pc where pc.post_id = fp.id
);
