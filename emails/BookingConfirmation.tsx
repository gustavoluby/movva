import { Section, Text, Heading, Link, Row, Column } from "@react-email/components";
import {
  Layout,
  WhatsAppButton,
  SecondaryButton,
  EventDetailCard,
  WhatToBring,
  Hr,
} from "./components/ui";
import * as t from "./theme";
import type { EmailUser, EmailEvent, EmailBooking } from "./types";
import { formatPriceFull } from "@/lib/utils/date";
import { getNicoleWhatsAppLink } from "@/lib/whatsapp";

export function BookingConfirmation({
  user,
  event,
  booking,
}: {
  user: EmailUser;
  event: EmailEvent;
  booking: EmailBooking;
}) {
  const firstName = user.fullName.split(" ")[0];
  const paidLabel =
    booking.paymentMethod === "card" ? "pago no cartão" : "pago via Pix";
  const whatsappHref = getNicoleWhatsAppLink(
    `Olá! Acabei de comprar o evento ${event.title} e tenho dúvidas.`,
  );

  return (
    <Layout preview={`Reserva confirmada — ${event.title}`}>
      <Heading style={t.h1}>Reserva confirmada! 🌸</Heading>
      <Text style={t.paragraph}>
        {firstName}, sua vaga tá garantida. Aqui estão os detalhes:
      </Text>

      <EventDetailCard event={event} />

      <Section style={{ marginBottom: "20px" }}>
        <span style={t.badge}>
          ✓ {formatPriceFull(booking.amountCents)} {paidLabel}
        </span>
      </Section>

      <Section style={{ marginBottom: "24px" }}>
        <WhatsAppButton href={whatsappHref}>
          Falar com a Nicole no WhatsApp
        </WhatsAppButton>
      </Section>

      <WhatToBring event={event} />

      <Hr style={t.hr} />

      <Text style={t.cardTitle}>Política de cancelamento</Text>
      <Text style={t.paragraph}>
        Cancelou com antecedência? O reembolso é via Pix. Veja as regras
        completas na{" "}
        <Link
          href={`${t.APP_URL}/politica-de-cancelamento`}
          style={{ color: t.colors.terracotta }}
        >
          política de cancelamento
        </Link>
        .
      </Text>

      <Hr style={t.hr} />

      <Row>
        <Column style={{ paddingRight: "6px" }}>
          <SecondaryButton href={`${t.APP_URL}/api/calendar/${booking.id}.ics`}>
            📅 Adicionar ao calendário
          </SecondaryButton>
        </Column>
        <Column style={{ paddingLeft: "6px" }}>
          <SecondaryButton href={`${t.APP_URL}/minhas`}>
            Ver no app
          </SecondaryButton>
        </Column>
      </Row>

      <Text style={{ ...t.footerText, marginTop: "20px" }}>
        <Link href={`${t.APP_URL}/minhas`} style={t.smallLink}>
          Cancelar reserva
        </Link>
      </Text>
    </Layout>
  );
}

export default BookingConfirmation;
