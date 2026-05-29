import { Section, Text, Heading, Link } from "@react-email/components";
import { Layout, SecondaryButton, Hr } from "./components/ui";
import * as t from "./theme";
import type { EmailUser, EmailEvent } from "./types";
import { formatEventDate } from "@/lib/utils/date";

export function WelcomeEmail({
  user,
  events = [],
}: {
  user: EmailUser;
  events?: EmailEvent[];
}) {
  const firstName = user.fullName.split(" ")[0];

  return (
    <Layout preview="Bem-vinda à Movva 🌸">
      <Heading style={t.h1}>Bem-vinda à Movva, {firstName}! 🌸</Heading>
      <Text style={t.paragraph}>
        A Movva é uma comunidade de mulheres que se encontram em experiências
        de bem-estar, movimento e conexão em Curitiba — yoga, pilates, rodas e
        muito mais, com curadoria afetiva pra você florescer junto.
      </Text>

      {events.length > 0 && (
        <>
          <Hr style={t.hr} />
          <Text style={t.cardTitle}>Próximos encontros</Text>
          {events.slice(0, 3).map((ev) => (
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
        </>
      )}

      <Section style={{ marginTop: "8px" }}>
        <SecondaryButton href={`${t.APP_URL}/`}>
          Explorar eventos
        </SecondaryButton>
      </Section>
    </Layout>
  );
}

export default WelcomeEmail;
