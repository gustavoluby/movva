# Movva — Setup do Supabase

Guia passo a passo pra montar o banco de dados completo do app em ~30 minutos. Você não precisa ser dev pra fazer essa parte — só seguir os passos.

---

## O que vamos fazer

1. Criar conta no Supabase (5 min)
2. Criar projeto (2 min)
3. Rodar o SQL que monta tudo (5 min)
4. Configurar Storage pras imagens (5 min)
5. Configurar Auth pra login (5 min)
6. Pegar as credenciais pra usar no app (2 min)

No fim você vai ter:
- 24 tabelas montadas com relações certas
- Sistema de cache automático (contadores atualizam sozinhos)
- Regras de segurança configuradas (cada usuária só mexe nos próprios dados)
- 13 tribos pré-cadastradas
- 5 badges configuradas
- Cupom PRIMEIRA já criado

---

## Passo 1 — Criar conta no Supabase

1. Abre **supabase.com**
2. Clica em **Start your project**
3. Loga com GitHub (mais rápido) ou cria conta com email
4. Plano: **Free** serve perfeitamente pra começar (500MB de banco, 1GB de storage, até 50k usuárias ativas/mês — sobra muito)

---

## Passo 2 — Criar projeto

1. Botão **New project**
2. Preenche:
   - **Name:** `movva-prod` (ou `movva-dev` se for pra teste primeiro)
   - **Database Password:** GERA UMA SENHA FORTE e salva no 1Password/Bitwarden. Você vai precisar dela depois.
   - **Region:** `South America (São Paulo)` — mais perto = mais rápido pra usuárias brasileiras
   - **Pricing Plan:** Free
3. Clica em **Create new project**
4. Espera 1-2 minutos enquanto o projeto sobe

---

## Passo 3 — Rodar o SQL completo

1. No menu esquerdo do Supabase, clica em **SQL Editor** (ícone de </>) 
2. Clica em **New query**
3. Abre o arquivo **`movva-supabase-schema.sql`** que tá junto com este guia
4. Copia o conteúdo INTEIRO do arquivo
5. Cola no editor do Supabase
6. Clica no botão **Run** (ou Cmd/Ctrl + Enter)
7. Aguarda ~10 segundos

Você deve ver "Success. No rows returned" no final.

Se der erro, normalmente é porque:
- Você rodou em ordem errada → roda tudo de novo
- Conflito de extensões → me avisa qual erro deu

---

## Passo 4 — Configurar Storage pras imagens

Imagens dos eventos, fotos das profissionais, avatares — tudo isso vai pro Storage.

1. Menu esquerdo → **Storage**
2. Clica em **New bucket**
3. Cria 4 buckets (um por vez):

| Nome do bucket | Public? | Pra que serve |
|---|---|---|
| `event-images` | Sim | Capas dos eventos |
| `professional-images` | Sim | Fotos das profissionais do Indica |
| `feed-photos` | Sim | Fotos dos check-ins (Feed) |
| `avatars` | Sim | Fotos de perfil das usuárias |

Todos públicos (porque qualquer usuária pode ver), mas só dono pode fazer upload (configuramos depois com policies).

---

## Passo 5 — Configurar Authentication

1. Menu esquerdo → **Authentication** → **Providers**
2. **Email** já vem ligado. Recomendo:
   - **Enable email confirmations:** desliga por enquanto (pra testar fluxo sem precisar verificar email)
3. **Phone** (opcional): ativa se quiser login por SMS. Requer Twilio configurado, deixa pra V2.
4. **Google** (recomendado): ativa, mais conveniente pra usuária:
   - Vai pro Google Cloud Console, cria OAuth credentials
   - Cola o Client ID e Secret no Supabase
   - Pega o redirect URL do Supabase e cola no Google Cloud

5. Em **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` (vai trocar depois quando subir)
   - **Redirect URLs:** adiciona `http://localhost:3000/**` (vai trocar depois)

---

## Passo 6 — Pegar credenciais pra usar no app

1. Menu esquerdo → **Project Settings** (engrenagem no canto inferior esquerdo) → **API**
2. Você vai ver:
   - **Project URL** — algo tipo `https://xxxxx.supabase.co`
   - **anon public** — chave longa começando com `eyJ...`
   - **service_role** — outra chave longa (essa NUNCA exponha no frontend!)

