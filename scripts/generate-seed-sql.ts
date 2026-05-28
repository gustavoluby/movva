// Gera o SQL de seed dos eventos, profissionais e tribos a partir do
// protótipo (legacy/index.html). Escreve no stdout — redirecione pra um
// arquivo de migration:
//
//   npx tsx scripts/generate-seed-sql.ts > supabase/migrations/<ts>_seed_data.sql
//
// URLs do Storage são construídas a partir dos slugs (paths determinísticos
// que casam com o que seed-images.ts subiu).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const HTML_PATH = resolve(process.cwd(), "legacy/index.html");
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://ikoehiplcpekvexnmhgs.supabase.co";
const SEED_YEAR = "2026";

type EventActivity = { icon: string; name: string; duration?: string };
type EventHost = { name: string; bio?: string; photo?: string };
type EventData = {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  catTag?: string;
  date?: string;
  dayNum: string;
  monthShort: string;
  time?: string;
  duration?: string;
  location?: string;
  locationShort?: string;
  price: number;
  capacity: number;
  going: number;
  description?: string;
  activities?: EventActivity[];
  host?: EventHost;
  tag?: string;
  tagStyle?: string;
  featured?: boolean;
};

type Service = { name: string; price: number; duration?: string };
type ProfessionalData = {
  id: string;
  name: string;
  studio: string;
  handle?: string;
  bio?: string;
  primaryCategory: string;
  categories?: string[];
  locationShort?: string;
  locationFull?: string;
  atDomicile?: boolean;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  priceFrom?: number;
  indications?: number;
  portfolio?: string[];
  services?: Service[];
  featured?: boolean;
};

type TribeData = { id: string; name: string };

// SQL helpers
const q = (v: string | null | undefined): string =>
  v == null ? "null" : `'${v.replace(/'/g, "''")}'`;
const num = (v: number | null | undefined): string =>
  v == null ? "null" : String(v);
const bool = (v: boolean | null | undefined): string =>
  v == null ? "null" : v ? "true" : "false";
const textArray = (a: string[] | undefined): string =>
  !a?.length ? "null" : `array[${a.map(q).join(", ")}]::text[]`;

// HTML extraction
function extractArray<T>(html: string, varName: string, nextDecl: string): T[] {
  const startMarker = `const ${varName} = [`;
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(nextDecl, startIdx);
  if (startIdx < 0 || endIdx < 0) {
    throw new Error(`Não localizei array ${varName} (até "${nextDecl}")`);
  }
  const text = html
    .slice(startIdx + `const ${varName} = `.length, endIdx)
    .trim()
    .replace(/;\s*$/, "");
  return new Function(`return ${text}`)() as T[];
}

const MONTHS: Record<string, string> = {
  jan: "01", fev: "02", mar: "03", abr: "04",
  mai: "05", jun: "06", jul: "07", ago: "08",
  set: "09", out: "10", nov: "11", dez: "12",
};

function eventDate(e: EventData): string {
  const month = MONTHS[e.monthShort.toLowerCase()];
  if (!month) throw new Error(`Mês desconhecido: ${e.monthShort}`);
  return `${SEED_YEAR}-${month}-${e.dayNum.padStart(2, "0")}`;
}

// URL builders (paths já existem no Storage via seed-images.ts)
const u = {
  event: (slug: string) =>
    `${SUPABASE_URL}/storage/v1/object/public/event-images/${slug}.jpg`,
  proPhoto: (slug: string) =>
    `${SUPABASE_URL}/storage/v1/object/public/professional-images/${slug}/photo.jpg`,
  proCover: (slug: string) =>
    `${SUPABASE_URL}/storage/v1/object/public/professional-images/${slug}/cover.jpg`,
  proPortfolio: (slug: string, idx: number) =>
    `${SUPABASE_URL}/storage/v1/object/public/professional-images/${slug}/portfolio-${idx + 1}.jpg`,
  tribe: (slug: string) =>
    `${SUPABASE_URL}/storage/v1/object/public/tribe-covers/${slug}.jpg`,
};

