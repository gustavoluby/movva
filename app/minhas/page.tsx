import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/bottom-nav";
import { formatEventDate, eventStartTime } from "@/lib/utils/date";

export default async function MinhasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/minhas");
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      `id, payment_status, amount_cents, created_at,
       events(slug, title, event_date, event_time, location_name, image_url)`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = bookings ?? [];

  return (
    <div className="movva-shell">
      <div className="scroll-area with-nav">
        <header className="home-header">
          <div>
            <div className="greeting-label">suas reservas</div>
            <div className="greeting-name">Minhas</div>
          </div>
        </header>

        {list.length === 0 ? (
          <div className="minhas-empty">
            <p className="minhas-empty-text">
              Você ainda não reservou nenhuma experiência.
            </p>
            <Link href="/" className="minhas-empty-cta">
              Descobrir eventos →
            </Link>
          </div>
        ) : (
          <div className="booking-list">
            {list.map((b) => {
              const ev = b.events;
              if (!ev) return null;
              const isPaid = b.payment_status === "paid";
              return (
                <Link
                  key={b.id}
                  href={`/reservar/${ev.slug}`}
                  className="booking-card"
                >
                  {ev.image_url && (
                    <div
                      className="booking-thumb"
                      style={{ backgroundImage: `url('${ev.image_url}')` }}
                    />
                  )}
                  <div className="booking-info">
                    <span
                      className={`booking-status${isPaid ? " paid" : ""}`}
                    >
                      {isPaid ? "Confirmada" : "Aguardando pagamento"}
                    </span>
                    <div className="booking-title">{ev.title}</div>
                    <div className="booking-meta">
                      {formatEventDate(ev.event_date)}
                      {ev.event_time
                        ? ` · ${eventStartTime(ev.event_time)}`
                        : ""}
                    </div>
                    <div className="booking-meta">{ev.location_name}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="h-12" />
      </div>
      <BottomNav loggedIn={!!user} />
    </div>
  );
}
