-- ============================================================
-- events: host_summary + host_photo_url
-- ============================================================
-- Eventos multi-host (Pilates, Yoga) precisam de um texto/foto
-- representando o GRUPO de anfitriãs (não cabe nas linhas individuais
-- da tabela `hosts`). Eventos single-host deixam NULL aqui e a UI
-- usa bio/photo do host individual.

alter table public.events
  add column if not exists host_summary text,
  add column if not exists host_photo_url text;

update public.events
set host_summary = 'Estética + makeup profissional',
    host_photo_url = 'https://i.pravatar.cc/300?img=44'
where slug = 'pilates-bundle';

update public.events
set host_summary = 'Yoga terapia · estética · makeup',
    host_photo_url = 'https://i.pravatar.cc/300?img=19'
where slug = 'yoga-mia';
