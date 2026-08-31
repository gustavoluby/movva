// Camada fina em cima do fbq (Meta Pixel). Motivos de existir:
//
// 1. O snippet do pixel entra com `afterInteractive`, então `window.fbq` pode
//    ainda não existir quando um componente monta. Aqui os eventos ficam numa
//    fila e são despejados assim que o fbq aparece — nada se perde.
// 2. Centraliza os nomes padrão do Facebook e o formato dos parâmetros
//    (value em reais, currency BRL, content_ids), pra não sair cada tela
//    inventando o seu.

/** Eventos padrão do Meta que o Moodpass usa. */
export type MetaEvent =
  | "PageView"
  | "ViewContent"
  | "AddToWishlist"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "CompleteRegistration"
  | "Lead"
  | "Contact";

/** Item do `contents` (formato de catálogo do Meta). */
type MetaContent = { id: string; quantity: number };

export type MetaParams = Record<
  string,
  string | number | boolean | string[] | MetaContent[]
>;

type FbqCall = [
  "track",
  MetaEvent,
  MetaParams | undefined,
  { eventID: string } | undefined,
];

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const queue: FbqCall[] = [];
let retry: ReturnType<typeof setTimeout> | null = null;
let tries = 0;

// Despeja a fila quando o fbq estiver de pé. Tenta por ~6s e desiste — se o
// pixel foi bloqueado (adblock), não adianta segurar evento na memória.
function flush() {
  retry = null;
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") {
    if (tries++ < 30) retry = setTimeout(flush, 200);
    return;
  }
  tries = 0;
  while (queue.length) {
    const [cmd, event, params, options] = queue.shift() as FbqCall;
    window.fbq(cmd, event, params, options);
  }
}

/**
 * Dispara um evento padrão do Meta.
 * `eventId` vira o eventID do pixel: o Meta descarta repetições do mesmo
 * evento com o mesmo id (reload da tela de confirmação, por exemplo).
 */
export function trackMeta(
  event: MetaEvent,
  params?: MetaParams,
  eventId?: string,
) {
  if (typeof window === "undefined") return;
  queue.push(["track", event, params, eventId ? { eventID: eventId } : undefined]);
  if (!retry) flush();
}

/**
 * Como o `trackMeta`, mas só uma vez por navegador (guardado no localStorage).
 * Pra conversão que não pode contar de novo quando a pessoa volta na tela.
 */
export function trackMetaOnce(
  key: string,
  event: MetaEvent,
  params?: MetaParams,
  eventId?: string,
) {
  const storageKey = `mp_fb:${key}`;
  try {
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, "1");
  } catch {
    // Navegação privada / storage bloqueado: manda mesmo assim — o eventID
    // ainda deduplica do lado do Meta.
  }
  trackMeta(event, params, eventId);
}

/** Centavos → reais no formato que o Meta espera (número, 2 casas). */
export function brl(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/**
 * Parâmetros de catálogo de uma experiência. O `content_ids` usa o slug, que é
 * o identificador estável do evento no site (o mesmo da URL).
 */
export function experienceParams({
  slug,
  title,
  priceCents,
  category,
}: {
  slug: string;
  title: string;
  priceCents: number;
  category?: string | null;
}): MetaParams {
  return {
    content_ids: [slug],
    content_type: "product",
    content_name: title,
    ...(category ? { content_category: category } : {}),
    contents: [{ id: slug, quantity: 1 }],
    num_items: 1,
    value: brl(priceCents),
    currency: "BRL",
  };
}
