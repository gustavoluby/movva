import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { SessionSync } from "@/components/auth/session-sync";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Movva — experiências pra florescer juntas",
  description:
    "Encontros, esportes e bem-estar curados pra mulheres em Curitiba.",
  // iOS: abre em tela cheia quando adicionado à tela inicial.
  appleWebApp: {
    capable: true,
    title: "Movva",
    statusBarStyle: "default",
  },
};

// Tela cheia real (viewport-fit=cover usa as safe-areas), cor de tema na
// barra de status e zoom desativado — tira a "cara de site" no celular.
export const viewport: Viewport = {
  themeColor: "#2D4131",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
        <SessionSync />
        {children}
      </body>
    </html>
  );
}
