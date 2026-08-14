-- Candidatura pra organizadora ("quero publicar um evento")
--
-- Qualquer usuária pode se candidatar pelo perfil; o admin aprova na fila de
-- /admin/aprovar e a aprovação é o que liga profiles.role = 'organizer'.
-- Uma candidatura por conta: recusada, ela ajusta e reenvia na mesma linha.

create table if not exists public.organizer_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,

  -- O que ela quer fazer + quem é ela (o que o admin lê pra decidir)
  event_idea text not null,
  about text,
  instagram text,
  phone text,

  status text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  admin_note text, -- resposta do admin quando recusa (ela lê no perfil)

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,

  constraint organizer_applications_status_check
    check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists organizer_applications_status_idx
  on public.organizer_applications (status, created_at desc);

alter table public.organizer_applications enable row level security;

-- Ela só enxerga a própria candidatura (pra ver o status e o recado do admin).
-- Escrita não tem policy de propósito: passa toda pelo service-role nas server
-- actions, que é o que impede alguém de se auto-aprovar mexendo em `status`.
drop policy if exists "Veja só a sua candidatura" on public.organizer_applications;
create policy "Veja só a sua candidatura"
  on public.organizer_applications
  for select using (auth.uid() = user_id);
