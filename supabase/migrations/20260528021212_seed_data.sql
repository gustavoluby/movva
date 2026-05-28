-- ============================================================
-- SEED DATA — gerado por scripts/generate-seed-sql.ts
-- ============================================================
-- Fonte: legacy/index.html (protótipo)
-- Imagens: já subidas em event-images, professional-images, tribe-covers
-- via scripts/seed-images.ts. URLs construídas a partir dos slugs.
--
-- Counts: 11 eventos · 12 hosts deduped ·
--         14 event_hosts · 10 profissionais ·
--         13 tribes (update cover_url)

-- ============================================================
-- ALTER hosts — adicionar contato operacional
-- ============================================================

alter table public.hosts
  add column if not exists contact_email text,
  add column if not exists contact_whatsapp text;

-- ============================================================
-- HOSTS (deduped) — 12 linhas
-- ============================================================

insert into public.hosts (name, bio, photo_url, contact_email, contact_whatsapp) values
  ('Nicole Benato', null, null, null, null),
  ('Lillyan Vercino', null, null, null, null),
  ('Mia', null, null, null, null),
  ('Letícia Borges', 'Curadora · escritora', 'https://i.pravatar.cc/300?img=41', null, null),
  ('Camila Reis', 'Psicóloga · grupos femininos', 'https://i.pravatar.cc/300?img=1', null, null),
  ('Lucca Café', 'Parceria oficial · cesta inclusa', 'https://i.pravatar.cc/300?img=34', null, null),
  ('Daniela Marques', 'Psicóloga + fotógrafa · 6 anos', 'https://i.pravatar.cc/300?img=25', null, null),
  ('Carolina Lima', 'Fotógrafa corporativa · 9 anos', 'https://i.pravatar.cc/300?img=9', null, null),
  ('Patrícia Andrade', 'Ex-jogadora · educadora física', 'https://i.pravatar.cc/300?img=16', null, null),
  ('Renata Camargo', 'Professora de futevôlei · 6 anos', 'https://i.pravatar.cc/300?img=48', null, null),
  ('Beatriz Almeida', 'Psicóloga · maternidades múltiplas', 'https://i.pravatar.cc/300?img=47', null, null),
  ('Aline Verdi', 'Terapeuta holística · 10 anos', 'https://i.pravatar.cc/300?img=11', null, null);

-- ============================================================
-- EVENTS — 11 linhas
-- ============================================================

