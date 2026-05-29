import { Section, Text, Heading, Link } from "@react-email/components";
import { Layout, WhatsAppButton, EventDetailCard, Hr } from "./components/ui";
import * as t from "./theme";
import type { EmailUser, EmailEvent } from "./types";
import { getNicoleWhatsAppLink } from "@/lib/whatsapp";

const WHAT_TO_BRING = [
  "Roupa confortável pra se movimentar",
  "Uma garrafa de água",
  "Disposição e boa energia 🌿",
];

export function BookingReminder24h({
  user,
  event,
}: {
  user: EmailUser;
  event: EmailEvent;
}) {
  const firstName = user.fullName.split(" ")[0];
  const mapsQuery = encodeURIComponent(
    event.locationAddress || event.locationName,
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const whatsappHref = getNicoleWhatsAppLink(
    `Olá! É sobre o evento ${event.title} de amanhã.`,
  );

  return (
    <Layout preview={`Te vejo amanhã — ${event.title}`}>
      <Heading style={t.h1}>Te vejo amanhã! 🌸</Heading>
      <Text style={t.paragraph}>
        {firstName}, é amanhã! Deixei aqui os detalhes pra você não esquecer
        nada:
      </Text>

      <EventDetailCard event={event} showAddress />

      <Section style={{ marginBottom: "16px" }}>
        <Link href={mapsUrl} style={{ color: t.colors.terracotta }}>
          📍 Ver no mapa
        </Link>
      </Section>

      <Hr style={t.hr} />

      <Text style={t.cardTitle}>O que levar</Text>
      {WHAT_TO_BRING.map((item) => (
        <Text key={item} style={t.metaRow}>
          • {item}
        </Text>
      ))}

      <Section style={{ marginTop: "20px" }}>
        <WhatsAppButton href={whatsappHref}>
          Falar com a Nicole no WhatsApp
        </WhatsAppButton>
      </Section>
    </Layout>
  );
}

export default BookingReminder24h;
