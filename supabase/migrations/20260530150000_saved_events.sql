-- Eventos salvos ("favoritados") pela usuária — aparecem na aba Minhas.
-- Separado de bookings (reserva/pagamento); salvar é só um marcador leve.

create table public.saved_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (user_id, event_id)
);

create index saved_events_user_idx on public.saved_events (user_id);

alter table public.saved_events enable row level security;

create policy "Veja seus próprios eventos salvos" on saved_events
  for select using (auth.uid() = user_id);
create policy "Salve eventos você mesma" on saved_events
  for insert with check (auth.uid() = user_id);
create policy "Remova seus próprios salvos" on saved_events
  for delete using (auth.uid() = user_id);