insert into public.events (
  slug, title, subtitle, description, category, cat_tag,
  event_date, event_time, duration,
  location_name, location_short,
  price_cents, capacity, going_count,
  image_url, thumb_url,
  tag, tag_style, is_featured, status
) values
  (
    'pilates-bundle', 'Pilates, Autocuidado & Vinho', 'Uma noite pensada pra movimento, beleza e conexão', 'Uma noite pensada pra movimento, beleza e conexão. Pilates de solo no tapetinho pra ativar o corpo, autodrenagem facial guiada, workshop de automaquiagem, vinho leve e boas conversas. No fim, brindes e ativações de marcas parceiras pra você levar pra casa. Um encontro de mulheres pra se mover, se cuidar e se divertir.',
    'Encontro de Mulheres · Bundle', 'Encontro',
    '2026-06-19', '19h em diante', 'noite',
    'Studio ONCÈ', 'Studio ONCÈ',
    17900, 18, 11,
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/pilates-bundle.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/pilates-bundle.jpg',
    'Destaque · Vagas limitadas', 'primary', true, 'published'
  ),
  (
    'yoga-mia', 'Yoga com Mia & Ritual de Beleza', 'Yoga terapia + drenagem Renata França + ensaio fotográfico', 'Manhã premium pra você. Yoga terapia conduzida pela Mia — uma das professoras mais queridas de Curitiba, em aula exclusiva pro grupo Lótus. Drenagem linfática localizada no abdômen com a técnica Renata França pela Nicole Benato. E pra fechar, ensaio fotográfico pocket pra cada uma sair com fotos lindas.',
    'Yoga · Premium', 'Yoga Premium',
    '2026-07-19', '10h em diante', 'manhã',
    'Oncè Studio', 'Oncè Studio',
    28000, 18, 9,
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/yoga-mia.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/yoga-mia.jpg',
    'Em destaque', 'primary', false, 'published'
  ),
  (
    'clube-livro', 'Clube do Livro Lótus', 'Encontro mensal oficial · autoras brasileiras', 'O clube oficial do app. Toda primeira quinta do mês, um livro novo, novas amigas. Este mês: "Torto Arado", de Itamar Vieira Junior. O ingresso inclui chá, café e doces. Não precisa ter lido tudo — só ter ido pelo menos pelo meio. A roda de conversa é a alma do encontro.',
    'Encontro · Mensal', 'Encontro',
    '2026-06-12', '19h30 às 22h', '2h30',
    'Café da Esquina · Mercês', 'Mercês',
    4500, 20, 16,
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/clube-livro.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/clube-livro.jpg',
    'Recorrente · mensal', 'accent', false, 'published'
  ),
  (
    'depois-do-nao', 'Depois do Não', 'Roda íntima pra recém-solteiras', 'Um encontro pra quem acabou de sair de relacionamento e tá na fase de "tô bem, mas tô meio perdida". Roda guiada por psicóloga, dinâmicas de criação de vínculo, drinks e petiscos. Vagas limitadas a 12 mulheres porque intimidade não escala. Você chega sozinha, sai com amigas de verdade.',
    'Encontro · Cura', 'Roda íntima',
    '2026-06-06', '19h30 às 22h30', '3h',
    'Casa Florescer · Juvevê', 'Juvevê',
    6500, 12, 8,
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/depois-do-nao.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/depois-do-nao.jpg',
    '12 vagas só', 'accent', false, 'published'
  ),
  (
    'piquenique-barigui', 'Piquenique no Barigui', 'Manhã ao ar livre · parceria Lucca Café', 'Encontro no início da manhã no Barigui antes do parque encher. Cesta individual de café da manhã da Lucca pra cada uma — pão de fermentação natural, frutas da estação, café especial, doces e salgados. Levamos mantas, almofadas e mesinhas baixas. Em caso de chuva, remarcamos pro fim de semana seguinte.',
    'Ao ar livre · Brunch', 'Ao ar livre',
    '2026-06-14', '9h às 12h', '3h',
    'Parque Barigui · Pinhais', 'Barigui',
    9500, 24, 17,
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/piquenique-barigui.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/piquenique-barigui.jpg',
    'Parceria Lucca', 'accent', false, 'published'
  ),
  (
    'ensaio-autoestima', 'Ensaio Autoestima', 'Roda de autocuidado + ensaio que celebra você', 'Uma tarde pra você se olhar com outros olhos. Começamos com uma roda de autoestima conduzida por psicóloga, depois maquiagem natural respeitando seus traços, ensaio fotográfico individual e fechamento com cartas que você escreve pra você mesma. Você sai daqui com fotos lindas e algo a mais — que é difícil de nomear.',
    'Bem-estar · Cura', 'Autoestima',
    '2026-06-21', '13h às 17h', '4h',
    'Atelier Luz · Água Verde', 'Água Verde',
    19500, 10, 7,
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/ensaio-autoestima.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/ensaio-autoestima.jpg',
    'Curativo · 10 vagas', 'accent', false, 'published'
  ),
  (
    'ensaio-pocket-pro', 'Ensaio Pocket Profissional', 'Foto profissional + LinkedIn em 90 min', 'Sai do trabalho, vem fazer sua foto profissional pronta pro LinkedIn e perfis. Sessão pocket de 10 minutos com fotógrafa profissional, orientação rápida de pose e expressão, entrega digital de 8 fotos editadas no mesmo dia. Pra quem cansou de usar foto ruim no LinkedIn e não quer pagar caro por um ensaio gigante.',
    'Carreira · Imagem', 'Express',
    '2026-06-18', '19h às 20h30', '90min',
    'Estúdio Claro · Centro', 'Centro',
    14500, 12, 8,
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/ensaio-pocket-pro.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/ensaio-pocket-pro.jpg',
    'Express · após o trabalho', 'primary', false, 'published'
  ),
  (
    'volei-feminino', 'Vôlei Feminino · Quintas', 'Time recreativo · todos os níveis', 'Treino recreativo de vôlei feminino toda quinta. Aquecimento guiado, fundamentos pra quem tá começando, e jogo de verdade no final. Não precisa saber nada — a turma é de iniciante a quem já joga há anos. Quadra coberta, então funciona com chuva também.',
    'Esporte · Recorrente', 'Vôlei',
    '2026-06-05', '19h às 21h', '2h',
    'Quadra Coberta · Tarumã', 'Tarumã',
    3500, 16, 12,
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/volei-feminino.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/volei-feminino.jpg',
    'Toda semana', 'accent', false, 'published'
  ),
  (
    'futevolei-feminino', 'Futevôlei das Curitibanas', 'Areia, sol e turma só de mulher', 'Manhã de futevôlei só pra mulheres em Curitiba. Aquecimento, técnicas de toque e cortada com professora, mini-torneio entre duplas, e café com fruta no final pra refrescar. Areia, sol e papo bom. Não precisa ter equipamento.',
    'Esporte · Areia', 'Futevôlei',
    '2026-06-07', '9h às 12h', '3h',
    'Arena Beach · Pinheirinho', 'Pinheirinho',
    4500, 20, 14,
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/futevolei-feminino.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/futevolei-feminino.jpg',
    'Sábado de manhã', 'accent', false, 'published'
  ),
  (
    'maes-solteiras', 'Mães Solteiras pra Frente', 'Roda de mães + crianças cuidadas no espaço ao lado', 'Encontro mensal pra mães solteiras criarem rede e respirar fundo. Roda guiada por psicóloga especializada em maternidade, dinâmica de trocas de "coisas que ninguém te conta", e café da tarde. As crianças (até 8 anos) ficam num espaço ao lado com duas recreadoras — você fica perto, mas com tempo só seu.',
    'Encontro · Maternidade', 'Maternidade',
    '2026-06-28', '14h às 17h30', '3h30',
    'Casa Florescer · Juvevê', 'Juvevê',
    5500, 15, 11,
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/maes-solteiras.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/maes-solteiras.jpg',
    'Crianças incluídas', 'primary', false, 'published'
  ),
  (
    'cuidado-espiritual', 'Roda de Cuidado Espiritual', 'Meditação, sound healing, tarot e banho de ervas', 'Uma tarde pra desligar da pressa. Meditação guiada com tigelas tibetanas, roda sagrada feminina pra colocar pra fora o que tá pesando, leitura de tarot pessoal pra cada uma e um banho de ervas (já feito por terapeuta) pra você levar pra casa. Chá quente o tempo todo. Sem dogma, sem religião — só cuidado da alma.',
    'Espiritualidade · Vivência', 'Espiritual',
    '2026-06-22', '16h às 19h30', '3h30',
    'Casa Lua · Alto da XV', 'Alto da XV',
    13000, 12, 9,
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/cuidado-espiritual.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/event-images/cuidado-espiritual.jpg',
    '12 vagas íntimas', 'accent', false, 'published'
  );

