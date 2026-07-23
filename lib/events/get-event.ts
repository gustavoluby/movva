import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Colunas completas do evento usadas pelo detalhe + metadata.
const EVENT_COLUMNS =
  "id, slug, title, subtitle, description, category, cat_tag, event_date, event_time, duration, location_name, location_short, location_address, location_lat, location_lng, price_cents, price_tier2_cents, tier1_capacity, capacity, going_count, image_url, tag, tag_style, host_summary, host_photo_url";

// Busca o evento publicado por slug. Envolto em cache() do React: dentro de um
// mesmo request, generateMetadata e o EventDetailView chamam isso e reusam a
// mesma busca — em vez de baterem duas vezes no Supabase.
export const getEventBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
});