// Host dedup (split por " + ", uma linha por pessoa única)
type HostRow = { name: string; bio: string | null; photo_url: string | null };

function computeHosts(events: EventData[]): HostRow[] {
  const map = new Map<string, HostRow>();
  for (const event of events) {
    if (!event.host?.name) continue;
    const names = event.host.name.split(" + ").map((s) => s.trim());
    const isMulti = names.length > 1;
    for (const name of names) {
      if (map.has(name)) continue;
      // Se a anfitriã só aparece em evento de host único, herda bio/photo do evento.
      // Em eventos multi-host, bio/photo do evento descreve o GRUPO, não a pessoa
      // — então deixa NULL e o Gustavo preenche depois.
      map.set(name, {
        name,
        bio: isMulti ? null : event.host.bio ?? null,
        photo_url: isMulti ? null : event.host.photo ?? null,
      });
    }
  }
  return [...map.values()];
}

type EventHostLink = { event_slug: string; host_name: string; role: string };

function computeEventHostLinks(events: EventData[]): EventHostLink[] {
  const out: EventHostLink[] = [];
  for (const event of events) {
    const names = (event.host?.name ?? "")
      .split(" + ")
      .map((s) => s.trim())
      .filter(Boolean);

    if (event.id === "pilates-bundle") {
      // Ambas principais (decisão do Gustavo)
      for (const name of names) {
        out.push({ event_slug: event.id, host_name: name, role: "principal" });
      }
    } else if (event.id === "yoga-mia") {
      // Mia principal, demais co-anfitriã (decisão do Gustavo)
      for (let i = 0; i < names.length; i++) {
        out.push({
          event_slug: event.id,
          host_name: names[i],
          role: i === 0 ? "principal" : "co-anfitria",
        });
      }
    } else {
      // Demais eventos: host único → principal
      for (const name of names) {
        out.push({ event_slug: event.id, host_name: name, role: "principal" });
      }
    }
  }
  return out;
}

function header(title: string): string {
  const line = "-- " + "=".repeat(60);
  return `\n${line}\n-- ${title}\n${line}\n\n`;
}

// SQL builders
function buildAlterHosts(): string {
  return (
    header("ALTER hosts — adicionar contato operacional") +
    `alter table public.hosts\n` +
    `  add column if not exists contact_email text,\n` +
    `  add column if not exists contact_whatsapp text;\n`
  );
}

function buildHosts(hosts: HostRow[]): string {
  let sql = header(`HOSTS (deduped) — ${hosts.length} linhas`);
  sql += `insert into public.hosts (name, bio, photo_url, contact_email, contact_whatsapp) values\n`;
  sql += hosts
    .map(
      (h) =>
        `  (${q(h.name)}, ${q(h.bio)}, ${q(h.photo_url)}, null, null)`,
    )
    .join(",\n");
  sql += `;\n`;
  return sql;
}

function buildEvents(events: EventData[]): string {
  let sql = header(`EVENTS — ${events.length} linhas`);
  sql += `insert into public.events (\n`;
  sql += `  slug, title, subtitle, description, category, cat_tag,\n`;
  sql += `  event_date, event_time, duration,\n`;
  sql += `  location_name, location_short,\n`;
  sql += `  price_cents, capacity, going_count,\n`;
  sql += `  image_url, thumb_url,\n`;
  sql += `  tag, tag_style, is_featured, status\n`;
  sql += `) values\n`;

  sql += events
    .map((e) => {
      const url = u.event(e.id);
      return (
        `  (\n` +
        `    ${q(e.id)}, ${q(e.title)}, ${q(e.subtitle)}, ${q(e.description)},\n` +
        `    ${q(e.category)}, ${q(e.catTag)},\n` +
        `    ${q(eventDate(e))}, ${q(e.time)}, ${q(e.duration)},\n` +
        `    ${q(e.location)}, ${q(e.locationShort)},\n` +
        `    ${num(e.price * 100)}, ${num(e.capacity)}, ${num(e.going)},\n` +
        `    ${q(url)}, ${q(url)},\n` +
        `    ${q(e.tag)}, ${q(e.tagStyle ?? "accent")}, ${bool(e.featured ?? false)}, 'published'\n` +
        `  )`
      );
    })
    .join(",\n");

  sql += `;\n`;
  return sql;
}

