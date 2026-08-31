import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { SessionSync } from "@/components/auth/session-sync";
import { JsonLd } from "@/components/seo/json-ld";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  SITE_LOGO,
  SITE_OG_IMAGE,
  SOCIAL_LINKS,
} from "@/lib/site";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  // Peso 300 removido — não é usado em lugar nenhum (menos 1 arquivo de fonte
  // no primeiro paint).
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true, "max-image-preview": "large" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "pt_BR",
    url: SITE_URL,
    title: `${SITE_NAME} · Experiências de bem-estar em Curitiba`,
    description: SITE_DESCRIPTION,
    images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · Experiências de bem-estar em Curitiba`,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
  // iOS: abre em tela cheia quando adicionado à tela inicial.
  appleWebApp: {
    capable: true,
    title: "Moodpass",
    statusBarStyle: "default",
  },
};

// Tela cheia real (viewport-fit=cover usa as safe-areas) e cor de tema na barra
// de status. Zoom liberado (user-scalable) por acessibilidade — travar zoom
// prejudica a11y e é penalizado.
export const viewport: Viewport = {
  themeColor: "#2D4131",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: SITE_LOGO,
  description: `${SITE_TAGLINE}.`,
  areaServed: { "@type": "City", name: "Curitiba" },
  ...(SOCIAL_LINKS.length > 0 ? { sameAs: SOCIAL_LINKS } : {}),
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "pt-BR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${manrope.variable} ${fraunces.variable} antialiased`}
      >
        <JsonLd data={[organizationLd, websiteLd]} />
        <GoogleAnalytics />
        <MetaPixel />
        <SessionSync />
        {children}
      </body>
    </html>
  );
}
