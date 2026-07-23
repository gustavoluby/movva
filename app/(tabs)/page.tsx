import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FeaturedCard } from "@/components/descobrir/featured-card";
import { EventCard } from "@/components/descobrir/event-card";
import { CategoryChips } from "@/components/descobrir/category-chips";
import { CATEGORY_DEFS, eventCategories } from "@/lib/categories";
import { activePriceCents } from "@/lib/events/pricing";
import { JsonLd } from "@/components/seo/json-ld";
import {
  SITE_URL,
  SITE_NAME,
  SITE_CITY,
  SITE_DESCRIPTION,
  absoluteUrl,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Experiências de bem-estar para mulheres em Curitiba",
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    url: SITE_URL,
    title: `${SITE_NAME} · Experiências de bem-estar para mulheres em Curitiba`,
    description: SITE_DESCRIPTION,
  },
};

export default async function DescobrirPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, slug, title, subtitle, description, category, cat_tag, event_date, event_time, location_name, location_short, price_cents, price_tier2_cents, tier1_capacity, capacity, going_count, image_url, thumb_url, tag, tag_style, is_featured",
    )
    .eq("status", "published")
    .order("event_date", { ascending: true });

  if (error) {
    return (
      <main className="p-10 text-center text-sm text-muted-foreground">
        Erro carregando eventos: {error.message}
      </main>
    );
  }

  const list = events ?? [];

  // Só mostra o chip de uma categoria se houver evento publicado nela.
  const presentKeys = new Set(list.flatMap((e) => eventCategories(e.title)));
  const availableCats = CATEGORY_DEFS.filter((c) => presentKeys.has(c.key));

  // Filtro ativo só vale se a categoria existir; senão cai em "Tudo".
  const activeCat =
    cat && availableCats.some((c) => c.key === cat) ? cat : null;

  const chips = [
    { key: "tudo", label: "✦ Tudo", href: "/", active: !activeCat },
    ...availableCats.map((c) => ({
      key: c.key,
      label: c.label,
      href: `/?cat=${c.key}`,
      active: activeCat === c.key,
    })),
  ];

  const visible = activeCat
    ? list.filter((e) => eventCategories(e.title).includes(activeCat))
    : list;

  // Hoje em Curitiba (America/Sao_Paulo) como "YYYY-MM-DD" — compara direto com
  // event_date (também YYYY-MM-DD) pra separar o que ainda vai rolar do que já
  // aconteceu. Evento do próprio dia ainda conta como futuro.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  const upcoming = visible.filter((e) => e.event_date >= today);
  // Passados: mais recentes primeiro (event_date desc).
  const past = visible
    .filter((e) => e.event_date < today)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  const featured = upcoming.find((e) => e.is_featured) ?? upcoming[0];
  const others = upcoming.filter((e) => e.slug !== featured?.slug);

  // Vendas pagas por evento (todas as usuárias → service-role). Uma query em
  // lote. O contador exibido = vendas reais; esgota deixando 1 vaga de reserva.
  const soldCount = new Map<string, number>();
  const soldOut = new Map<string, boolean>();
  if (visible.length > 0) {
    const admin = createAdminClient();
    const { data: paidRows } = await admin
      .from("bookings")
      .select("event_id")
      .in(
        "event_id",
        visible.map((e) => e.id),
      )
      .eq("payment_status", "paid");
    for (const r of paidRows ?? [])
      soldCount.set(r.event_id, (soldCount.get(r.event_id) ?? 0) + 1);
    for (const e of visible)
      soldOut.set(e.id, (soldCount.get(e.id) ?? 0) >= Math.max(0, e.capacity - 1));
  }

  return (
    <div className="scroll-area with-nav">
      {list.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Próximas experiências da Moodpass em Curitiba",
            itemListElement: list.map((e, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: absoluteUrl(`/eventos/${e.slug}`),
              name: e.title,
            })),
          }}
        />
      )}
      <header className="home-header">
          <div>
            <h1 className="sr-only">
              Experiências de bem-estar para mulheres em Curitiba
            </h1>
            <p className="sr-only">
              A Moodpass é uma curadoria de experiências de bem-estar para
              mulheres em Curitiba, PR — yoga, autocuidado, drenagem, brunchs e
              encontros em turmas pequenas.
            </p>
            <div className="greeting-label">bem vinda ao</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/moodpass-logo-horizontal.webp"
              alt="Moodpass"
              className="home-logo-img"
              width={121}
              height={30}
            />
          </div>
        </header>

        <section className="home-prompt">
          <h2>
            Qual é o seu <em>Mood</em>
            <br />
            da semana?
          </h2>
        </section>

        {featured && (
          <FeaturedCard
            slug={featured.slug}
            title={featured.title}
            subtitle={featured.subtitle}
            imageUrl={featured.image_url}
            eventDate={featured.event_date}
            eventTime={featured.event_time}
            capacity={featured.capacity}
            goingCount={soldCount.get(featured.id) ?? 0}
            soldOut={soldOut.get(featured.id) ?? false}
          />
        )}

        <CategoryChips chips={chips} />

        {others.length > 0 && (
          <>
            <div className="section-header">
              <h3>Próximos eventos</h3>
            </div>

            <div className="event-list">
              {others.map((e) => (
                <EventCard
                  key={e.slug}
                  slug={e.slug}
                  title={e.title}
                  subtitle={e.subtitle}
                  category={e.category}
                  catTag={e.cat_tag}
                  tag={e.tag}
                  tagStyle={e.tag_style}
                  imageUrl={e.thumb_url ?? e.image_url}
                  eventDate={e.event_date}
                  eventTime={e.event_time}
                  locationName={e.location_name}
                  priceCents={activePriceCents(e, soldCount.get(e.id) ?? 0)}
                  capacity={e.capacity}
                  goingCount={soldCount.get(e.id) ?? 0}
                  soldOut={soldOut.get(e.id) ?? false}
                />
              ))}
            </div>
          </>
        )}

        {past.length > 0 && (
          <>
            <div className="section-header">
              <h3>Experiências que já rolaram</h3>
            </div>

            <div className="event-list">
              {past.map((e) => (
                <EventCard
                  key={e.slug}
                  slug={e.slug}
                  title={e.title}
                  subtitle={e.subtitle}
                  category={e.category}
                  catTag={e.cat_tag}
                  tag={e.tag}
                  tagStyle={e.tag_style}
                  imageUrl={e.thumb_url ?? e.image_url}
                  eventDate={e.event_date}
                  eventTime={e.event_time}
                  locationName={e.location_name}
                  priceCents={activePriceCents(e, soldCount.get(e.id) ?? 0)}
                  capacity={e.capacity}
                  goingCount={soldCount.get(e.id) ?? 0}
                  soldOut={soldOut.get(e.id) ?? false}
                  past
                />
              ))}
            </div>
          </>
        )}

        <Link href="/sobre" className="home-about-cta">
          <span className="home-about-kicker">Novidade por aqui?</span>
          <h3 className="home-about-title">Conheça o Moodpass</h3>
          <p className="home-about-sub">
            Uma curadoria de experiências de bem-estar pra mulheres florescerem
            juntas em {SITE_CITY}.
          </p>
          <span className="home-about-link">
            Saber mais
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </Link>

      <div className="h-12" />
    </div>
  );
}