3. Salva essas 3 coisas no 1Password/Bitwarden. Quando o dev for plugar o app no banco, ele precisa de:
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_ANON_KEY` = anon public (vai no frontend)
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role (só no backend, NUNCA no frontend)

---

## Estrutura do que foi criado

### 📊 Tabelas principais (24 no total)

**Usuárias e perfis**
- `profiles` — dados das usuárias (estende o auth.users)
- `friendships` — amizades feitas via eventos
- `notifications` — notificações in-app

**Eventos**
- `events` — os 11 eventos do catálogo
- `hosts` — anfitriãs (Mia, Nicole, Lillyan, etc.)
- `event_hosts` — relação N pra N entre eventos e anfitriãs
- `event_activities` — o que tá incluso em cada evento
- `bookings` — reservas/compras
- `coupons` — cupons de desconto (PRIMEIRA já tá criado)
- `coupon_usages` — quem usou qual cupom

**Comunidade**
- `tribes` — 13 tribos (já cadastradas no seed)
- `tribe_members` — quem tá em qual tribo
- `feed_posts` — check-ins do feed
- `post_likes`, `post_comments` — interações nos posts
- `ideas` — sugestões anônimas da comunidade
- `idea_likes` — likes nas ideias

**Marketplace Indica**
- `professionals` — profissionais cadastradas
- `professional_services` — serviços que cada uma oferece
- `professional_portfolio` — fotos do trabalho delas
- `professional_reviews` — avaliações
- `professional_indications` — quem indicou cada profissional

**Gamificação**
- `badges` — 5 selos pré-criados
- `user_badges` — selos conquistados por cada usuária

### 🤖 Triggers automáticos

Esses rodam sozinhos no banco:

1. **Novo signup → cria profile automático**
2. **Reserva paga → atualiza going_count do evento + total_experiences da usuária**
3. **Reserva cancelada → reverte os contadores**
4. **Entrar/sair de tribo → atualiza member_count**
5. **Like em post → atualiza likes_count**
6. **Indicar profissional → atualiza indications_count**

Resultado: o frontend nunca precisa calcular contadores. Sempre lê do cache atualizado.

### 🔒 Row Level Security (RLS) ligado

Cada tabela tem regra de quem pode ler/escrever:
- Profiles: todos leem, só você atualiza o seu
- Eventos: leitura pública
- Reservas: SÓ VOCÊ vê as suas
- Posts: todos veem, só você edita os seus
- Tribos: todos veem, você entra/sai à vontade
- Profissionais: leitura pública das ativas

Isso significa: mesmo que alguém descubra a chave anon pública, **não consegue ler dados de outras usuárias**.

---

## Próximos passos depois do banco montado

Em ordem:

### 1. Importar os 11 eventos atuais (1 dia)
Em vez de ter os eventos hardcoded no HTML, eles vivem no banco. Eu posso escrever o SQL de seed com os 11 eventos atuais (Pilates, Yoga com Mia, Clube do Livro, etc.) se você quiser — me pede.

### 2. Importar as 10 profissionais do Indica (1 dia)
Mesma coisa pra profissionais.

### 3. Conectar o frontend ao Supabase (3-5 dias com dev)
Trocar os `const events = [...]` por chamadas reais ao banco. Quem faz: dev React/Next.js.

### 4. Integrar Pagar.me ou Asaas pra Pix de verdade (3-5 dias)
Hoje o "Pagar" é mockado. Pra cobrar de verdade precisa dessas integrações.

### 5. Deploy no Vercel (1 dia)
Subir o app online com domínio próprio (movva.com.br).

---

## Custo previsto

| Item | Custo mensal |
|---|---|
| Supabase Free | R$ 0 (até 500MB DB, 1GB storage, 50k usuárias) |
| Supabase Pro (quando crescer) | ~R$ 125 (USD 25) |
| Vercel Free | R$ 0 (até 100GB de tráfego) |
| Domínio movva.com.br | R$ 40/ano |
| Pagar.me | ~3% por transação |

**Custo pra rodar com até 500 usuárias: ~R$ 5/mês.**

---

## Dúvidas comuns

**"E se eu não souber programar?"**
Você não precisa. Esse setup todo do Supabase é só clicar em botões e colar SQL. Só pra plugar no app você precisa de dev. Posso te indicar caminhos pra contratar dev se quiser.

**"E se eu quiser mudar o schema depois?"**
Tranquilo. Supabase tem migrations. A gente roda novos SQLs adicionando/alterando tabelas sem perder dados.

**"E se chegar muita gente?"**
O Free tier aguenta bastante. Quando começar a ficar perto do limite (que demora), você sobe pro Pro (US$ 25/mês = ~R$ 125) e ganha 8GB de banco, 100GB de storage, e backups diários.

**"E os backups?"**
No Pro o Supabase faz backup diário automático por 7 dias. No Free não tem backup automático — recomendo exportar uma vez por semana enquanto for Free (botão "Database Backups" no painel).

**"Posso ver os dados num Excel?"**
Sim. Menu **Table Editor** mostra todas as tabelas e dá pra editar/exportar CSV direto.

---

## Quando você terminar

Me avisa que:
1. Rodou o SQL com sucesso
2. Configurou Storage e Auth
3. Anotou as 3 credenciais (URL, anon key, service role key)

Aí eu te entrego o próximo: **SQL com os 11 eventos atuais já inseridos no banco**, prontos pra testar.

Bora?
