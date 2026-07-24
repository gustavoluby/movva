"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { SITE_CITY, SITE_REGION } from "@/lib/site";

type AdminClient = ReturnType<typeof createAdminClient>;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// Geocodifica um endereço via Nominatim (OpenStreetMap, grátis, sem chave).
// Best-effort: qualquer erro/timeout devolve null e o save segue sem coords.
async function geocode(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
      query,
    )}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Moodpass/1.0 (contato@moodpass.com.br)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const first = Array.isArray(data) ? data[0] : null;
    if (!first) return null;
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export type ExperienciaState = { error?: string };

async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdmin(user?.email);
}

// "Yoga & Mia em Curitiba!" → "yoga-mia-em-curitiba"
function slugify(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tira acentos (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Garante slug único: se já existe (em outro evento), tenta base-2, base-3...
async function uniqueSlug(
  admin: AdminClient,
  base: string,
  ignoreId: string | null,
): Promise<string> {
  const fallback = base || `experiencia-${randomUUID().slice(0, 8)}`;
  let candidate = fallback;
  for (let n = 2; n < 50; n++) {
    const { data } = await admin
      .from("events")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || data.id === ignoreId) return candidate;
    candidate = `${fallback}-${n}`;
  }
  return `${fallback}-${randomUUID().slice(0, 6)}`;
}

// Reais digitados ("179" ou "179,90") → centavos. null se vazio/inválido.
function reaisToCents(raw: string): number | null {
  const n = Number(String(raw ?? "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function optText(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

function optNumber(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// Sobe uma imagem pro bucket event-images e devolve a URL pública.
async function uploadImage(
  admin: AdminClient,
  file: File,
  slug: string,
): Promise<{ url?: string; error?: string }> {
  if (file.size > MAX_BYTES) return { error: "Imagem grande demais (máx. 8 MB)." };
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${slug}/${randomUUID()}.${ext}`;
  const { error } = await admin.storage.from("event-images").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (error) return { error: `Não consegui subir a imagem: ${error.message}` };
  return { url: admin.storage.from("event-images").getPublicUrl(path).data.publicUrl };
}

export async function salvarExperiencia(
  _prev: ExperienciaState,
  formData: FormData,
): Promise<ExperienciaState> {
  if (!(await requireAdmin())) return { error: "Sem permissão." };

  const id = String(formData.get("id") ?? "").trim() || null;
  const editing = !!id;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "O título é obrigatório." };

  const eventDate = String(formData.get("event_date") ?? "").trim();
  if (!eventDate) return { error: "A data é obrigatória." };

  const locationName = String(formData.get("location_name") ?? "").trim();
  if (!locationName) return { error: "O local é obrigatório." };

  const priceCents = reaisToCents(String(formData.get("price") ?? ""));
  if (priceCents == null) return { error: "Preço inválido." };

  const capacity = optNumber(formData, "capacity");
  if (capacity == null || capacity < 1)
    return { error: "Informe a quantidade de vagas." };

  // Preço escalonado (lotes): opcional. Só grava se o admin marcou "tiered" e
  // preencheu os dois campos. Senão, zera (evento com preço único).
  let tier1Capacity: number | null = null;
  let priceTier2Cents: number | null = null;
  if (formData.get("tiered") === "on") {
    tier1Capacity = optNumber(formData, "tier1_capacity");
    priceTier2Cents = reaisToCents(String(formData.get("price_tier2") ?? ""));
    if (tier1Capacity == null || tier1Capacity < 1)
      return { error: "Informe as vagas do 1º lote (ou desmarque os lotes)." };
    if (priceTier2Cents == null)
      return { error: "Informe o preço do 2º lote (ou desmarque os lotes)." };
    if (tier1Capacity > capacity)
      return {
        error: "As vagas do 1º lote não podem passar do total de vagas.",
      };
    tier1Capacity = Math.round(tier1Capacity);
  }

  const admin = createAdminClient();

  // Slug: usa o que o admin digitou (se digitou) ou gera do título; garante único.
  const slugInput = optText(formData, "slug");
  const slug = await uniqueSlug(
    admin,
    slugify(slugInput ?? title),
    id,
  );

  // Imagem principal: se veio arquivo novo, sobe; senão mantém a URL existente.
  let imageUrl = optText(formData, "image_url");
  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    const up = await uploadImage(admin, imageFile, slug);
    if (up.error) return { error: up.error };
    imageUrl = up.url ?? imageUrl;
  }

  // Coordenadas do mapa: o admin não digita lat/lng — geocodificamos o
  // endereço automaticamente. Se o geocode falhar, mantém o que já existia
  // (vem como hidden no form).
  let lat = optNumber(formData, "location_lat");
  let lng = optNumber(formData, "location_lng");
  const geoQuery = [
    optText(formData, "location_address"),
    locationName,
    `${SITE_CITY}, ${SITE_REGION}, Brasil`,
  ]
    .filter(Boolean)
    .join(", ");
  const geo = await geocode(geoQuery);
  if (geo) {
    lat = geo.lat;
    lng = geo.lng;
  }

  // Foto do grupo de organizadores (host_summary): idem.
  let hostPhotoUrl = optText(formData, "host_photo_url");
  const hostPhotoFile = formData.get("host_photo");
  if (hostPhotoFile instanceof File && hostPhotoFile.size > 0) {
    const up = await uploadImage(admin, hostPhotoFile, `${slug}/organizadores`);
    if (up.error) return { error: up.error };
    hostPhotoUrl = up.url ?? hostPhotoUrl;
  }

  const row = {
    slug,
    title,
    subtitle: optText(formData, "subtitle"),
    description: optText(formData, "description"),
    category: optText(formData, "category"),
    cat_tag: optText(formData, "cat_tag"),
    event_date: eventDate,
    event_time: optText(formData, "event_time"),
    duration: optText(formData, "duration"),
    is_recurring: formData.get("is_recurring") === "on",
    recurrence_rule: optText(formData, "recurrence_rule"),
    location_name: locationName,
    location_short: optText(formData, "location_short"),
    location_address: optText(formData, "location_address"),
    location_lat: lat,
    location_lng: lng,
    price_cents: priceCents,
    price_tier2_cents: priceTier2Cents,
    tier1_capacity: tier1Capacity,
    capacity: Math.round(capacity),
    image_url: imageUrl,
    host_summary: optText(formData, "host_summary"),
    host_photo_url: hostPhotoUrl,
    tag: optText(formData, "tag"),
    tag_style: String(formData.get("tag_style") ?? "accent") === "primary"
      ? "primary"
      : "accent",
    is_featured: formData.get("is_featured") === "on",
    status: String(formData.get("status") ?? "draft"),
    // "O que levar" no email: lista editável + toggle de exibição. Guardamos o
    // texto mesmo quando oculto, pra não perder ao religar depois.
    what_to_bring: optText(formData, "what_to_bring"),
    show_what_to_bring: formData.get("show_what_to_bring") === "on",
    updated_at: new Date().toISOString(),
  };

  let eventId = id;
  if (editing) {
    const { error } = await admin.from("events").update(row).eq("id", id);
    if (error) return { error: `Não consegui salvar: ${error.message}` };
  } else {
    const { data, error } = await admin
      .from("events")
      .insert(row)
      .select("id")
      .single();
    if (error || !data) return { error: `Não consegui criar: ${error?.message}` };
    eventId = data.id;
  }
  if (!eventId) return { error: "Erro inesperado ao salvar." };

  // ---- Atividades ("o que tá incluso") -----------------------------------
  // Estratégia simples e segura: apaga as atuais e reinsere. Não têm
  // dependentes (nenhuma FK aponta pra event_activities).
  const actCount = Number(formData.get("activities_count") ?? 0) || 0;
  await admin.from("event_activities").delete().eq("event_id", eventId);
  const acts: {
    event_id: string;
    icon: string | null;
    name: string;
    duration: string | null;
    sort_order: number;
  }[] = [];
  for (let i = 0; i < actCount; i++) {
    const name = String(formData.get(`act_name_${i}`) ?? "").trim();
    if (!name) continue;
    acts.push({
      event_id: eventId,
      icon: optText(formData, `act_icon_${i}`),
      name,
      duration: optText(formData, `act_duration_${i}`),
      sort_order: acts.length,
    });
  }
  if (acts.length > 0) await admin.from("event_activities").insert(acts);

  // ---- Organizadores (hosts + event_hosts) -------------------------------
  // event_hosts é reconstruído do zero. As linhas de `hosts` são atualizadas
  // (quando já existiam) ou criadas; hosts removidos apenas perdem o vínculo
  // (a linha em `hosts` fica órfã, inofensiva — pode ser reutilizada em outro
  // evento e não queremos apagar dado compartilhado).
  const hostCount = Number(formData.get("hosts_count") ?? 0) || 0;
  await admin.from("event_hosts").delete().eq("event_id", eventId);
  for (let i = 0; i < hostCount; i++) {
    const name = String(formData.get(`host_name_${i}`) ?? "").trim();
    if (!name) continue;

    // Foto do organizador: arquivo novo tem prioridade sobre a URL existente.
    let photoUrl = optText(formData, `host_photo_url_${i}`);
    const hf = formData.get(`host_photo_${i}`);
    if (hf instanceof File && hf.size > 0) {
      const up = await uploadImage(admin, hf, `${slug}/hosts`);
      if (up.error) return { error: up.error };
      photoUrl = up.url ?? photoUrl;
    }

    const hostFields = {
      name,
      bio: optText(formData, `host_bio_${i}`),
      instagram: optText(formData, `host_instagram_${i}`),
      photo_url: photoUrl,
    };

    const existingHostId = optText(formData, `host_id_${i}`);
    let hostId = existingHostId;
    if (existingHostId) {
      await admin.from("hosts").update(hostFields).eq("id", existingHostId);
    } else {
      const { data: newHost } = await admin
        .from("hosts")
        .insert(hostFields)
        .select("id")
        .single();
      hostId = newHost?.id ?? null;
    }
    if (!hostId) continue;

    await admin.from("event_hosts").insert({
      event_id: eventId,
      host_id: hostId,
      role: optText(formData, `host_role_${i}`) ?? "principal",
    });
  }

  revalidatePath("/admin/experiencias");
  revalidatePath("/");
  if (row.slug) revalidatePath(`/eventos/${row.slug}`);

  redirect("/admin/experiencias?ok=1");
}

// Move a experiência entre status sem apagar (preserva reservas). Usado pra
// arquivar/despublicar rápido a partir da lista.
export async function mudarStatusExperiencia(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) return;

  const admin = createAdminClient();
  await admin
    .from("events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/experiencias");
  revalidatePath("/");
}
