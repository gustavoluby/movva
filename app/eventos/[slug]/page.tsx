import type { Metadata } from "next";
import Link from "next/link";
import { EventDetailView } from "@/components/detalhe/event-detail-view";
import { createClient } from "@/lib/supabase/server";
import {
  SITE_NAME,
  SITE_CITY,
  SITE_OG_IMAGE,
  absoluteUrl,
} from "@/lib/site";
import { formatEventDate, formatPrice } from "@/lib/utils/date";

export const revalidate = 60;

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select(
      "title, subtitle, description, event_date, price_cents, location_name, location_short, image_url",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!event) {
    return { title: "Evento não encontrado" };
  }

  const url = absoluteUrl(`/eventos/${slug}`);
  const dateStr = formatEventDate(event.event_date);
  const priceStr = formatPrice(event.price_cents);
  const local = event.location_short
    ? `${event.location_name}, ${event.location_short}`
    : event.location_name;

  const title = `${event.title} em ${SITE_CITY} · ${dateStr}`;
  const description =
    event.description?.slice(0, 160) ??
    `${event.subtitle ? event.subtitle + ". " : ""}${dateStr}, no ${local}, em ${SITE_CITY}. ${priceStr} por pessoa. Vagas limitadas.`.slice(
      0,
      160,
    );
  const ogImage = event.image_url ?? SITE_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${event.title} em ${SITE_CITY} · ${dateStr}`,
      description,
      siteName: SITE_NAME,
      locale: "pt_BR",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${event.title} em ${SITE_CITY}`,
      description,
      images: [ogImage],
    },
  };
}

// Botão "voltar" da página cheia → leva pra Experiências.
const backToHome = (
  <Link href="/" className="hero-btn" aria-label="Voltar">
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  </Link>
);

export default async function EventDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  return (
    <div className="moodpass-shell detail-page">
      <EventDetailView slug={slug} backSlot={backToHome} />
    </div>
  );
}