function buildEventHosts(links: EventHostLink[]): string {
  let sql = header(`EVENT_HOSTS — ${links.length} vínculos N:N`);
  sql += `insert into public.event_hosts (event_id, host_id, role)\n`;
  sql += `select e.id, h.id, link.role\n`;
  sql += `from (values\n`;
  sql += links
    .map(
      (l) =>
        `  (${q(l.event_slug)}, ${q(l.host_name)}, ${q(l.role)})`,
    )
    .join(",\n");
  sql += `\n) as link(event_slug, host_name, role)\n`;
  sql += `join public.events e on e.slug = link.event_slug\n`;
  sql += `join public.hosts h on h.name = link.host_name;\n`;
  return sql;
}

function buildEventActivities(events: EventData[]): string {
  type Row = {
    slug: string;
    icon: string;
    name: string;
    duration: string;
    sort_order: number;
  };
  const rows: Row[] = [];
  for (const e of events) {
    (e.activities ?? []).forEach((a, idx) => {
      rows.push({
        slug: e.id,
        icon: a.icon ?? "",
        name: a.name,
        duration: a.duration ?? "",
        sort_order: idx,
      });
    });
  }
  let sql = header(`EVENT_ACTIVITIES — ${rows.length} linhas`);
  sql += `insert into public.event_activities (event_id, icon, name, duration, sort_order)\n`;
  sql += `select e.id, a.icon, a.name, nullif(a.duration, ''), a.sort_order\n`;
  sql += `from (values\n`;
  sql += rows
    .map(
      (r) =>
        `  (${q(r.slug)}, ${q(r.icon)}, ${q(r.name)}, ${q(r.duration)}, ${num(r.sort_order)})`,
    )
    .join(",\n");
  sql += `\n) as a(event_slug, icon, name, duration, sort_order)\n`;
  sql += `join public.events e on e.slug = a.event_slug;\n`;
  return sql;
}

function buildProfessionals(pros: ProfessionalData[]): string {
  let sql = header(`PROFESSIONALS — ${pros.length} linhas`);
  sql += `insert into public.professionals (\n`;
  sql += `  slug, name, studio_name, handle, bio,\n`;
  sql += `  photo_url, cover_url,\n`;
  sql += `  primary_category, categories,\n`;
  sql += `  location_short, location_full, at_domicile,\n`;
  sql += `  price_from_cents, rating, review_count, indications_count,\n`;
  sql += `  is_verified, is_featured, status\n`;
  sql += `) values\n`;

  sql += pros
    .map(
      (p) =>
        `  (\n` +
        `    ${q(p.id)}, ${q(p.name)}, ${q(p.studio)}, ${q(p.handle)}, ${q(p.bio)},\n` +
        `    ${q(u.proPhoto(p.id))}, ${q(u.proCover(p.id))},\n` +
        `    ${q(p.primaryCategory)}, ${textArray(p.categories)},\n` +
        `    ${q(p.locationShort)}, ${q(p.locationFull)}, ${bool(p.atDomicile ?? false)},\n` +
        `    ${num((p.priceFrom ?? 0) * 100)}, ${num(p.rating)}, ${num(p.reviewCount)}, ${num(p.indications)},\n` +
        `    ${bool(p.verified ?? false)}, ${bool(p.featured ?? false)}, 'active'\n` +
        `  )`,
    )
    .join(",\n");

  sql += `;\n`;
  return sql;
}

