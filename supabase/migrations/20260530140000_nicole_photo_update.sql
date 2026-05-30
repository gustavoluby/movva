-- Atualiza a foto da Nicole Benato para a nova (subida pro Storage do projeto).
-- Substitui a antiga (nicolebenato.com.br/img/header.jpg).
-- A imagem foi subida via scripts/update-nicole-photo.ts pro bucket event-images.

update public.hosts
set photo_url = 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/hosts/nicole-benato.jpg?v=4468203'
where name = 'Nicole Benato';

update public.events
set host_photo_url = 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/hosts/nicole-benato.jpg?v=4468203'
where slug = 'pilates-bundle';
