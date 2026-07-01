import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActivityIcon } from "@/components/detalhe/activity-icon";
import { EventHeroActions } from "@/components/detalhe/event-hero-actions";
import { ReservarCta } from "@/components/detalhe/reservar-cta";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { formatEventDate, formatPrice } from "@/lib/utils/date";
import { getEventAvailability } from "@/lib/events/availability";
import { JsonLd } from "@/components/seo/json-ld";
import {
  SITE_NAME,
  SITE_URL,
  SITE_CITY,
  SITE_REGION,
  absoluteUrl,
} from "@/lib/site";

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
      "id, slug, title, subtitle, description, category, cat_tag, event_date, event_time, duration, location_name, location_short, location_address, location_lat, location_lng, price_cents, capacity, going_count, image_url, tag, tag_style, host_summary, host_photo_url",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!event) notFound();

  const availability = await getEventAvailability(event.id, event.capacity);
  // Contador = vendas reais (pagas), não going_count (que inclui seed/prova social).
  const ocupadas = availability.sold;

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

  // Ordena: anfitriãs primeiro, depois professora/palestrante.
  const roleRank = (role: string | null) =>
    role === "principal" || role === "anfitria"
      ? 0
      : role === "co-anfitria"
        ? 1
        : 3;
  const hosts = [...(hostLinks ?? [])]
    .filter((l) => l.hosts?.name)
    .sort((a, b) => roleRank(a.role) - roleRank(b.role));
  const roleLabel = (role: string | null) =>
    role === "principal"
      ? "Anfitriã principal"
      : role === "anfitria"
        ? "Anfitriã"
        : role === "professora-yoga"
          ? "Professora de yoga"
          : role === "palestrante"
            ? "Palestrante"
            : "Co-anfitriã";
  const isMultiHost = hosts.length > 1;

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

  // ---- SEO / GEO -----------------------------------------------------------
  const eventUrl = absoluteUrl(`/eventos/${event.slug}`);
  const reservarUrl = absoluteUrl(`/reservar/${event.slug}`);
  const dateLabel = formatEventDate(event.event_date);
  const priceLabel = formatPrice(event.price_cents);
  // location_short às vezes repete o nome do local (não é o bairro); só usa
  // como complemento se de fato diferir do location_name.
  const bairro =
    event.location_short &&
    event.location_short.toLowerCase() !== event.location_name.toLowerCase()
      ? event.location_short
      : null;

  // Endereço: separa o CEP (postalCode) do logradouro (streetAddress).
  const cepMatch = event.location_address?.match(/\d{5}-?\d{3}/);
  const postalCode = cepMatch ? cepMatch[0] : null;
  const streetAddress =
    event.location_address?.replace(/,?\s*\d{5}-?\d{3}\s*$/, "").trim() ||
    event.location_address ||
    null;

  // startDate ISO: usa a 1ª hora encontrada no event_time livre (ex.: "10h",
  // "19h às 22h"); se não achar, fica só a data.
  const hourMatch = event.event_time?.match(/(\d{1,2})\s*h/);
  const startHour = hourMatch ? hourMatch[1].padStart(2, "0") : null;
  const startDate = startHour
    ? `${event.event_date}T${startHour}:00:00-03:00`
    : event.event_date;

  // Fatos autocontidos (declarativos) pra extração por IA.
  const factsSentence = `O ${event.title} acontece em ${dateLabel}${
    event.event_time ? `, ${event.event_time}` : ""
  }, no ${event.location_name}, em ${SITE_CITY}, ${SITE_REGION}. O ingresso custa ${priceLabel} por pessoa e há ${event.capacity} vagas.`;

  // FAQ — construído uma vez e usado tanto no HTML visível quanto no FAQPage
  // (paridade obrigatória do Google).
  const activityNames = (activities ?? []).map((a) => a.name).filter(Boolean);
  const faq: { q: string; a: string }[] = [
    {
      q: `Quando acontece o ${event.title}?`,
      a: `${dateLabel}${event.event_time ? `, ${event.event_time}` : ""}, em ${SITE_CITY}, ${SITE_REGION}.`,
    },
    {
      q: `Onde acontece o ${event.title}?`,
      a: `No ${event.location_name}${
        bairro ? ` (${bairro})` : ""
      }, em ${SITE_CITY}, ${SITE_REGION}.${
        event.location_address ? ` ${event.location_address}.` : ""
      }`,
    },
    {
      q: "Quanto custa?",
      a: `${priceLabel} por pessoa.`,
    },
    ...(activityNames.length > 0
      ? [
          {
            q: "O que está incluso?",
            a: `${activityNames.join(", ")}.`,
          },
        ]
      : event.subtitle
        ? [{ q: "O que está incluso?", a: `${event.subtitle}.` }]
        : []),
    {
      q: "Quantas vagas?",
      a: `${event.capacity} vagas. Turma reduzida.`,
    },
  ];

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || event.subtitle || event.title,
    startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(event.image_url ? { image: [event.image_url] } : {}),
    url: eventUrl,
    maximumAttendeeCapacity: event.capacity,
    location: {
      "@type": "Place",
      name: event.location_name,
      address: {
        "@type": "PostalAddress",
        ...(streetAddress ? { streetAddress } : {}),
        ...(postalCode ? { postalCode } : {}),
        addressLocality: SITE_CITY,
        addressRegion: SITE_REGION,
        addressCountry: "BR",
      },
      ...(event.location_lat != null && event.location_lng != null
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: event.location_lat,
              longitude: event.location_lng,
            },
          }
        : {}),
    },
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(hosts.length > 0
      ? {
          performer: hosts.map((l) => ({
            "@type": "Person",
            name: l.hosts?.name,
          })),
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: (event.price_cents / 100).toFixed(2),
      priceCurrency: "BRL",
      availability: availability.soldOut
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      url: reservarUrl,
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: event.title,
        item: eventUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[eventLd, faqLd, breadcrumbLd]} />
      <div className="scroll-area with-cta">
        <div className="detail-hero">
          {event.image_url && (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 640px"
              style={{ objectFit: "cover" }}
            />
          )}
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

          <h1 className="detail-title">
            {event.title}
            <span className="sr-only"> em {SITE_CITY}</span>
          </h1>
          {event.subtitle && (
            <div className="detail-subtitle">{event.subtitle}</div>
          )}
          <p className="sr-only">{factsSentence}</p>

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
                  <time dateTime={startDate}>
                    {formatEventDate(event.event_date)}
                    {event.event_time ? ` · ${event.event_time}` : ""}
                  </time>
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
                  {availability.soldOut
                    ? "Vagas esgotadas"
                    : availability.halfReached
                      ? `${ocupadas} de ${availability.total} vagas`
                      : `${availability.total} vagas`}
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

          {hosts.length > 0 && (
            <div className="hosts-section">
              <div className="host-label">
                {isMultiHost ? "Anfitriãs" : "Anfitriã"}
              </div>
              <div className="hosts-list">
                {hosts.map((l, idx) => {
                  const photo = l.hosts?.photo_url;
                  return (
                    <div key={idx} className="host-card">
                      <div
                        className="host-avatar"
                        style={
                          photo
                            ? { backgroundImage: `url('${photo}')` }
                            : undefined
                        }
                      >
                        {!photo && (
                          <span className="host-avatar-initial">
                            {l.hosts?.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="host-info">
                        <div className="host-name">{l.hosts?.name}</div>
                        <div className="host-bio">{roleLabel(l.role)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {faq.length > 0 && (
            <section className="faq-section">
              <h2 className="faq-title">Perguntas frequentes</h2>
              <dl className="faq-list">
                {faq.map((f, idx) => (
                  <div key={idx} className="faq-item">
                    <dt className="faq-q">{f.q}</dt>
                    <dd className="faq-a">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
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
        <ReservarCta slug={event.slug} soldOut={availability.soldOut} />
      </div>
    </>
  );
}
