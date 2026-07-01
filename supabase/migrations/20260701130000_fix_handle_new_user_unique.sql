-- Corrige handle_new_user pra NUNCA estourar por colisão de handle.
--
-- Bug: o trigger gerava profiles.handle a partir do local-part do email
-- (split_part(email,'@',1)). Dois emails com o mesmo prefixo (ex.: gustavo@a.com
-- e gustavo@b.com) geravam o mesmo handle "gustavo", batendo na constraint
-- unique de profiles.handle. Como o trigger roda dentro do signup do Supabase
-- Auth, a exceção virava "Database error saving new user" e o cadastro falhava.
--
-- Fix: sanitiza o handle base e adiciona sufixo numérico até achar um livre.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_handle text;
  candidate text;
  n int := 0;
begin
  base_handle := regexp_replace(
    lower(coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1))),
    '[^a-z0-9_]', '', 'g'
  );
  if base_handle is null or base_handle = '' then
    base_handle := 'user';
  end if;

  candidate := base_handle;
  while exists (select 1 from public.profiles where handle = candidate) loop
    n := n + 1;
    candidate := base_handle || n::text;
  end loop;

  insert into public.profiles (id, full_name, handle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    candidate
  );
  return new;
end;
$$ language plpgsql security definer;
