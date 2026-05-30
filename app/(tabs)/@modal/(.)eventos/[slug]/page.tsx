import { EventDetailView } from "@/components/detalhe/event-detail-view";
import { EventModal } from "@/components/detalhe/event-modal";
import { ModalCloseButton } from "@/components/detalhe/modal-close-button";

// Intercepta /eventos/[slug] quando navegado de dentro das abas: abre o
// detalhe como modal. Link direto / refresh cai na página cheia normal
// (app/eventos/[slug]/page.tsx).
export default async function EventModalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <EventModal>
      <EventDetailView slug={slug} backSlot={<ModalCloseButton />} />
    </EventModal>
  );
}
