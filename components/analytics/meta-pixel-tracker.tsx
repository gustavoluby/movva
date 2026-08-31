"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackMeta } from "@/lib/analytics/meta-pixel";

// Duas coisas que só dá pra fazer no cliente:
//
// 1. PageView das navegações internas. O app é uma SPA (App Router): trocar de
//    aba ou abrir um evento não recarrega a página, então o snippet do pixel
//    dispara uma vez só. Aqui mandamos um PageView a cada mudança de URL.
// 2. CompleteRegistration. O signup termina num redirect no servidor, que
//    carimba `?novo=1` na URL de destino — a marca é lida aqui, vira evento e
//    some da barra de endereço.
export function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL sem o `novo=1`: é ela que conta como "página". Assim a limpeza da URL
  // logo abaixo não é confundida com uma navegação nova (PageView duplicado).
  const params = new URLSearchParams(searchParams.toString());
  const novaConta = params.get("novo") === "1";
  params.delete("novo");
  const qs = params.toString();
  const url = qs ? `${pathname}?${qs}` : pathname;

  const ultimaUrl = useRef<string | null>(null);

  useEffect(() => {
    if (ultimaUrl.current === url) return;
    const primeira = ultimaUrl.current === null;
    ultimaUrl.current = url;
    // O primeiro carregamento já teve o PageView do snippet.
    if (!primeira) trackMeta("PageView");
  }, [url]);

  useEffect(() => {
    if (!novaConta) return;
    trackMeta("CompleteRegistration", {
      content_name: "Conta Moodpass",
      status: true,
      currency: "BRL",
      value: 0,
    });
    window.history.replaceState(null, "", url);
  }, [novaConta, url]);

  return null;
}
