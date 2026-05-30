import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActivityIcon } from "@/components/detalhe/activity-icon";
import { EventHeroActions } from "@/components/detalhe/event-hero-actions";
import { ReservarCta } from "@/components/detalhe/reservar-cta";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { formatEventDate, formatPrice } from "@/lib/utils/date";

// Corpo do detalhe do evento compartilhado pela página cheia (/eventos/[slug])
// e pelo modal (intercepting route). O que muda entre os dois é só o wrapper
// externo e o botão de voltar/fechar — por isso o `backSlot` vem de fora.
export async function EventDetailView({
  slug,
  backSlot,
}: {
  slug: string;
  backSlot: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, slug, title, subtitle, description, category, cat_tag, event_date, event_time, duration, location_name, location_short, price_cents, capacity, going_count, image_url, tag, tag_style, host_summary, host_photo_url",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!event) notFound();

  const [{ data: activities }, { data: hostLinks }] = await Promise.all([
    supabase
      .from("event_activities")
      .select("icon, name, duration, sort_order")
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("event_hosts")
      .select("role, hosts(name, bio, photo_url)")
      .eq("event_id", event.id),
  ]);

  const hostNames = (hostLinks ?? [])
    .map((l) => l.hosts?.name)
    .filter(Boolean)
    .join(" + ");

  const isMultiHost = (hostLinks?.length ?? 0) > 1;
  const singleHost = !isMultiHost ? hostLinks?.[0]?.hosts : null;
  const hostBio = event.host_summary ?? singleHost?.bio ?? null;
  const hostPhoto = event.host_photo_url ?? singleHost?.photo_url ?? null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let saved = false;
  if (user) {
    const { data: savedRow } = await supabase
      .from("saved_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", event.id)
      .maybeSingle();
    saved = !!savedRow;
  }

  return (
    <>
      <div className="scroll-area with-cta">
        <div
          className="detail-hero"
          style={
            event.image_url
              ? { backgroundImage: `url('${event.image_url}')` }
              : undefined
          }
        >
          <div className="hero-actions">
            {backSlot}
            <EventHeroActions
              slug={event.slug}
              loggedIn={!!user}
              initialSaved={saved}
            />
          </div>
        </div>

        <div className="detail-body">
          {event.tag && (
            <span
              className={`detail-tag${event.tag_style === "primary" ? " primary" : ""}`}
            >
              ✦ {event.tag}
            </span>
          )}

          <h1 className="detail-title">{event.title}</h1>
          {event.subtitle && (
            <div className="detail-subtitle">{event.subtitle}</div>
          )}

          <div className="detail-meta-block">
            <div className="detail-meta-item">
              <div className="meta-icon">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <div className="meta-item-label">quando</div>
                <div>
                  {formatEventDate(event.event_date)}
                  {event.event_time ? ` · ${event.event_time}` : ""}
                </div>
              </div>
            </div>

            <div className="detail-meta-item">
              <div className="meta-icon">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <div className="meta-item-label">onde</div>
                <div>{event.location_name}</div>
              </div>
            </div>

            <div className="detail-meta-item">
              <div className="meta-icon">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <div className="meta-item-label">turma</div>
                <div>
                  {event.going_count ?? 0} de {event.capacity} vagas preenchidas
                </div>
              </div>
            </div>
          </div>

          {activities && activities.length > 0 && (
            <div className="activities-section">
              <div className="activities-title">O que tá incluso</div>
              <div className="activities-grid">
                {activities.map((a, idx) => (
                  <div key={idx} className="activity-card">
                    <div className="activity-icon">
                      <ActivityIcon name={a.icon} />
                    </div>
                    <div className="activity-name">{a.name}</div>
                    {a.duration && (
                      <div className="activity-duration">{a.duration}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.description && (
            <div className="detail-description">{event.description}</div>
          )}

          {hostNames && (
            <div className="host-card">
              <div
                className="host-avatar"
                style={
                  hostPhoto
                    ? { backgroundImage: `url('${hostPhoto}')` }
                    : undefined
                }
              />
              <div className="host-info">
                <div className="host-label">
                  {isMultiHost ? "Anfitriãs" : "Anfitriã"}
                </div>
                <div className="host-name">{hostNames}</div>
                {hostBio && <div className="host-bio">{hostBio}</div>}
              </div>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <WhatsAppButton
              context="event-question"
              eventTitle={event.title}
              label="Tirar dúvida no WhatsApp"
            />
          </div>
        </div>
      </div>

      <div className="sticky-cta">
        <div className="price-block">
          <div className="price-label">por pessoa</div>
          <div className="price-value">{formatPrice(event.price_cents)}</div>
        </div>
        <ReservarCta slug={event.slug} />
      </div>
    </>
  );
}
