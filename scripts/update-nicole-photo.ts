// One-off: sobe a foto nova da Nicole Benato pro Storage e atualiza
// hosts.photo_url + events.host_photo_url (pilates-bundle).
//
// Uso:
//   npx tsx --env-file=.env.local scripts/update-nicole-photo.ts <caminho-da-imagem>

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import type { Database } from "../types/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IMAGE_PATH = process.argv[2];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltando NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!IMAGE_PATH) {
  console.error("Passe o caminho da imagem como argumento.");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const buffer = readFileSync(IMAGE_PATH);
  const path = `hosts/nicole-benato.jpg`;

  const { error: upErr } = await supabase.storage
    .from("event-images")
    .upload(path, buffer, { upsert: true, contentType: "image/jpeg" });
  if (upErr) throw new Error(`Upload: ${upErr.message}`);

  const { data } = supabase.storage.from("event-images").getPublicUrl(path);
  // cache-bust pra trocar a foto já cacheada nos CDNs/navegadores
  const url = `${data.publicUrl}?v=${buffer.length}`;
  console.log(`Storage OK → ${url}`);

  const { error: hostErr, count: hostCount } = await supabase
    .from("hosts")
    .update({ photo_url: url }, { count: "exact" })
    .eq("name", "Nicole Benato");
  if (hostErr) throw new Error(`hosts: ${hostErr.message}`);

  const { error: evErr, count: evCount } = await supabase
    .from("events")
    .update({ host_photo_url: url }, { count: "exact" })
    .eq("slug", "pilates-bundle");
  if (evErr) throw new Error(`events: ${evErr.message}`);

  console.log(`✓ hosts atualizados: ${hostCount} · events: ${evCount}`);
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