function buildProfessionalServices(pros: ProfessionalData[]): string {
  type Row = { slug: string; name: string; price: number; duration: string; sort_order: number };
  const rows: Row[] = [];
  for (const p of pros) {
    (p.services ?? []).forEach((s, idx) => {
      rows.push({
        slug: p.id,
        name: s.name,
        price: s.price,
        duration: s.duration ?? "",
        sort_order: idx,
      });
    });
  }
  let sql = header(`PROFESSIONAL_SERVICES — ${rows.length} linhas`);
  sql += `insert into public.professional_services (professional_id, name, duration, price_cents, sort_order)\n`;
  sql += `select p.id, s.name, nullif(s.duration, ''), s.price_cents, s.sort_order\n`;
  sql += `from (values\n`;
  sql += rows
    .map(
      (r) =>
        `  (${q(r.slug)}, ${q(r.name)}, ${q(r.duration)}, ${num(r.price * 100)}, ${num(r.sort_order)})`,
    )
    .join(",\n");
  sql += `\n) as s(pro_slug, name, duration, price_cents, sort_order)\n`;
  sql += `join public.professionals p on p.slug = s.pro_slug;\n`;
  return sql;
}

function buildProfessionalPortfolio(pros: ProfessionalData[]): string {
  type Row = { slug: string; photo_url: string; sort_order: number };
  const rows: Row[] = [];
  for (const p of pros) {
    (p.portfolio ?? []).forEach((_url, idx) => {
      rows.push({
        slug: p.id,
        photo_url: u.proPortfolio(p.id, idx),
        sort_order: idx,
      });
    });
  }
  let sql = header(`PROFESSIONAL_PORTFOLIO — ${rows.length} linhas`);
  sql += `insert into public.professional_portfolio (professional_id, photo_url, sort_order)\n`;
  sql += `select p.id, pp.photo_url, pp.sort_order\n`;
  sql += `from (values\n`;
  sql += rows
    .map(
      (r) =>
        `  (${q(r.slug)}, ${q(r.photo_url)}, ${num(r.sort_order)})`,
    )
    .join(",\n");
  sql += `\n) as pp(pro_slug, photo_url, sort_order)\n`;
  sql += `join public.professionals p on p.slug = pp.pro_slug;\n`;
  return sql;
}

function buildTribesUpdate(tribes: TribeData[]): string {
  let sql = header(`TRIBES — update cover_url (já foram seedadas no init_schema)`);
  sql += `update public.tribes t set cover_url = c.url\n`;
  sql += `from (values\n`;
  sql += tribes
    .map((t) => `  (${q(t.id)}, ${q(u.tribe(t.id))})`)
    .join(",\n");
  sql += `\n) as c(slug, url)\n`;
  sql += `where t.slug = c.slug;\n`;
  return sql;
}

function main() {
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

  const hosts = computeHosts(events);
  const eventHostLinks = computeEventHostLinks(events);

  let out = "";
  out += `-- ============================================================\n`;
  out += `-- SEED DATA — gerado por scripts/generate-seed-sql.ts\n`;
  out += `-- ============================================================\n`;
  out += `-- Fonte: legacy/index.html (protótipo)\n`;
  out += `-- Imagens: já subidas em event-images, professional-images, tribe-covers\n`;
  out += `-- via scripts/seed-images.ts. URLs construídas a partir dos slugs.\n`;
  out += `--\n`;
  out += `-- Counts: ${events.length} eventos · ${hosts.length} hosts deduped ·\n`;
  out += `--         ${eventHostLinks.length} event_hosts · ${pros.length} profissionais ·\n`;
  out += `--         ${tribes.length} tribes (update cover_url)\n`;

  out += buildAlterHosts();
  out += buildHosts(hosts);
  out += buildEvents(events);
  out += buildEventHosts(eventHostLinks);
  out += buildEventActivities(events);
  out += buildProfessionals(pros);
  out += buildProfessionalServices(pros);
  out += buildProfessionalPortfolio(pros);
  out += buildTribesUpdate(tribes);

  process.stdout.write(out);
}

main();
