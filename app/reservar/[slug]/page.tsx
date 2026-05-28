import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate, formatPrice } from "@/lib/utils/date";
import { ConfirmReserva } from "./confirm-button";

type Params = { slug: string };

export default async function ReservarPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
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

  // Só lê — não grava. A reserva nasce de um clique no botão (server action).
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
          <div className="reservar-pix-placeholder">
            <div className="reservar-pix-label">aguardando pagamento</div>
            <p className="reservar-pix-text">
              O Pix aparece aqui em breve. A integração de pagamento tá em
              construção — por enquanto, sua vaga fica registrada no sistema e a
              gente confirma manualmente.
            </p>
          </div>
        )}

        <Link href="/" className="reservar-back">
          ← Voltar pra Descobrir
        </Link>
      </main>
    </div>
  );
}
