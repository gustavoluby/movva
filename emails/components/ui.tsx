import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
  Preview,
} from "@react-email/components";
import type { ReactNode } from "react";
import * as t from "../theme";
import type { EmailEvent } from "../types";
import { formatEventDate, eventStartTime } from "@/lib/utils/date";

export function Layout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={t.main}>
        <Container style={{ padding: "24px 12px" }}>
          <Container style={t.container}>
            <Section style={t.header}>
              <Heading style={t.logo}>Moodpass</Heading>
            </Section>
            <Section style={t.body}>{children}</Section>
            <Section style={t.footer}>
              <Text style={t.footerText}>
                Te esperamos no evento! 🌸 — Equipe Moodpass
              </Text>
            </Section>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}

export function WhatsAppButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button href={href} style={t.ctaPrimary}>
      {children}
    </Button>
  );
}

export function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button href={href} style={t.ctaSecondary}>
      {children}
    </Button>
  );
}

// Card com os detalhes do evento (data, horário, local).
export function EventDetailCard({
  event,
  showAddress = false,
}: {
  event: EmailEvent;
  showAddress?: boolean;
}) {
  return (
    <Section style={t.card}>
      <Text style={t.cardTitle}>{event.title}</Text>
      {event.subtitle && (
        <Text style={{ ...t.metaRow, color: t.colors.muted }}>
          {event.subtitle}
        </Text>
      )}
      <Text style={t.metaRow}>📅 {formatEventDate(event.eventDate)}</Text>
      {event.eventTime && (
        <Text style={t.metaRow}>🕐 {eventStartTime(event.eventTime)}</Text>
      )}
      <Text style={t.metaRow}>
        📍 {event.locationName}
        {showAddress && event.locationAddress
          ? ` — ${event.locationAddress}`
          : ""}
      </Text>
    </Section>
  );
}

export { Hr };
