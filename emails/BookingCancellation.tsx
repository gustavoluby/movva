import { Section, Text, Heading, Link } from "@react-email/components";
import { Layout, EventDetailCard, Hr } from "./components/ui";
import * as t from "./theme";
import type { EmailUser, EmailEvent, EmailBooking } from "./types";
import { formatPriceFull, formatEventDate } from "@/lib/utils/date";

export function BookingCancellation({
  user,
  event,
  booking,
  suggestedEvents = [],
}: {
  user: EmailUser;
  event: EmailEvent;
  booking: EmailBooking;
  suggestedEvents?: EmailEvent[];
}) {
  const firstName = user.fullName.split(" ")[0];

  return (
    <Layout preview={`Reserva cancelada — ${event.title}`}>
      <Heading style={t.h1}>Sua reserva foi cancelada</Heading>
      <Text style={t.paragraph}>
        {firstName}, confirmamos o cancelamento da sua reserva:
      </Text>

      <EventDetailCard event={event} />

      <Section style={{ marginBottom: "20px" }}>
        <span style={t.badge}>
          💸 Reembolso de {formatPriceFull(booking.amountCents)} processado via
          Pix — deve cair em até 10 min
        </span>
      </Section>

      <Hr style={t.hr} />

      <Text style={t.paragraph}>
        Espero te ver em outro evento. 🌸 Olha essas opções:
      </Text>

      {suggestedEvents.slice(0, 2).map((ev) => (
        <Section key={ev.slug} style={t.card}>
          <Link
            href={`${t.APP_URL}/eventos/${ev.slug}`}
            style={{ textDecoration: "none" }}
          >
            <Text style={{ ...t.cardTitle, margin: "0 0 4px" }}>
              {ev.title}
            </Text>
            <Text style={{ ...t.metaRow, margin: "0", color: t.colors.muted }}>
              📅 {formatEventDate(ev.eventDate)} · 📍 {ev.locationName}
            </Text>
          </Link>
        </Section>
      ))}
    </Layout>
  );
}

export default BookingCancellation;
