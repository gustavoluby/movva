import Link from "next/link";
import { EventDetailView } from "@/components/detalhe/event-detail-view";

export const revalidate = 60;

type Params = { slug: string };

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
