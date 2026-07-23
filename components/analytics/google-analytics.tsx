import Script from "next/script";

// GA4 (gtag.js). Fica no layout raiz, então vale pra todas as páginas do app e
// do site. `afterInteractive` carrega depois da página ficar utilizável — não
// atrasa o primeiro paint.
//
// Navegação client-side (troca de aba, abrir evento) não recarrega a página: os
// pageviews dessas trocas vêm da "Medição aprimorada" do GA4 (eventos de
// histórico do navegador), ligada por padrão na propriedade.
export const GA_MEASUREMENT_ID = "G-686PN3L838";

export function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
