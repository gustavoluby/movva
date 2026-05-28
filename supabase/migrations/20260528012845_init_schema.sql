-- ============================================================
-- MOVVA APP — SUPABASE SCHEMA v1
-- ============================================================
-- Banco de dados completo pra rodar o app
-- Cole no SQL Editor do Supabase e execute em ordem
-- ============================================================


-- ============================================================
-- 1. EXTENSÕES
-- ============================================================

create extension if not exists "pg_trgm"; -- pra busca textual


-- ============================================================
-- 2. USUÁRIAS
-- ============================================================
-- O Supabase já cria auth.users automaticamente quando alguém faz signup.
-- A tabela `profiles` estende o auth.users com dados do app.

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  handle text unique, -- @nicolebenato
  phone text,
  birthday date,
  city text default 'Curitiba',
  neighborhood text, -- Batel, Água Verde, etc.
  bio text,
  avatar_url text,
  
  -- Stats (cacheados pra ranking rápido)
  total_experiences int default 0,
  total_friends int default 0,
  total_badges int default 0,
  
  -- Status
  is_active boolean default true,
  is_verified boolean default false, -- selo de verificada
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_profiles_neighborhood on profiles(neighborhood);
create index idx_profiles_total_experiences on profiles(total_experiences desc);


-- ============================================================
-- 3. ANFITRIÃS (hosts dos eventos)
-- ============================================================

create table public.hosts (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete set null, -- se for usuária do app
  
  name text not null, -- "Nicole Benato + Lillyan Vercino"
  bio text,
  photo_url text,
  instagram text,
  
  is_verified boolean default false,
  total_events int default 0,
  rating numeric(3,2), -- 4.85
  
  created_at timestamptz default now()
);


-- ============================================================
-- 4. EVENTOS
-- ============================================================

create table public.events (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null, -- 'pilates-bundle', 'yoga-mia'
  
  -- Conteúdo
  title text not null,
  subtitle text,
  description text,
  category text, -- 'Yoga · Premium', 'Esporte · Recorrente'
  cat_tag text, -- 'Yoga Premium' (mostrado no card)
  
  -- Quando
  event_date date not null,
  event_time text, -- '19h às 22h' (livre, não constraint de hora exata)
  duration text, -- '3h', 'noite', 'manhã'
  is_recurring boolean default false,
  recurrence_rule text, -- 'weekly:thursday', 'monthly:first-saturday'
  
  -- Onde
  location_name text not null, -- 'Studio ONCÈ'
  location_short text, -- 'Batel'
  location_address text,
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  
  -- Negócio
  price_cents int not null, -- R$ 179 = 17900
  capacity int not null,
  going_count int default 0, -- cache, atualizado por trigger
  
  -- Mídia
  image_url text,
  thumb_url text,
  
  -- Visual
  tag text, -- 'Destaque · Vagas limitadas'
  tag_style text default 'accent', -- 'primary' | 'accent'
  is_featured boolean default false,
  
  -- Status
  status text default 'published', -- 'draft' | 'published' | 'cancelled' | 'completed'
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_events_date on events(event_date);
create index idx_events_status on events(status);
create index idx_events_featured on events(is_featured) where is_featured = true;


-- ============================================================
-- 5. EVENT_HOSTS (anfitriãs de cada evento — N pra N)
-- ============================================================

create table public.event_hosts (
  event_id uuid references events(id) on delete cascade,
  host_id uuid references hosts(id) on delete cascade,
  role text, -- 'principal' | 'co-anfitria' | 'palestrante'
  primary key (event_id, host_id)
);


-- ============================================================
-- 6. EVENT_ACTIVITIES (o que tá incluso em cada evento)
-- ============================================================

create table public.event_activities (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  icon text, -- 'yoga', 'spa', 'makeup', 'wine', 'gift'
  name text not null,
  duration text, -- opcional
  sort_order int default 0
);

create index idx_event_activities_event on event_activities(event_id, sort_order);


-- ============================================================
-- 7. RESERVAS (bookings)
-- ============================================================

create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  
  -- Pagamento
  amount_cents int not null,
  discount_cents int default 0,
  coupon_code text,
  payment_method text, -- 'pix' | 'card'
  payment_status text default 'pending', -- 'pending' | 'paid' | 'refunded' | 'cancelled'
  payment_id text, -- ID do Pagar.me/Asaas
  paid_at timestamptz,
  
  -- Status da reserva
  status text default 'confirmed', -- 'confirmed' | 'cancelled' | 'attended' | 'no-show'
  
  -- Check-in
  checked_in_at timestamptz,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Uma usuária só pode reservar um evento uma vez
  unique(user_id, event_id)
);