-- ============================================================
-- EVENT_HOSTS — 14 vínculos N:N
-- ============================================================

insert into public.event_hosts (event_id, host_id, role)
select e.id, h.id, link.role
from (values
  ('pilates-bundle', 'Nicole Benato', 'principal'),
  ('pilates-bundle', 'Lillyan Vercino', 'principal'),
  ('yoga-mia', 'Mia', 'principal'),
  ('yoga-mia', 'Nicole Benato', 'co-anfitria'),
  ('yoga-mia', 'Lillyan Vercino', 'co-anfitria'),
  ('clube-livro', 'Letícia Borges', 'principal'),
  ('depois-do-nao', 'Camila Reis', 'principal'),
  ('piquenique-barigui', 'Lucca Café', 'principal'),
  ('ensaio-autoestima', 'Daniela Marques', 'principal'),
  ('ensaio-pocket-pro', 'Carolina Lima', 'principal'),
  ('volei-feminino', 'Patrícia Andrade', 'principal'),
  ('futevolei-feminino', 'Renata Camargo', 'principal'),
  ('maes-solteiras', 'Beatriz Almeida', 'principal'),
  ('cuidado-espiritual', 'Aline Verdi', 'principal')
) as link(event_slug, host_name, role)
join public.events e on e.slug = link.event_slug
join public.hosts h on h.name = link.host_name;

-- ============================================================
-- EVENT_ACTIVITIES — 40 linhas
-- ============================================================

