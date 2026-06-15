import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FeaturedCard } from "@/components/descobrir/featured-card";
import { EventCard } from "@/components/descobrir/event-card";
import { CategoryChips } from "@/components/descobrir/category-chips";
import { CATEGORY_DEFS, eventCategories } from "@/lib/categories";

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
      "id, slug, title, subtitle, description, category, cat_tag, event_date, event_time, location_name, location_short, price_cents, capacity, going_count, image_url, thumb_url, tag, tag_style, is_featured",
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

  const featured = visible.find((e) => e.is_featured) ?? visible[0];
  const others = visible.filter((e) => e.slug !== featured?.slug);

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
      <header className="home-header">
          <div>
            <div className="greeting-label">bem vinda ao</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/moodpass-logo-horizontal.png"
              alt="Moodpass"
              className="home-logo-img"
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
                  imageUrl={e.image_url}
                  eventDate={e.event_date}
                  eventTime={e.event_time}
                  locationName={e.location_name}
                  priceCents={e.price_cents}
                  capacity={e.capacity}
                  goingCount={soldCount.get(e.id) ?? 0}
                  soldOut={soldOut.get(e.id) ?? false}
                />
              ))}
            </div>
          </>
        )}

      <div className="h-12" />
    </div>
  );
}
