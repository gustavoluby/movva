import Script from "next/script";
import { Suspense } from "react";
import { MetaPixelRouteTracker } from "./meta-pixel-tracker";

// Meta Pixel (Facebook/Instagram Ads). Mora no layout raiz, então roda em toda
// página do site — inclusive as que não têm nenhum evento de conversão.
//
// `afterInteractive` carrega depois da página ficar utilizável (mesma escolha
// do GA4). Quem dispara evento antes disso não perde nada: o helper em
// `lib/analytics/meta-pixel` enfileira até o fbq subir.
//
// O PageView do primeiro carregamento sai aqui no snippet. Os PageViews das
// navegações client-side (trocar de aba, abrir um evento) saem do
// MetaPixelRouteTracker — o pixel não enxerga essas trocas sozinho.
export const META_PIXEL_ID = "1471157178089953";

export function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <Suspense fallback={null}>
        <MetaPixelRouteTracker />
      </Suspense>
    </>
  );
}