create index idx_bookings_user on bookings(user_id);
create index idx_bookings_event on bookings(event_id);
create index idx_bookings_status on bookings(status);


-- ============================================================
-- 8. TRIBOS
-- ============================================================

create table public.tribes (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  description text,
  
  type text not null, -- 'tema' | 'bairro' | 'demografia'
  type_label text, -- 'Bem-estar', 'Esporte', 'Maternidade'
  
  icon text, -- ✿ ☾ ❀
  cover_url text,
  
  member_count int default 0, -- cache
  
  created_at timestamptz default now()
);

create index idx_tribes_type on tribes(type);


-- ============================================================
-- 9. TRIBE_MEMBERS (quem tá em qual tribo)
-- ============================================================

create table public.tribe_members (
  tribe_id uuid references tribes(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (tribe_id, user_id)
);

create index idx_tribe_members_user on tribe_members(user_id);


-- ============================================================
-- 10. POSTS DO FEED (check-ins)
-- ============================================================

create table public.feed_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade, -- opcional (post pode não estar amarrado a evento)
  tribe_id uuid references tribes(id) on delete set null, -- pode ser post da tribo
  
  -- Conteúdo
  text text,
  photo_url text,
  rating int check (rating between 1 and 5), -- vibe geral (1-5 emojis)
  
  -- Stats (cache)
  likes_count int default 0,
  comments_count int default 0,
  
  created_at timestamptz default now()
);

create index idx_feed_posts_created on feed_posts(created_at desc);
create index idx_feed_posts_event on feed_posts(event_id);
create index idx_feed_posts_user on feed_posts(user_id);
create index idx_feed_posts_tribe on feed_posts(tribe_id);


-- ============================================================
-- 11. LIKES DE POSTS
-- ============================================================

create table public.post_likes (
  post_id uuid references feed_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);


-- ============================================================
-- 12. COMENTÁRIOS DE POSTS
-- ============================================================

create table public.post_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references feed_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

create index idx_post_comments_post on post_comments(post_id);


-- ============================================================
-- 13. IDEIAS (sugestões da comunidade — anônimas)
-- ============================================================

create table public.ideas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null, -- nullable pra anônimas
  
  -- Conteúdo
  text text not null,
  tag text, -- 'Caminhada', 'Encontro', 'Bem-estar'
  avatar_emoji text default '✿', -- símbolo aleatório
  
  -- Status
  status text default 'pending', -- 'pending' | 'trending' | 'approved' | 'rejected'
  
  -- Stats
  likes_count int default 0,
  comments_count int default 0,
  
  -- Privacidade
  is_anonymous boolean default true,
  
  created_at timestamptz default now()
);

create index idx_ideas_status on ideas(status);
create index idx_ideas_likes on ideas(likes_count desc);


-- ============================================================
-- 14. LIKES DE IDEIAS
-- ============================================================