insert into public.event_activities (event_id, icon, name, duration, sort_order)
select e.id, a.icon, a.name, nullif(a.duration, ''), a.sort_order
from (values
  ('pilates-bundle', 'yoga', 'Pilates de solo no tapetinho', '', 0),
  ('pilates-bundle', 'spa', 'Auto drenagem facial', '', 1),
  ('pilates-bundle', 'makeup', 'Workshop de auto maquiagem', '', 2),
  ('pilates-bundle', 'wine', 'Vinho leve e boas conversas', '', 3),
  ('pilates-bundle', 'gift', 'Brindes e ativações', '', 4),
  ('yoga-mia', 'yoga', 'Yoga terapia com Mia', '', 0),
  ('yoga-mia', 'spa', 'Drenagem Renata França (abdômen)', '', 1),
  ('yoga-mia', 'camera', 'Ensaio fotográfico pocket', '', 2),
  ('clube-livro', 'chat', 'Roda de conversa guiada', '90min', 0),
  ('clube-livro', 'coffee', 'Chá, café & doces', 'inclusos', 1),
  ('clube-livro', 'gift', 'Sorteio do livro de junho', '15min', 2),
  ('depois-do-nao', 'chat', 'Roda guiada por psicóloga', '90min', 0),
  ('depois-do-nao', 'heart', 'Dinâmicas de vínculo', '45min', 1),
  ('depois-do-nao', 'wine', 'Drinks & petiscos', 'inclusos', 2),
  ('piquenique-barigui', 'basket', 'Cesta Lucca individual', 'inclusa', 0),
  ('piquenique-barigui', 'coffee', 'Estação de café especial', '3h', 1),
  ('piquenique-barigui', 'gift', 'Manta + almofada (sua)', 'leva pra casa', 2),
  ('ensaio-autoestima', 'chat', 'Roda de autoestima', '60min', 0),
  ('ensaio-autoestima', 'makeup', 'Maquiagem natural', '30min', 1),
  ('ensaio-autoestima', 'camera', 'Ensaio individual', '20min cada', 2),
  ('ensaio-autoestima', 'heart', 'Cartas pra si mesma', '30min', 3),
  ('ensaio-pocket-pro', 'camera', 'Sessão pocket profissional', '10min cada', 0),
  ('ensaio-pocket-pro', 'chat', 'Orientação de pose', '15min', 1),
  ('ensaio-pocket-pro', 'gift', '8 fotos editadas', 'no mesmo dia', 2),
  ('ensaio-pocket-pro', 'spa', 'Mini-consultoria de styling', '10min', 3),
  ('volei-feminino', 'yoga', 'Aquecimento + alongamento', '20min', 0),
  ('volei-feminino', 'chat', 'Fundamentos pra novatas', '30min', 1),
  ('volei-feminino', 'heart', 'Jogo dirigido', '70min', 2),
  ('futevolei-feminino', 'yoga', 'Aquecimento na areia', '15min', 0),
  ('futevolei-feminino', 'chat', 'Técnica com professora', '45min', 1),
  ('futevolei-feminino', 'heart', 'Mini-torneio entre duplas', '90min', 2),
  ('futevolei-feminino', 'coffee', 'Café & frutas', 'inclusos', 3),
  ('maes-solteiras', 'chat', 'Roda com psicóloga', '90min', 0),
  ('maes-solteiras', 'heart', 'Dinâmica de trocas', '45min', 1),
  ('maes-solteiras', 'coffee', 'Café da tarde', 'incluso', 2),
  ('maes-solteiras', 'gift', 'Espaço pras crianças (incluso)', '3h30', 3),
  ('cuidado-espiritual', 'spa', 'Meditação com tigelas tibetanas', '45min', 0),
  ('cuidado-espiritual', 'chat', 'Roda sagrada feminina', '60min', 1),
  ('cuidado-espiritual', 'heart', 'Tarot pessoal (15min cada)', '15min cada', 2),
  ('cuidado-espiritual', 'gift', 'Banho de ervas pra levar', 'incluso', 3)
) as a(event_slug, icon, name, duration, sort_order)
join public.events e on e.slug = a.event_slug;

-- ============================================================
-- PROFESSIONALS — 10 linhas
-- ============================================================

