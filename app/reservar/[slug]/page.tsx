import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate, formatPrice } from "@/lib/utils/date";
import { reconcilePayment } from "@/lib/payments/mercadopago-reconcile";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ConfirmReserva } from "./confirm-button";
import { PagarButton } from "./pagar-button";

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
      "id, slug, title, subtitle, event_date, event_time, location_name, price_cents, capacity, going_count, image_url",
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

  // ----- Ainda não reservou: tela de confirmação -----
  if (!booking) {
    const isFull = (event.going_count ?? 0) >= event.capacity;

    return (
      <div className="movva-shell">
        <main className="reservar-page">
          <div className="reservar-icon" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
            </svg>
          </div>

          <h1 className="reservar-title">Confirmar reserva</h1>
          <p className="reservar-subtitle">
            {isFull
              ? "As vagas desse evento esgotaram."
              : "Confirme pra segurar sua vaga. O pagamento você finaliza depois."}
          </p>

          {eventCard}

          <div className="reservar-price-row">
            <span className="reservar-price-label">total</span>
            <span className="reservar-price">{formatPrice(event.price_cents)}</span>
          </div>

          <ConfirmReserva slug={event.slug} isFull={isFull} />

          <Link href={`/eventos/${event.slug}`} className="reservar-back">
            ← Voltar pro evento
          </Link>
        </main>
      </div>
    );
  }

  // ----- Já reservou: confirmação / status -----
  const isPaid = booking.payment_status === "paid";

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

  return (
    <div className="movva-shell">
      <main className="reservar-page">
        <div className="reservar-icon" aria-hidden>
          {isPaid ? (
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
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
            </svg>
          )}
        </div>

        <h1 className="reservar-title">
          {isPaid ? "Pagamento confirmado" : "Reserva criada"}
        </h1>
        <p className="reservar-subtitle">
          {isPaid
            ? "Sua vaga tá garantida. Te vemos lá."
            : "Sua vaga tá segurada enquanto você finaliza o pagamento."}
        </p>

        {eventCard}

        <div className="reservar-price-row">
          <span className="reservar-price-label">total</span>
          <span className="reservar-price">
            {formatPrice(booking.amount_cents ?? event.price_cents)}
          </span>
        </div>

        {!isPaid && (
          <>
            {returnState === "pending" && (
              <div className="reservar-pix-placeholder">
                <div className="reservar-pix-label">pagamento em processamento</div>
                <p className="reservar-pix-text">
                  Estamos confirmando seu pagamento. Se foi Pix, pode levar uns
                  segundos — atualize a página em instantes. Sua vaga já está
                  segurada.
                </p>
              </div>
            )}
            {returnState === "failure" && (
              <div className="reservar-pix-placeholder">
                <div className="reservar-pix-label">pagamento não aprovado</div>
                <p className="reservar-pix-text">
                  O pagamento não foi concluído. Sua vaga continua reservada —
                  é só tentar de novo abaixo.
                </p>
              </div>
            )}
            {!returnState && (
              <div className="reservar-pix-placeholder">
                <div className="reservar-pix-label">aguardando pagamento</div>
                <p className="reservar-pix-text">
                  Sua vaga está segurada. Finalize com Pix ou cartão pra
                  garantir de vez.
                </p>
              </div>
            )}

            <PagarButton slug={event.slug} />
          </>
        )}

        <div style={{ marginTop: 18 }}>
          <WhatsAppButton
            context="post-purchase"
            eventTitle={event.title}
            label="Falar com a anfitriã"
          />
        </div>

        <Link href="/" className="reservar-back">
          ← Voltar pra Descobrir
        </Link>
      </main>
    </div>
  );
}
