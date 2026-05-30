# Fluidez do app — decisões técnicas

Refatoração pra transformar a sensação de "site que recarrega a cada clique"
em app fluido (Instagram/Facebook/Linear): tela única, conteúdo trocando suave,
sem flash branco.

## Diagnóstico (antes)

- **Sem layout compartilhado**: cada uma das 5 telas com barra inferior
  renderizava a sua própria `movva-shell` + a sua própria `<BottomNav>`. A cada
  troca de aba a barra inteira desmontava e remontava → o "flash" de recarga.
- **Aba só acendia depois** que a tela nova carregava (dependia da URL mudar).
- **Zero `loading.tsx`** → nenhum feedback durante o fetch no servidor.
- **Sem PWA** → rodava dentro do navegador com a barra de endereço.

## O que foi feito

1. **Casca + barra persistentes** — `app/(tabs)/layout.tsx` agrupa `/`,
   `/minhas`, `/comunidade`, `/comunidade/ranking`, `/perfil`. O layout
   renderiza `movva-shell` + **uma** `BottomNav` que nunca remonta. URLs
   inalteradas (route group `()` é transparente). Páginas-formulário sem nav
   (`/comunidade/novo`, `/perfil/dados`) ficaram fora do grupo de propósito.
2. **Aba otimista** — `BottomNav` acende a aba no `onClick` (estado `pending`),
   zerado quando o `pathname` novo chega.
3. **Skeletons** — `loading.tsx` por tela (`components/layout/skeletons.tsx`)
   espelhando o layout final; shimmer em tons quentes; respeita
   `prefers-reduced-motion`.
4. **Cache de navegação** — `experimental.staleTimes` (dynamic 30s) no
   `next.config.ts`: voltar pra uma aba já visitada reusa o render.
5. **Transição suave** — `@keyframes movva-page-in` (fade + subida) na
   `.scroll-area`. 100% CSS, zero bundle.
6. **Otimismo no funil** — CTA "Reservar" usa `useLinkStatus` → "Abrindo…" na
   hora do toque; `/reservar` ganhou skeleton. (Confirmar/Pagar/Salvar já tinham
   estado pending/otimista.)
7. **PWA standalone** — `app/manifest.ts` (`display: standalone`), ícone da marca
   (`public/icon.svg`), `app/apple-icon.tsx` (PNG 180×180 via `ImageResponse`),
   `viewport` com `viewport-fit=cover` + `theme-color` + zoom desativado.
8. **Modal do detalhe** — intercepting route `app/(tabs)/@modal/(.)eventos/[slug]`
   abre o detalhe num sheet que sobe; tela de trás preservada. Link direto /
   refresh → página cheia (`app/eventos/[slug]/page.tsx`). Corpo compartilhado
   em `components/detalhe/event-detail-view.tsx` (sem duplicar query/markup).

## Decisões / trade-offs (e por que divergi da recomendação)

- **Sem framer-motion.** Contradiz a meta de bundle (<200kb / Lighthouse 85).
  Animações via CSS nativo entregam a fluidez com zero kb.
- **Sem SWR/TanStack Query.** Os dados vêm de Server Components; o cache do
  router (`staleTimes`) já cobre "voltar = instantâneo". Adicionar lib de cache
  client seria reescrever a camada de dados — scope creep desnecessário.
- **View Transitions API "de verdade" ficou pra depois.** O componente
  `<ViewTransition>` do React **não existe** no React 19.1.0 estável (só em
  builds experimentais). Em vez de puxar React experimental pra produção, usei
  transição CSS (degradação graciosa). Caminho futuro: quando o React
  estabilizar `ViewTransition`, ligar `experimental.viewTransition` e marcar
  `view-transition-name` no card→hero pra transição de elemento compartilhado.
- **Route group `(tabs)`, não `(authenticated)`.** Descobrir e Checkins
  funcionam deslogada — prender tudo em "authenticated" quebraria o acesso
  público.
- **Pagamento é redirect externo (Checkout Pro do Mercado Pago), não Pix
  embutido com polling.** Então não há "tela de pagamento recarregando durante
  polling" pra resolver; o que melhorou foi o otimismo do botão.

## Verificação

- `npm run build` ✓ — 13 rotas, First Load JS 106–108 kB (teto 200 kB ok).
- Smoke test SSR (server de produção): `/`, `/eventos/[slug]`,
  `/manifest.webmanifest`, `/apple-icon` → todas HTTP 200.
- `<head>` confirmado: viewport sem zoom + cover, theme-color, manifest,
  apple-touch-icon.

### Falta validar no device (não dá pra ver via build/curl)

- **Modal**: aparência do sheet, slide, scroll interno, posição do CTA fixo
  dentro do sheet, fechar por backdrop/ESC/X. É a peça mais nova — checar no
  celular. Revert isolado: apagar `app/(tabs)/@modal/` + reverter o commit do
  modal volta tudo pra navegação de página cheia.
- **Add à tela inicial** (iOS/Android) abrindo em tela cheia.