insert into public.professionals (
  slug, name, studio_name, handle, bio,
  photo_url, cover_url,
  primary_category, categories,
  location_short, location_full, at_domicile,
  price_from_cents, rating, review_count, indications_count,
  is_verified, is_featured, status
) values
  (
    'bia-sobrancelha', 'Bia Camargo', 'Bia Sobrancelha Studio', '@biasobrancelha', 'Design natural sem dor. Sobrancelha e cílios que duram, sem aquela cara de "fez no salão".',
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/bia-sobrancelha/photo.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/bia-sobrancelha/cover.jpg',
    'Sobrancelha', array['Sobrancelha', 'Cílios']::text[],
    'Batel', 'R. Comendador Araújo, 800 · Batel', false,
    8000, 4.9, 147, 23,
    true, true, 'active'
  ),
  (
    'studio-mariana', 'Mariana Rocha', 'Studio Mariana · Massagem & Drenagem', '@studiomarianarocha', 'Drenagem RF e massagem modeladora. Resultados pra evento ou pra vida.',
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/studio-mariana/photo.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/studio-mariana/cover.jpg',
    'Drenagem', array['Drenagem', 'Massagem']::text[],
    'Água Verde', 'Av. República Argentina, 1500 · Água Verde', true,
    18000, 4.8, 89, 18,
    true, false, 'active'
  ),
  (
    'carol-hair', 'Carolina Pacheco', 'Carol Hair', '@carolhair', 'Especialista em loiras e morenas iluminadas. Corte que respeita seu cabelo.',
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carol-hair/photo.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carol-hair/cover.jpg',
    'Cabelo', array['Cabelo', 'Coloração']::text[],
    'Mercês', 'R. Mateus Leme, 400 · Mercês', false,
    15000, 4.9, 203, 31,
    true, false, 'active'
  ),
  (
    'manu-estetica', 'Manuela Tavares', 'Manu Estética Facial', '@manu.estetica', 'Limpeza de pele que não machuca + protocolos pra cada tipo de pele. HydraFacial autorizado.',
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/manu-estetica/photo.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/manu-estetica/cover.jpg',
    'Estética facial', array['Estética', 'Limpeza de pele']::text[],
    'Centro', 'R. XV de Novembro, 1100 · Centro', false,
    22000, 4.7, 62, 12,
    true, false, 'active'
  ),
  (
    'leia-cilios', 'Leia Moreira', 'Cílios da Léia', '@ciliosdaleia', 'Cílios fio a fio e volume russo. Atende a domicílio pelo bairro do Cabral.',
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/leia-cilios/photo.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/leia-cilios/cover.jpg',
    'Cílios', array['Cílios', 'Sobrancelha']::text[],
    'Cabral', 'Atende em domicílio · Cabral e proximidades', true,
    18000, 4.9, 134, 14,
    false, false, 'active'
  ),
  (
    'drica-make', 'Adriana Lima', 'Drica Make', '@dricamake', 'Maquiagem social, noivas e formandas. Maquiagem que dura a noite inteira.',
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/drica-make/photo.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/drica-make/cover.jpg',
    'Maquiagem', array['Maquiagem', 'Noivas']::text[],
    'Em domicílio', 'Atende a domicílio · Curitiba toda', true,
    25000, 4.9, 88, 19,
    true, false, 'active'
  ),
  (
    'carmen-nails', 'Carmen Vieira', 'Carmen Nails', '@carmen.nails', 'Esmaltação em gel, fibra de vidro e alongamento. Bairro Juvevê.',
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carmen-nails/photo.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carmen-nails/cover.jpg',
    'Unhas', array['Unhas', 'Manicure']::text[],
    'Juvevê', 'R. Petit Carneiro, 200 · Juvevê', false,
    8000, 4.8, 156, 9,
    false, false, 'active'
  ),
  (
    'lara-nutri', 'Lara Santos', 'Nutri Lara', '@nutri.lara', 'Nutrição comportamental. Plano alimentar sem dieta restritiva.',
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/lara-nutri/photo.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/lara-nutri/cover.jpg',
    'Nutricionista', array['Nutrição', 'Bem-estar']::text[],
    'Online + Centro', 'Av. Sete de Setembro, 5000 · Centro', false,
    25000, 4.9, 98, 16,
    true, false, 'active'
  ),
  (
    'aline-yoga', 'Aline Borges', 'Aline Yoga Particular', '@aline.yoga', 'Yoga particular e pilates solo. Atende em domicílio e em studio próprio.',
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/aline-yoga/photo.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/aline-yoga/cover.jpg',
    'Yoga particular', array['Yoga', 'Pilates']::text[],
    'Em domicílio + Bigorrilho', 'Atende a domicílio · Bigorrilho e proximidades', true,
    12000, 5, 47, 8,
    false, false, 'active'
  ),
  (
    'psi-carol', 'Carolina Reis', 'Psi Carolina', '@psi.carol', 'Psicóloga clínica + grupos femininos. Foco em transições e relacionamentos.',
    'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/psi-carol/photo.jpg', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/psi-carol/cover.jpg',
    'Psicóloga', array['Terapia', 'Grupos']::text[],
    'Online + Batel', 'Av. Batel, 600 · Batel (e online)', false,
    20000, 5, 74, 22,
    true, false, 'active'
  );