create table public.idea_likes (
  idea_id uuid references ideas(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (idea_id, user_id)
);


-- ============================================================
-- 15. PROFISSIONAIS (marketplace Indica)
-- ============================================================

create table public.professionals (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  
  -- Identificação
  name text not null, -- 'Bia Camargo'
  studio_name text not null, -- 'Bia Sobrancelha Studio'
  handle text, -- '@biasobrancelha'
  bio text,
  
  -- Mídia
  photo_url text, -- avatar (rosto)
  cover_url text,
  
  -- Categorias
  primary_category text not null, -- 'Sobrancelha', 'Drenagem', 'Cabelo'
  categories text[], -- ['Sobrancelha', 'Cílios']
  
  -- Localização
  location_short text, -- 'Batel'
  location_full text,
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  at_domicile boolean default false,
  
  -- Negócio
  price_from_cents int, -- R$ 80 = 8000
  whatsapp_number text,
  
  -- Validação
  is_verified boolean default false, -- selo Lótus/Movva
  is_featured boolean default false,
  
  -- Stats (cache)
  rating numeric(3,2),
  review_count int default 0,
  indications_count int default 0, -- quantas Curitibanas indicaram
  
  -- Status
  status text default 'active', -- 'active' | 'paused' | 'rejected'
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_professionals_category on professionals(primary_category);
create index idx_professionals_status on professionals(status);
create index idx_professionals_rating on professionals(rating desc);


-- ============================================================
-- 16. SERVIÇOS DAS PROFISSIONAIS
-- ============================================================

create table public.professional_services (
  id uuid default gen_random_uuid() primary key,
  professional_id uuid references professionals(id) on delete cascade,
  name text not null, -- 'Design + henna'
  duration text, -- '40min'
  price_cents int not null,
  sort_order int default 0
);

create index idx_pro_services_pro on professional_services(professional_id);


-- ============================================================
-- 17. PORTFÓLIO DAS PROFISSIONAIS
-- ============================================================

create table public.professional_portfolio (
  id uuid default gen_random_uuid() primary key,
  professional_id uuid references professionals(id) on delete cascade,
  photo_url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);


-- ============================================================
-- 18. AVALIAÇÕES DAS PROFISSIONAIS
-- ============================================================

create table public.professional_reviews (
  id uuid default gen_random_uuid() primary key,
  professional_id uuid references professionals(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  text text,
  created_at timestamptz default now()
);

create index idx_pro_reviews_pro on professional_reviews(professional_id);


-- ============================================================
-- 19. INDICAÇÕES DAS PROFISSIONAIS
-- (quando uma usuária indica uma profissional)
-- ============================================================

create table public.professional_indications (
  professional_id uuid references professionals(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (professional_id, user_id)
);


-- ============================================================
-- 20. CUPONS DE DESCONTO
-- ============================================================

create table public.coupons (
  code text primary key, -- 'PRIMEIRA'
  description text,
  discount_type text not null, -- 'fixed' | 'percentage'
  discount_value int not null, -- cents se fixed, % se percentage
  
  -- Regras
  min_amount_cents int default 0,
  max_uses int, -- null = ilimitado
  uses_count int default 0,
  
  -- Validade
  valid_from timestamptz default now(),
  valid_until timestamptz,
  
  -- Restrições
  first_purchase_only boolean default false,
  
  is_active boolean default true,
  created_at timestamptz default now()
);


-- ============================================================
-- 21. CUPONS USADOS POR USUÁRIA
-- ============================================================

create table public.coupon_usages (
  coupon_code text references coupons(code) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  booking_id uuid references bookings(id) on delete cascade,
  used_at timestamptz default now(),
  primary key (coupon_code, user_id, booking_id)
);


-- ============================================================
-- 22. BADGES / SELOS
-- ============================================================

create table public.badges (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  description text,
  icon text, -- ✿ ☾ ❀ ✦
  
  -- Critério
  criteria_type text, -- 'events_count' | 'streak' | 'tribe_join' | 'manual'
  criteria_value int, -- "5 eventos", "3 semanas seguidas"
  
  created_at timestamptz default now()
);


-- ============================================================
-- 23. BADGES CONQUISTADAS
-- ============================================================

create table public.user_badges (
  user_id uuid references profiles(id) on delete cascade,
  badge_id uuid references badges(id) on delete cascade,
  earned_at timestamptz default now(),
  primary key (user_id, badge_id)
);


-- ============================================================
-- 24. AMIZADES (quem é amiga de quem — pra "novas amigas")
-- ============================================================

create table public.friendships (
  user_id uuid references profiles(id) on delete cascade,
  friend_id uuid references profiles(id) on delete cascade,
  -- como se conheceram
  met_at_event_id uuid references events(id) on delete set null,
  created_at timestamptz default now(),
  primary key (user_id, friend_id),
  check (user_id != friend_id)
);


-- ============================================================
-- 25. NOTIFICAÇÕES
-- ============================================================

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  
  type text not null, -- 'event_reminder', 'new_post', 'like', 'comment', 'tribe_activity'
  title text not null,
  body text,
  link text, -- '/event/yoga-mia'
  
  read_at timestamptz,
  created_at timestamptz default now()
);

create index idx_notifications_user_unread on notifications(user_id) where read_at is null;


-- ============================================================
-- TRIGGERS PRA MANTER OS CACHES ATUALIZADOS
-- ============================================================

-- Atualizar going_count nos eventos quando reserva é criada/cancelada
create or replace function update_event_going_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and NEW.payment_status = 'paid' then
    update events set going_count = going_count + 1 where id = NEW.event_id;
  elsif TG_OP = 'UPDATE' then
    if OLD.payment_status != 'paid' and NEW.payment_status = 'paid' then
      update events set going_count = going_count + 1 where id = NEW.event_id;
    elsif OLD.payment_status = 'paid' and NEW.payment_status != 'paid' then
      update events set going_count = going_count - 1 where id = NEW.event_id;
    end if;
  elsif TG_OP = 'DELETE' and OLD.payment_status = 'paid' then
    update events set going_count = going_count - 1 where id = OLD.event_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger trg_bookings_update_event_count
after insert or update or delete on bookings
for each row execute function update_event_going_count();


-- Atualizar member_count das tribos
create or replace function update_tribe_member_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update tribes set member_count = member_count + 1 where id = NEW.tribe_id;
  elsif TG_OP = 'DELETE' then
    update tribes set member_count = member_count - 1 where id = OLD.tribe_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger trg_tribe_members_update_count
after insert or delete on tribe_members
for each row execute function update_tribe_member_count();


-- Atualizar total_experiences do profile quando reserva é paga
create or replace function update_profile_experiences()
returns trigger as $$
begin
  if (TG_OP = 'INSERT' and NEW.payment_status = 'paid') or
     (TG_OP = 'UPDATE' and OLD.payment_status != 'paid' and NEW.payment_status = 'paid') then
    update profiles set total_experiences = total_experiences + 1 where id = NEW.user_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_bookings_update_profile_experiences
after insert or update on bookings
for each row execute function update_profile_experiences();


-- Atualizar likes_count em feed_posts
create or replace function update_post_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update feed_posts set likes_count = likes_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update feed_posts set likes_count = likes_count - 1 where id = OLD.post_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger trg_post_likes_update_count
after insert or delete on post_likes
for each row execute function update_post_likes_count();


-- Atualizar indications_count em professionals
create or replace function update_pro_indications_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update professionals set indications_count = indications_count + 1 where id = NEW.professional_id;
  elsif TG_OP = 'DELETE' then
    update professionals set indications_count = indications_count - 1 where id = OLD.professional_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger trg_pro_indications_update_count
after insert or delete on professional_indications
for each row execute function update_pro_indications_count();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Regras de quem pode ler/escrever cada tabela

-- Habilitar RLS em todas as tabelas
alter table profiles enable row level security;
alter table hosts enable row level security;
alter table events enable row level security;
alter table event_hosts enable row level security;
alter table event_activities enable row level security;
alter table bookings enable row level security;
alter table tribes enable row level security;
alter table tribe_members enable row level security;
alter table feed_posts enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;
alter table ideas enable row level security;
alter table idea_likes enable row level security;
alter table professionals enable row level security;
alter table professional_services enable row level security;
alter table professional_portfolio enable row level security;
alter table professional_reviews enable row level security;
alter table professional_indications enable row level security;
alter table coupons enable row level security;
alter table coupon_usages enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table friendships enable row level security;
alter table notifications enable row level security;

-- PROFILES: todas podem ler, só você pode editar o seu
create policy "Profiles são públicos pra leitura" on profiles for select using (true);
create policy "Atualize só seu próprio perfil" on profiles for update using (auth.uid() = id);
create policy "Insira só seu próprio perfil" on profiles for insert with check (auth.uid() = id);

-- EVENTS: todas podem ler eventos publicados
create policy "Eventos publicados são visíveis" on events for select using (status = 'published');

-- HOSTS, EVENT_HOSTS, EVENT_ACTIVITIES, TRIBES: leitura pública
create policy "Hosts públicos" on hosts for select using (true);
create policy "Event hosts públicos" on event_hosts for select using (true);
create policy "Event activities públicas" on event_activities for select using (true);
create policy "Tribos públicas" on tribes for select using (true);

-- BOOKINGS: só você vê suas reservas
create policy "Veja suas próprias reservas" on bookings for select using (auth.uid() = user_id);
create policy "Crie suas próprias reservas" on bookings for insert with check (auth.uid() = user_id);
create policy "Atualize suas próprias reservas" on bookings for update using (auth.uid() = user_id);

-- TRIBE_MEMBERS: leitura pública, escrita só sua
create policy "Membros visíveis" on tribe_members for select using (true);
create policy "Entre em tribos você mesma" on tribe_members for insert with check (auth.uid() = user_id);
create policy "Saia de tribos você mesma" on tribe_members for delete using (auth.uid() = user_id);

-- FEED_POSTS: leitura pública, escrita só sua
create policy "Posts visíveis" on feed_posts for select using (true);
create policy "Poste só do seu nome" on feed_posts for insert with check (auth.uid() = user_id);
create policy "Edite só seus posts" on feed_posts for update using (auth.uid() = user_id);
create policy "Delete só seus posts" on feed_posts for delete using (auth.uid() = user_id);

-- POST_LIKES: leitura pública, like só seu
create policy "Likes visíveis" on post_likes for select using (true);
create policy "Curta como você" on post_likes for insert with check (auth.uid() = user_id);
create policy "Descurta como você" on post_likes for delete using (auth.uid() = user_id);

-- POST_COMMENTS
create policy "Comentários visíveis" on post_comments for select using (true);
create policy "Comente como você" on post_comments for insert with check (auth.uid() = user_id);
create policy "Edite só seus comentários" on post_comments for update using (auth.uid() = user_id);

-- IDEAS: públicas, escrita só sua
create policy "Ideias visíveis" on ideas for select using (true);
create policy "Mande ideias como você" on ideas for insert with check (auth.uid() = user_id or user_id is null);

create policy "Likes de ideias visíveis" on idea_likes for select using (true);
create policy "Curta ideias como você" on idea_likes for insert with check (auth.uid() = user_id);
create policy "Descurta ideias como você" on idea_likes for delete using (auth.uid() = user_id);

-- PROFESSIONALS: ativos visíveis pra todas
create policy "Profissionais ativas visíveis" on professionals for select using (status = 'active');
create policy "Serviços visíveis" on professional_services for select using (true);
create policy "Portfólio visível" on professional_portfolio for select using (true);
create policy "Avaliações visíveis" on professional_reviews for select using (true);
create policy "Avalie profissionais como você" on professional_reviews for insert with check (auth.uid() = user_id);

-- INDICAÇÕES
create policy "Indicações visíveis" on professional_indications for select using (true);
create policy "Indique profissionais como você" on professional_indications for insert with check (auth.uid() = user_id);
create policy "Retire indicação como você" on professional_indications for delete using (auth.uid() = user_id);

-- COUPONS: ativos visíveis
create policy "Cupons ativos visíveis" on coupons for select using (is_active = true);

-- BADGES
create policy "Badges visíveis" on badges for select using (true);
create policy "Badges conquistadas visíveis" on user_badges for select using (true);

-- NOTIFICATIONS: só você vê
create policy "Suas notificações" on notifications for select using (auth.uid() = user_id);
create policy "Marque suas notificações" on notifications for update using (auth.uid() = user_id);

-- FRIENDSHIPS
create policy "Amizades visíveis" on friendships for select using (true);
create policy "Crie amizades como você" on friendships for insert with check (auth.uid() = user_id);


-- ============================================================
-- SEED DATA — DADOS INICIAIS PRA TESTAR
-- ============================================================

-- Cupom de primeira compra
insert into coupons (code, description, discount_type, discount_value, first_purchase_only)
values ('PRIMEIRA', 'Cupom de boas-vindas', 'fixed', 1000, true);

-- Badges
insert into badges (slug, name, description, icon, criteria_type, criteria_value) values
  ('primeira-experiencia', 'Primeira Pétala', 'Sua primeira experiência Movva', '✿', 'events_count', 1),
  ('cinco-experiencias', 'Em Plena Floração', '5 experiências completadas', '❀', 'events_count', 5),
  ('dez-experiencias', 'Jardim Próprio', '10 experiências completadas', '✦', 'events_count', 10),
  ('streak-mes', 'Constância', '4 semanas seguidas', '☾', 'streak', 4),
  ('embaixadora', 'Embaixadora', 'Indicou 5 amigas pro Movva', '✧', 'manual', 5);

-- Tribos iniciais (as 13 que você definiu)
insert into tribes (slug, name, type, type_label, icon, description) values
  ('yoguinis', 'Yoguinis', 'tema', 'Bem-estar', '☾', 'Pra quem respira yoga em Curitiba inteira.'),
  ('pilatistas', 'Pilatistas', 'tema', 'Bem-estar', '✦', 'Solo, reformer, máquina. Quem faz com método.'),
  ('futevolei-cwb', 'Futevôlei das Curitibanas', 'tema', 'Esporte', '☀', 'Quem joga (ou quer aprender) em Curitiba.'),
  ('volei-fem', 'Vôlei das Mulheres', 'tema', 'Esporte', '✧', 'Quintas à noite, recreativo, todos os níveis.'),
  ('maes-solteiras', 'Mães Solteiras pra Frente', 'demografia', 'Maternidade', '✿', 'Roda mensal + grupo de WhatsApp pra emergências.'),
  ('recem-solteiras', 'Recém-solteiras', 'demografia', 'Vida pessoal', '✻', 'A galera do Depois do Não. Ciclo de cura coletivo.'),
  ('maes-primeiras', 'Mães Primeiras', 'demografia', 'Maternidade', '❀', 'Primeiro filho, primeiras dúvidas, primeiras vitórias.'),
  ('empreendedoras', 'Empreendedoras Movva', 'tema', 'Carreira', '✦', 'CNPJs, sócias, freelas. Curitibanas no comando.'),
  ('bookers', 'Bookers', 'tema', 'Cultura', '✧', 'Quem vai no Clube do Livro + recomenda autoras.'),
  ('cuidado-alma', 'Cuidado da Alma', 'tema', 'Espiritualidade', '☽', 'Meditação, tarot, terapias holísticas e rituais.'),
  ('cwb-batel', 'Curitibanas Batel', 'bairro', 'Bairro', '◐', 'Pra encontros e indicações no Batel.'),
  ('cwb-aguaverde', 'Curitibanas Água Verde', 'bairro', 'Bairro', '◑', 'Tribo do bairro Água Verde e proximidades.'),
  ('cwb-sul', 'Sul de Curitiba', 'bairro', 'Região', '◒', 'Pinheirinho, Boqueirão, Capão Raso, Xaxim.');


-- ============================================================
-- TRIGGER PRA CRIAR PROFILE AUTOMATICAMENTE
-- ============================================================
-- Quando alguém faz signup pelo Supabase Auth, cria profile automático

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, handle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
-- Total: 24 tabelas + 6 triggers + RLS completo + seed data
-- ============================================================
