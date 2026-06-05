import type { MetadataRoute } from "next";

// Manifest PWA: permite "Adicionar à tela inicial" e abrir em tela cheia
// (standalone), sem a barra do navegador — é o que dá cara de app instalado.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moodpass — experiências pra florescer juntas",
    short_name: "Moodpass",
    description:
      "Encontros, esportes e bem-estar curados pra mulheres em Curitiba.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4ECE0",
    theme_color: "#2D4131",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