-- ============================================================
-- PROFESSIONAL_SERVICES — 33 linhas
-- ============================================================

insert into public.professional_services (professional_id, name, duration, price_cents, sort_order)
select p.id, s.name, nullif(s.duration, ''), s.price_cents, s.sort_order
from (values
  ('bia-sobrancelha', 'Design + henna', '40min', 8000, 0),
  ('bia-sobrancelha', 'Design + brow lamination', '60min', 15000, 1),
  ('bia-sobrancelha', 'Extensão de cílios fio a fio', '2h', 25000, 2),
  ('bia-sobrancelha', 'Lash lifting', '1h', 18000, 3),
  ('studio-mariana', 'Drenagem linfática (1 sessão)', '60min', 18000, 0),
  ('studio-mariana', 'Drenagem RF localizada', '75min', 28000, 1),
  ('studio-mariana', 'Massagem modeladora', '60min', 22000, 2),
  ('studio-mariana', 'Pacote 10 drenagens', '60min cada', 150000, 3),
  ('carol-hair', 'Corte feminino', '60min', 15000, 0),
  ('carol-hair', 'Escova progressiva', '2h', 28000, 1),
  ('carol-hair', 'Mechas + corte', '3h', 45000, 2),
  ('carol-hair', 'Coloração + corte', '2h30', 38000, 3),
  ('manu-estetica', 'Limpeza de pele profunda', '75min', 22000, 0),
  ('manu-estetica', 'HydraFacial', '60min', 38000, 1),
  ('manu-estetica', 'Peeling químico', '45min', 28000, 2),
  ('manu-estetica', 'Protocolo anti-acne (4 sessões)', '60min cada', 120000, 3),
  ('leia-cilios', 'Cílios fio a fio', '1h30', 18000, 0),
  ('leia-cilios', 'Volume russo', '2h', 25000, 1),
  ('leia-cilios', 'Manutenção (15 dias)', '45min', 12000, 2),
  ('drica-make', 'Maquiagem social', '1h', 25000, 0),
  ('drica-make', 'Noivas (com prova)', 'dia inteiro', 65000, 1),
  ('drica-make', 'Formanda', '1h30', 35000, 2),
  ('carmen-nails', 'Esmaltação em gel', '60min', 8000, 0),
  ('carmen-nails', 'Fibra de vidro', '2h', 18000, 1),
  ('carmen-nails', 'Alongamento + decoração', '90min', 15000, 2),
  ('lara-nutri', 'Consulta + plano alimentar', '60min', 25000, 0),
  ('lara-nutri', 'Retorno', '45min', 15000, 1),
  ('lara-nutri', 'Pacote 3 meses (4 consultas)', '60min cada', 85000, 2),
  ('aline-yoga', 'Yoga particular avulsa', '60min', 12000, 0),
  ('aline-yoga', 'Pacote 4 aulas', '60min cada', 42000, 1),
  ('aline-yoga', 'Mensal (8 aulas)', '60min cada', 80000, 2),
  ('psi-carol', 'Sessão individual', '50min', 20000, 0),
  ('psi-carol', 'Grupo Mulheres em Transição', '90min · quinzenal', 12000, 1)
) as s(pro_slug, name, duration, price_cents, sort_order)
join public.professionals p on p.slug = s.pro_slug;

-- ============================================================
-- PROFESSIONAL_PORTFOLIO — 39 linhas
-- ============================================================

