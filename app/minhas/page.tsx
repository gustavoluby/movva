import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/bottom-nav";
import {
  eventStartTime,
  formatEventDate,
  monthNameUpper,
  todayISO,
} from "@/lib/utils/date";

export const dynamic = "force-dynamic";

// Extrai horas de uma string tipo "9h", "19h30 às 22h", "3h" → primeiro número.
function parseHours(...vals: (string | null | undefined)[]): number {
  for (const v of vals) {
    const m = v?.match(/(\d+)\s*h/i);
    if (m) return Number(m[1]);
  }
  return 0;
}

type Booking = {
  id: string;
  events: {
    id: string;
    slug: string;
    title: string;
    event_date: string;
    event_time: string | null;
    duration: string | null;
    location_name: string;
    image_url: string | null;
    thumb_url: string | null;
  } | null;
};

type Saved = {
  id: string;
  events: {
    id: string;
    slug: string;
    title: string;
    event_date: string;
    event_time: string | null;
    location_name: string;
    image_url: string | null;
    thumb_url: string | null;
  } | null;
};

export default async function MinhasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/minhas");

  const [{ data: bookings }, { count: checkins }, { data: savedRows }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(
          `id,
         events(id, slug, title, event_date, event_time, duration, location_name, image_url, thumb_url)`,
        )
        .eq("user_id", user.id),
      supabase
        .from("feed_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "approved"),
      supabase
        .from("saved_events")
        .select(
          `id, created_at,
         events(id, slug, title, event_date, event_time, location_name, image_url, thumb_url)`,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  const today = todayISO();
  const list = ((bookings ?? []) as Booking[]).filter((b) => b.events);
  const bookedIds = new Set(list.map((b) => b.events!.id));
  // Salvos que ainda não viraram reserva — não duplica o que já está em Próximos.
  const saved = ((savedRows ?? []) as Saved[]).filter(
    (s) => s.events && !bookedIds.has(s.events.id),
  );

  const upcoming = list
    .filter((b) => b.events!.event_date >= today)
    .sort((a, b) => a.events!.event_date.localeCompare(b.events!.event_date));
  const past = list
    .filter((b) => b.events!.event_date < today)
    .sort((a, b) => b.events!.event_date.localeCompare(a.events!.event_date));

  const totalHours = past.reduce(
    (sum, b) => sum + parseHours(b.events!.duration, b.events!.event_time),
    0,
  );

  const stats = [
    { n: totalHours > 0 ? `${totalHours}h` : "—", label: "de movimento" },
    { n: checkins ?? 0, label: "check-ins" },
  ];

  return (
    <div className="movva-shell">
      <div className="scroll-area with-nav">
        <section className="home-prompt jornada-head">
          <h2>
            Sua <em>jornada</em>
          </h2>
          <p className="jornada-tagline">cada passo conta uma história</p>
        </section>

        <section className="jornada-card">
          <div className="jornada-card-label">
            {monthNameUpper(new Date())} · ATÉ AGORA
          </div>
          <div className="jornada-card-big">
            {past.length} <em>experiências</em>
          </div>
          <div className="jornada-card-stats">
            {stats.map((s) => (
              <div key={s.label} className="jornada-stat">
                <div className="jornada-stat-n">{s.n}</div>
                <div className="jornada-stat-l">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="jornada-section">
          <div className="jornada-section-head">
            <h3>Próximos</h3>
          </div>
          {upcoming.length === 0 ? (
            <p className="jornada-empty">
              Você ainda não tem experiências marcadas.{" "}
              <Link href="/">Volta na aba Descobrir</Link> pra ver o que tá
              rolando.
            </p>
          ) : (
            <div className="jornada-list">
              {upcoming.map((b) => {
                const ev = b.events!;
                return (
                  <Link
                    key={b.id}
                    href={`/reservar/${ev.slug}`}
                    className="jornada-item"
                  >
                    <div
                      className="jornada-thumb"
                      style={
                        ev.thumb_url || ev.image_url
                          ? {
                              backgroundImage: `url('${ev.thumb_url ?? ev.image_url}')`,
                            }
                          : undefined
                      }
                    />
                    <div className="jornada-item-body">
                      <div className="jornada-item-title">{ev.title}</div>
                      <div className="jornada-item-meta">
                        {formatEventDate(ev.event_date)}
                        {ev.event_time
                          ? ` · ${eventStartTime(ev.event_time)}`
                          : ""}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {saved.length > 0 && (
          <section className="jornada-section">
            <div className="jornada-section-head">
              <h3>Salvos</h3>
            </div>
            <div className="jornada-list">
              {saved.map((s) => {
                const ev = s.events!;
                return (
                  <Link
                    key={s.id}
                    href={`/eventos/${ev.slug}`}
                    className="jornada-item"
                  >
                    <div
                      className="jornada-thumb"
                      style={
                        ev.thumb_url || ev.image_url
                          ? {
                              backgroundImage: `url('${ev.thumb_url ?? ev.image_url}')`,
                            }
                          : undefined
                      }
                    />
                    <div className="jornada-item-body">
                      <div className="jornada-item-title">{ev.title}</div>
                      <div className="jornada-item-meta">
                        {formatEventDate(ev.event_date)}
                        {ev.event_time
                          ? ` · ${eventStartTime(ev.event_time)}`
                          : ""}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="jornada-section">
            <div className="jornada-section-head">
              <h3>Anteriores</h3>
            </div>
            <div className="jornada-list">
              {past.map((b) => {
                const ev = b.events!;
                return (
                  <div key={b.id} className="jornada-item">
                    <div
                      className="jornada-thumb"
                      style={
                        ev.thumb_url || ev.image_url
                          ? {
                              backgroundImage: `url('${ev.thumb_url ?? ev.image_url}')`,
                            }
                          : undefined
                      }
                    />
                    <div className="jornada-item-body">
                      <div className="jornada-item-title">{ev.title}</div>
                      <div className="jornada-item-meta">
                        {formatEventDate(ev.event_date)}
                        {ev.event_time
                          ? ` · ${eventStartTime(ev.event_time)}`
                          : ""}
                      </div>
                    </div>
                    <Link
                      href={`/comunidade/novo?evento=${ev.id}`}
                      className="jornada-checkin"
                    >
                      + Check-in
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {list.length === 0 && saved.length === 0 && (
          <div className="minhas-empty">
            <Link href="/" className="minhas-empty-cta">
              Descobrir experiências →
            </Link>
          </div>
        )}

        <div className="h-12" />
      </div>
      <BottomNav loggedIn={!!user} />
    </div>
  );
}
