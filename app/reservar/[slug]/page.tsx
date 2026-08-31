import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate, formatPrice, isPastEvent } from "@/lib/utils/date";
import { reconcilePayment } from "@/lib/payments/mercadopago-reconcile";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getEventAvailability } from "@/lib/events/availability";
import { activePriceCents } from "@/lib/events/pricing";
import { CheckoutForm } from "./checkout-form";
import { MetaTrack } from "@/components/analytics/meta-events";
import { brl } from "@/lib/analytics/meta-pixel";
import { PendingPoller } from "./pending-poller";

type Params = { slug: string };
type Query = { payment_id?: string; status?: string; collection_status?: string };

export default async function ReservarPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Query>;
}) {
  const { slug } = await params;
  const { payment_id, status, collection_status } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signup?next=/reservar/${encodeURIComponent(slug)}`);
  }

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, slug, title, subtitle, event_date, event_time, is_recurring, location_name, price_cents, price_tier2_cents, tier1_capacity, capacity, going_count, image_url",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!event) redirect("/");

  // Volta do checkout do MP com ?payment_id=... → reconcilia a reserva antes
  // de renderizar (rede de segurança caso o webhook ainda não tenha chegado,
  // ou em localhost onde ele não chega). Idempotente; só reflete o que o MP
  // confirma. Os Links internos nunca carregam payment_id, então prefetch
  // não dispara isso.
  if (payment_id) {
    try {
      await reconcilePayment(String(payment_id));
    } catch (err) {
      console.error("[reservar] reconcile no retorno falhou:", err);
    }
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, payment_status, amount_cents, created_at")
    .eq("user_id", user.id)
    .eq("event_id", event.id)
    .maybeSingle();

  const eventCard = (
    <div className="reservar-card">
      {event.image_url && (
        <div
          className="reservar-card-image"
          style={{ backgroundImage: `url('${event.image_url}')` }}
        />
      )}
      <div className="reservar-card-body">
        <div className="reservar-card-title">{event.title}</div>
        <div className="reservar-card-meta">
          {formatEventDate(event.event_date)}
          {event.event_time ? ` · ${event.event_time}` : ""}
        </div>
        <div className="reservar-card-meta">{event.location_name}</div>
      </div>
    </div>
  );

  const isPaid = booking?.payment_status === "paid";

  // Já rolou: quem comprou continua vendo o ingresso; o resto não compra mais.
  if (!isPaid && isPastEvent(event)) {
    return (
      <div className="moodpass-shell">
        <main className="reservar-page">
          <div className="reservar-icon" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
            </svg>
          </div>
          <h1 className="reservar-title">Esse encontro já rolou</h1>
          <p className="reservar-subtitle">
            Essa experiência já aconteceu. Dá uma olhada no que vem por aí —
            tem coisa boa chegando.
          </p>
          {eventCard}
          <Link href="/" className="reservar-back">
            ← Ver as próximas
          </Link>
        </main>
      </div>
    );
  }

  // Esgotamento: quem ainda não pagou não consegue finalizar depois de lotar.
  const { soldOut, sold } = await getEventAvailability(event.id, event.capacity);
  // Preço base do checkout = lote ativo agora (função das vendas pagas). A
  // cobrança recalcula isso no servidor, então esse valor é só pra exibir.
  const basePriceCents = activePriceCents(event, sold);
  if (!isPaid && soldOut) {
    return (
      <div className="moodpass-shell">
        <main className="reservar-page">
          <div className="reservar-icon" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
            </svg>
          </div>
          <h1 className="reservar-title">Vagas esgotadas</h1>
          <p className="reservar-subtitle">
            As vagas desse evento acabaram. Fica de olho — em breve tem mais.
          </p>
          {eventCard}
          <Link href={`/eventos/${event.slug}`} className="reservar-back">
            ← Voltar pro evento
          </Link>
        </main>
      </div>
    );
  }

  // Status quando a pessoa volta do checkout do MP (back_urls trazem ?status=).
  const mpStatus = status ?? collection_status;
  const returnState: "pending" | "failure" | null = isPaid
    ? null
    : mpStatus === "pending" || mpStatus === "in_process"
      ? "pending"
      : mpStatus === "rejected" ||
          mpStatus === "failure" ||
          mpStatus === "cancelled"
        ? "failure"
        : null;

  // ----- Ainda não pagou: tela única de checkout (cria reserva + abre o MP) -----
  if (!isPaid) {
    return (
      <div className="moodpass-shell">
        <main className="reservar-page">
          <div className="reservar-icon" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
            </svg>
          </div>

          <h1 className="reservar-title">Garantir minha vaga</h1>
          <p className="reservar-subtitle">
            {returnState === "pending"
              ? "Estamos confirmando seu pagamento."
              : returnState === "failure"
                ? "O pagamento não foi concluído — é só tentar de novo."
                : "Finalize com Pix ou cartão pra garantir sua vaga."}
          </p>

          {eventCard}

          {returnState === "pending" && (
            <div className="reservar-pix-placeholder">
              <PendingPoller />
              <div className="reservar-pix-label">pagamento em processamento</div>
              <p className="reservar-pix-text">
                Estamos confirmando seu pagamento — esta tela atualiza sozinha.
                Pix e cartão que pediram autorização do banco levam alguns
                segundos.
              </p>
            </div>
          )}

          <CheckoutForm
            slug={event.slug}
            basePriceCents={basePriceCents}
            eventTitle={event.title}
          />

          <div style={{ marginTop: 14 }}>
            <WhatsAppButton
              context="event-question"
              eventTitle={event.title}
              label="Tem uma dúvida ou precisa de ajuda?"
              variant="help"
            />
          </div>

          <Link href={`/eventos/${event.slug}`} className="reservar-back">
            ← Voltar pro evento
          </Link>
        </main>
      </div>
    );
  }

  // ----- Já pagou: confirmação -----
  return (
    <div className="moodpass-shell">
      <main className="reservar-page">
        <div className="reservar-icon" aria-hidden>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Purchase: a compra só conta aqui, com a reserva já paga. A chave
            `once` + o eventID (id da reserva) garantem uma conversão por
            compra, mesmo se a pessoa recarregar ou voltar nessa tela. */}
        <MetaTrack
          event="Purchase"
          eventId={booking?.id}
          once={`purchase:${booking?.id}`}
          params={{
            content_ids: [event.slug],
            content_type: "product",
            content_name: event.title,
            contents: [{ id: event.slug, quantity: 1 }],
            num_items: 1,
            value: brl(booking?.amount_cents ?? event.price_cents),
            currency: "BRL",
          }}
        />

        <h1 className="reservar-title">Pagamento confirmado</h1>
        <p className="reservar-subtitle">Sua vaga tá garantida. Te vemos lá.</p>

        {eventCard}

        <div className="reservar-price-row">
          <span className="reservar-price-label">total</span>
          <span className="reservar-price">
            {formatPrice(booking?.amount_cents ?? event.price_cents)}
          </span>
        </div>

        <div style={{ marginTop: 18 }}>
          <WhatsAppButton
            context="post-purchase"
            eventTitle={event.title}
            label="Falar com a anfitriã"
          />
        </div>

        <Link href="/" className="reservar-back">
          ← Voltar pra Experiências
        </Link>
      </main>
    </div>
  );
}