insert into public.professional_portfolio (professional_id, photo_url, sort_order)
select p.id, pp.photo_url, pp.sort_order
from (values
  ('bia-sobrancelha', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/bia-sobrancelha/portfolio-1.jpg', 0),
  ('bia-sobrancelha', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/bia-sobrancelha/portfolio-2.jpg', 1),
  ('bia-sobrancelha', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/bia-sobrancelha/portfolio-3.jpg', 2),
  ('bia-sobrancelha', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/bia-sobrancelha/portfolio-4.jpg', 3),
  ('bia-sobrancelha', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/bia-sobrancelha/portfolio-5.jpg', 4),
  ('bia-sobrancelha', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/bia-sobrancelha/portfolio-6.jpg', 5),
  ('studio-mariana', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/studio-mariana/portfolio-1.jpg', 0),
  ('studio-mariana', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/studio-mariana/portfolio-2.jpg', 1),
  ('studio-mariana', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/studio-mariana/portfolio-3.jpg', 2),
  ('studio-mariana', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/studio-mariana/portfolio-4.jpg', 3),
  ('carol-hair', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carol-hair/portfolio-1.jpg', 0),
  ('carol-hair', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carol-hair/portfolio-2.jpg', 1),
  ('carol-hair', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carol-hair/portfolio-3.jpg', 2),
  ('carol-hair', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carol-hair/portfolio-4.jpg', 3),
  ('carol-hair', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carol-hair/portfolio-5.jpg', 4),
  ('carol-hair', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carol-hair/portfolio-6.jpg', 5),
  ('manu-estetica', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/manu-estetica/portfolio-1.jpg', 0),
  ('manu-estetica', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/manu-estetica/portfolio-2.jpg', 1),
  ('manu-estetica', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/manu-estetica/portfolio-3.jpg', 2),
  ('manu-estetica', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/manu-estetica/portfolio-4.jpg', 3),
  ('leia-cilios', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/leia-cilios/portfolio-1.jpg', 0),
  ('leia-cilios', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/leia-cilios/portfolio-2.jpg', 1),
  ('leia-cilios', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/leia-cilios/portfolio-3.jpg', 2),
  ('drica-make', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/drica-make/portfolio-1.jpg', 0),
  ('drica-make', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/drica-make/portfolio-2.jpg', 1),
  ('drica-make', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/drica-make/portfolio-3.jpg', 2),
  ('drica-make', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/drica-make/portfolio-4.jpg', 3),
  ('carmen-nails', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carmen-nails/portfolio-1.jpg', 0),
  ('carmen-nails', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carmen-nails/portfolio-2.jpg', 1),
  ('carmen-nails', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/carmen-nails/portfolio-3.jpg', 2),
  ('lara-nutri', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/lara-nutri/portfolio-1.jpg', 0),
  ('lara-nutri', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/lara-nutri/portfolio-2.jpg', 1),
  ('lara-nutri', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/lara-nutri/portfolio-3.jpg', 2),
  ('aline-yoga', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/aline-yoga/portfolio-1.jpg', 0),
  ('aline-yoga', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/aline-yoga/portfolio-2.jpg', 1),
  ('aline-yoga', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/aline-yoga/portfolio-3.jpg', 2),
  ('psi-carol', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/psi-carol/portfolio-1.jpg', 0),
  ('psi-carol', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/psi-carol/portfolio-2.jpg', 1),
  ('psi-carol', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/professional-images/psi-carol/portfolio-3.jpg', 2)
) as pp(pro_slug, photo_url, sort_order)
join public.professionals p on p.slug = pp.pro_slug;

-- ============================================================
-- TRIBES — update cover_url (já foram seedadas no init_schema)
-- ============================================================

update public.tribes t set cover_url = c.url
from (values
  ('yoguinis', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/yoguinis.jpg'),
  ('pilatistas', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/pilatistas.jpg'),
  ('futevolei-cwb', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/futevolei-cwb.jpg'),
  ('volei-fem', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/volei-fem.jpg'),
  ('maes-solteiras', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/maes-solteiras.jpg'),
  ('recem-solteiras', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/recem-solteiras.jpg'),
  ('maes-primeiras', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/maes-primeiras.jpg'),
  ('empreendedoras', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/empreendedoras.jpg'),
  ('bookers', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/bookers.jpg'),
  ('cuidado-alma', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/cuidado-alma.jpg'),
  ('cwb-batel', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/cwb-batel.jpg'),
  ('cwb-aguaverde', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/cwb-aguaverde.jpg'),
  ('cwb-sul', 'https://ikoehiplcpekvexnmhgs.supabase.co/storage/v1/object/public/tribe-covers/cwb-sul.jpg')
) as c(slug, url)
where t.slug = c.slug;
