-- Papel de organizadora + fila de aprovação de experiências
--
-- Contexto: uma parceira vai criar eventos dentro do Moodpass. Ela precisa
-- criar/editar a experiência DELA e ver quem comprou — e nada além disso
-- (contas, cupons, vendas dos outros e estorno continuam só dos admins).
-- Todo evento criado por ela nasce em análise: só admin publica.

-- ---------------------------------------------------------------------------
-- profiles.role — 'member' (padrão) | 'organizer'
-- Admin continua sendo por allowlist de email (lib/admin.ts), não por coluna:
-- ninguém vira admin mexendo em dado.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'member';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('member', 'organizer'));
  end if;
end $$;

-- A policy de update de profiles é "atualize só o seu" — sem isso, qualquer
-- usuária poderia se promover a organizer pela API. O trigger devolve o valor
-- antigo quando a troca não vem do service-role (ou do SQL direto).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
  then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- events: dono + trilha de revisão + comissão combinada caso a caso
-- ---------------------------------------------------------------------------
alter table public.events
  add column if not exists owner_id uuid references public.profiles(id) on delete set null,
  -- Revisão: status ganha o valor 'pending_review' (em análise). Como a policy
  -- pública é `status = 'published'`, evento em análise não vaza pro site.
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists review_note text,
  -- Comissão do Moodpass: combinada evento a evento (pode ser zero).
  -- 'none' | 'percent' (commission_value = %) | 'fixed' (commission_value = R$)
  add column if not exists commission_type text not null default 'none',
  add column if not exists commission_value numeric(10, 2);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_commission_type_check'
  ) then
    alter table public.events
      add constraint events_commission_type_check
      check (commission_type in ('none', 'percent', 'fixed'));
  end if;
end $$;

create index if not exists events_owner_id_idx on public.events (owner_id);
create index if not exists events_status_idx on public.events (status);

comment on column public.events.owner_id is
  'Organizadora dona do evento (null = evento da casa/Moodpass).';
comment on column public.events.commission_value is
  'Percentual (commission_type=percent) ou valor fixo em reais (fixed).';
