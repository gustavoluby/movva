"use client";

import { useEffect, useRef } from "react";
import {
  trackMeta,
  trackMetaOnce,
  type MetaEvent,
  type MetaParams,
} from "@/lib/analytics/meta-pixel";

/**
 * Dispara um evento do Meta quando a tela aparece. Serve pra conversão que é a
 * própria tela (ver experiência, chegar no checkout, confirmação de pagamento)
 * — em página de servidor, é só plantar este componente.
 */
export function MetaTrack({
  event,
  params,
  eventId,
  once,
}: {
  event: MetaEvent;
  params?: MetaParams;
  /** eventID do Meta: repetições com o mesmo id são descartadas lá. */
  eventId?: string;
  /** Chave de "uma vez só neste navegador" (localStorage). */
  once?: string;
}) {
  const enviado = useRef<string | null>(null);
  // Assinatura do disparo: muda quando o evento ou o conteúdo muda (abrir outra
  // experiência, por exemplo), e só então manda de novo.
  const chave = once ?? `${event}|${eventId ?? ""}|${JSON.stringify(params ?? {})}`;

  useEffect(() => {
    if (enviado.current === chave) return;
    enviado.current = chave;
    if (once) trackMetaOnce(once, event, params, eventId);
    else trackMeta(event, params, eventId);
    // A assinatura já resume evento + parâmetros.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  return null;
}

/**
 * Dispara um evento no clique de qualquer coisa (inclusive link de servidor,
 * como o botão do WhatsApp). `display: contents` faz o wrapper sumir do
 * layout — o filho continua sendo o elemento posicionado.
 */
export function MetaClick({
  event,
  params,
  children,
}: {
  event: MetaEvent;
  params?: MetaParams;
  children: React.ReactNode;
}) {
  return (
    <span style={{ display: "contents" }} onClick={() => trackMeta(event, params)}>
      {children}
    </span>
  );
}
