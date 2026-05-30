import { createAdminClient } from "../lib/supabase/admin";

// Cria o evento de teste "Vinho da Prudente" (categoria Rolezinhos) e sobe uma
// imagem temática pro bucket event-images. Idempotente: upsert por slug.
const SLUG = "vinho-da-prudente";

// Candidatos de imagem (barzinho/vinho/amigas). Usa o primeiro que baixar ok.
const IMAGE_CANDIDATES = [
  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80&fit=crop",
  "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80&fit=crop",
  "https://loremflickr.com/1200/900/wine,bar,friends",
  "https://picsum.photos/seed/vinho-da-prudente/1200/900",
];

async function fetchImage(): Promise<{ buf: Buffer; type: string } | null> {
  for (const url of IMAGE_CANDIDATES) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.startsWith("image/")) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength < 5000) continue; // evita placeholder/erro minúsculo
      console.log(`imagem ok (${(buf.byteLength / 1024).toFixed(0)} KB) de ${url}`);
      return { buf, type };
    } catch {
      // tenta a próxima
    }
  }
  return null;
}

async function main() {
  const admin = createAdminClient();

  let imageUrl: string | null = null;
  const img = await fetchImage();
  if (img) {
    const path = `${SLUG}.jpg`;
    const { error: upErr } = await admin.storage
      .from("event-images")
      .upload(path, img.buf, { contentType: img.type, upsert: true });
    if (upErr) {
      console.warn("upload da imagem falhou, segue sem imagem:", upErr.message);
    } else {
      imageUrl = admin.storage.from("event-images").getPublicUrl(path).data
        .publicUrl;
    }
  } else {
    console.warn("nenhuma imagem baixou; evento fica sem foto (placeholder).");
  }

  const event = {
    slug: SLUG,
    title: "Vinho da Prudente",
    subtitle: "Encontro no barzinho pra conversar e conhecer gente nova",
    description:
      "Um rolezinho leve na Prudente de Morais pra quem quer sair de casa e fazer amizades novas. A gente se encontra num barzinho gostoso, pede um vinho, troca ideia e conhece mulheres com a mesma vibe. Sem agenda nem pressão — só boa conversa. Bora?",
    category: "Rolezinho · Encontro",
    cat_tag: "Rolezinho",
    tag: "Novo · Pra conhecer gente",
    tag_style: "accent",
    event_date: "2026-06-12",
    event_time: "19h30 em diante",
    duration: "noite",
    location_name: "Barzinho na Prudente",
    location_short: "Prudente de Morais",
    location_address: "Rua Prudente de Morais, Curitiba - PR",
    price_cents: 0,
    capacity: 12,
    going_count: 0,
    is_featured: false,
    status: "published",
    ...(imageUrl ? { image_url: imageUrl } : {}),
  };

  const { data, error } = await admin
    .from("events")
    .upsert(event, { onConflict: "slug" })
    .select("slug, title, status, image_url")
    .single();

  if (error) {
    console.error("falha ao criar evento:", error);
    process.exit(1);
  }
  console.log("evento criado/atualizado:", JSON.stringify(data, null, 2));
}

main();
