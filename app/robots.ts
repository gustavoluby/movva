import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// robots.txt gerado pelo Next. Libera todo mundo (inclusive crawlers de IA,
// pra sermos citáveis por ChatGPT/Perplexity/Google AI Overviews) e bloqueia
// só áreas privadas. Aponta o sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/perfil/dados", "/reservar/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
