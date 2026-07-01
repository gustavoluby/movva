import { createClient } from "@supabase/supabase-js";
import { SITE_URL, SITE_TAGLINE, absoluteUrl } from "@/lib/site";

// /llms.txt — índice em markdown pra motores generativos (ChatGPT, Perplexity,
// Gemini) entenderem a marca e citarem os eventos com fatos autocontidos.
export const revalidate = 3600;

function fmtDate(d: string): string {
  // 'YYYY-MM-DD' → 'DD/MM/YYYY' sem depender de timezone.
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function fmtPrice(cents: number): string {
  return `R$${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export async function GET() {
  let eventsBlock = "";
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    const { data: events } = await supabase
      .from("events")
      .select("slug, title, subtitle, event_date, price_cents, location_name")
      .eq("status", "published")
      .gte("event_date", new Date().toISOString().slice(0, 10))
      .order("event_date", { ascending: true });

    eventsBlock = (events ?? [])
      .map((e) => {
        const facts = [
          fmtDate(e.event_date),
          fmtPrice(e.price_cents),
          e.location_name,
          "Curitiba",
        ]
          .filter(Boolean)
          .join(", ");
        const desc = e.subtitle ? `${e.subtitle}. ` : "";
        return `- [${e.title}](${absoluteUrl(`/eventos/${e.slug}`)}): ${desc}${facts}.`;
      })
      .join("\n");
  } catch {
    eventsBlock = "";
  }

  const body = `# Moodpass

> ${SITE_TAGLINE}: yoga, autocuidado, drenagem, brunchs e encontros em turmas pequenas.

A Moodpass é uma curadoria de experiências de bem-estar para mulheres em Curitiba, PR.
As experiências acontecem presencialmente em Curitiba, em turmas reduzidas.

## Próximas experiências
${eventsBlock || "- (sem eventos publicados no momento)"}

## Sobre
- [Home](${SITE_URL}/): quem é a Moodpass e como funciona.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
