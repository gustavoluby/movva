import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { absoluteUrl } from "@/lib/site";

// Sitemap dinâmico: home + cada evento publicado (com lastModified).
// Revalida de tempos em tempos pra pegar eventos novos sem rebuild.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/politica-de-cancelamento"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    const { data: events } = await supabase
      .from("events")
      .select("slug, updated_at, event_date")
      .eq("status", "published")
      .order("event_date", { ascending: true });

    const eventRoutes: MetadataRoute.Sitemap = (events ?? []).map((e) => ({
      url: absoluteUrl(`/eventos/${e.slug}`),
      lastModified: e.updated_at ? new Date(e.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...eventRoutes];
  } catch {
    // Se o banco falhar, ao menos as rotas estáticas ficam no sitemap.
    return staticRoutes;
  }
}
