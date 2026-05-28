-- Foto real da Nicole Benato (substitui o pravatar placeholder).
-- Fonte: nicolebenato.com.br (site oficial dela).

update public.hosts
set photo_url = 'https://nicolebenato.com.br/img/header.jpg'
where name = 'Nicole Benato';

-- Pilates é multi-host (Nicole + Lillyan), mas a foto representativa
-- do evento passa a ser a da Nicole.
update public.events
set host_photo_url = 'https://nicolebenato.com.br/img/header.jpg'
where slug = 'pilates-bundle';
