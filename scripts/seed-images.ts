// Sobe as imagens do protótipo (legacy/index.html) pros buckets do
// Supabase Storage. Cobre:
//   - eventos     → event-images/{slug}.jpg
//   - profissionais → professional-images/{slug}/{photo,cover,portfolio-N}.jpg
//   - tribos      → tribe-covers/{slug}.jpg
//
// Fonte por arquivo:
//   - pilates-bundle: base64 inline do HTML (flyer real do evento).
//   - Demais: URLs externas (picsum/pravatar) baixadas uma vez via fetch,
//     pra preview não depender do servidor externo.
//
// Idempotente: upsert=true sobrescreve mantendo a mesma URL.
//
// Uso:
//   npm run seed:images

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Database } from "../types/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HTML_PATH = resolve(process.cwd(), "legacy/index.html");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Faltando NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY. " +
      "Rode via `npm run seed:images` (que injeta --env-file=.env.local).",
  );
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_KEY);

type EventData = {
  id: string;
  title: string;
  image?: string;
  thumb?: string;
};

type ProfessionalData = {
  id: string;
  name: string;
  photo?: string;
  cover?: string;
  portfolio?: string[];
};

type TribeData = {
  id: string;
  name: string;
  cover?: string;
};

// Cada bloco no HTML vai do `const X = [` até a próxima declaração de topo.
function extractArray<T>(html: string, varName: string, nextDecl: string): T[] {
  const startMarker = `const ${varName} = [`;
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(nextDecl, startIdx);
  if (startIdx < 0 || endIdx < 0) {
    throw new Error(`Não localizei array ${varName} (procurando até "${nextDecl}")`);
  }
  const text = html
    .slice(startIdx + `const ${varName} = `.length, endIdx)
    .trim()
    .replace(/;\s*$/, "");
  return new Function(`return ${text}`)() as T[];
}

function base64ToBuffer(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (!match) throw new Error("data URL inválida");
  return Buffer.from(match[1], "base64");
}

async function fetchAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch ${res.status} ${res.statusText}: ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function sourceFor(input: {
  base64?: string;
  url?: string;
  fallbackPicsumSeed?: string;
}): Promise<Buffer> {
  if (input.base64?.startsWith("data:image/")) {
    return base64ToBuffer(input.base64);
  }
  if (input.url?.startsWith("http")) {
    return fetchAsBuffer(input.url);
  }
  if (!input.fallbackPicsumSeed) {
    throw new Error("Sem fonte de imagem e sem fallback");
  }
  return fetchAsBuffer(
    `https://picsum.photos/seed/${input.fallbackPicsumSeed}/800/600`,
  );
}

async function upload(
  bucket: string,
  path: string,
  buffer: Buffer,
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw new Error(`Upload ${bucket}/${path}: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

type UploadResult = { ref: string; path: string; size_kb: number; url: string };

async function uploadEvents(events: EventData[]): Promise<UploadResult[]> {
  const out: UploadResult[] = [];
  for (const e of events) {
    const buffer = await sourceFor({
      // pilates-bundle: força o flyer real (base64 do .image)
      base64: e.id === "pilates-bundle" ? e.image : undefined,
      url: e.thumb,
      fallbackPicsumSeed: `movva-${e.id}`,
    });
    const url = await upload("event-images", `${e.id}.jpg`, buffer);
    out.push({
      ref: e.id,
      path: `${e.id}.jpg`,
      size_kb: Number((buffer.length / 1024).toFixed(1)),
      url,
    });
    console.log(`  event/${e.id.padEnd(28)} ${out.at(-1)!.size_kb} KB`);
  }
  return out;
}

async function uploadProfessionals(
  pros: ProfessionalData[],
): Promise<UploadResult[]> {
  const out: UploadResult[] = [];
  for (const p of pros) {
    const photoBuf = await sourceFor({
      url: p.photo,
      fallbackPicsumSeed: `movva-pro-${p.id}-photo`,
    });
    out.push({
      ref: `${p.id}/photo`,
      path: `${p.id}/photo.jpg`,
      size_kb: Number((photoBuf.length / 1024).toFixed(1)),
      url: await upload("professional-images", `${p.id}/photo.jpg`, photoBuf),
    });

    const coverBuf = await sourceFor({
      url: p.cover,
      fallbackPicsumSeed: `movva-pro-${p.id}-cover`,
    });
    out.push({
      ref: `${p.id}/cover`,
      path: `${p.id}/cover.jpg`,
      size_kb: Number((coverBuf.length / 1024).toFixed(1)),
      url: await upload("professional-images", `${p.id}/cover.jpg`, coverBuf),
    });

    const portfolio = p.portfolio ?? [];
    for (let i = 0; i < portfolio.length; i++) {
      const buf = await sourceFor({
        url: portfolio[i],
        fallbackPicsumSeed: `movva-pro-${p.id}-portfolio-${i}`,
      });
      const path = `${p.id}/portfolio-${i + 1}.jpg`;
      out.push({
        ref: `${p.id}/portfolio-${i + 1}`,
        path,
        size_kb: Number((buf.length / 1024).toFixed(1)),
        url: await upload("professional-images", path, buf),
      });
    }

    console.log(
      `  pro/${p.id.padEnd(28)} photo+cover+${portfolio.length} portfolio`,
    );
  }
  return out;
}

async function uploadTribes(tribes: TribeData[]): Promise<UploadResult[]> {
  const out: UploadResult[] = [];
  for (const t of tribes) {
    const buf = await sourceFor({
      url: t.cover,
      fallbackPicsumSeed: `movva-tribe-${t.id}`,
    });
    const path = `${t.id}.jpg`;
    out.push({
      ref: t.id,
      path,
      size_kb: Number((buf.length / 1024).toFixed(1)),
      url: await upload("tribe-covers", path, buf),
    });
    console.log(`  tribe/${t.id.padEnd(28)} ${out.at(-1)!.size_kb} KB`);
  }
  return out;
}

async function main() {
  console.log(`Lendo ${HTML_PATH}...`);
  const html = readFileSync(HTML_PATH, "utf8");

  const events = extractArray<EventData>(html, "events", "const feedPosts =");
  const pros = extractArray<ProfessionalData>(
    html,
    "professionals",
    "const serviceCategories =",
  );
  const tribes = extractArray<TribeData>(
    html,
    "tribes",
    "const userBookings =",
  );

  console.log(
    `Carregado: ${events.length} eventos · ${pros.length} profissionais · ${tribes.length} tribos\n`,
  );

  console.log("→ Eventos");
  const eventResults = await uploadEvents(events);

  console.log("\n→ Profissionais");
  const proResults = await uploadProfessionals(pros);

  console.log("\n→ Tribos");
  const tribeResults = await uploadTribes(tribes);

  const total = eventResults.length + proResults.length + tribeResults.length;
  const totalKB = [...eventResults, ...proResults, ...tribeResults].reduce(
    (a, r) => a + r.size_kb,
    0,
  );

  console.log(`\n✓ ${total} arquivos no Storage (${totalKB.toFixed(1)} KB total)`);
  console.log(`  - event-images:        ${eventResults.length}`);
  console.log(`  - professional-images: ${proResults.length}`);
  console.log(`  - tribe-covers:        ${tribeResults.length}`);
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
