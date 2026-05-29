import * as React from "react";
import { render } from "@react-email/render";
import { writeFile } from "node:fs/promises";
import { BookingConfirmation } from "../emails/BookingConfirmation";
import { WelcomeEmail } from "../emails/WelcomeEmail";
import { BookingReminder24h } from "../emails/BookingReminder24h";
import { BookingCancellation } from "../emails/BookingCancellation";

const user = { fullName: "Gustavo Luby", email: "test@movva.com.br" };
const event = {
  slug: "yoga-mia",
  title: "Yoga com Mia & Ritual de Beleza",
  subtitle: "Yoga terapia + drenagem + ensaio",
  eventDate: "2026-08-18",
  eventTime: "9h às 12h",
  locationName: "Studio ONCÈ",
  locationAddress: "Rua Itupava, 123 — Batel, Curitiba",
  imageUrl: null,
};
const event2 = { ...event, slug: "pilates-bundle", title: "Pilates, Autocuidado & Vinho" };
const booking = { id: "abc-123", amountCents: 100, paymentMethod: "pix" };

async function main() {
  const items: [string, React.ReactElement][] = [
    ["confirmation", <BookingConfirmation user={user} event={event} booking={booking} />],
    ["welcome", <WelcomeEmail user={user} events={[event, event2]} />],
    ["reminder24h", <BookingReminder24h user={user} event={event} />],
    ["cancellation", <BookingCancellation user={user} event={event} booking={booking} suggestedEvents={[event2]} />],
  ];

  for (const [name, el] of items) {
    const html = await render(el, { pretty: true });
    const path = `/tmp/email-preview-${name}.html`;
    await writeFile(path, html, "utf8");
    console.log(`✅ ${name.padEnd(14)} → ${path} (${html.length} bytes)`);
  }
}

main().catch((e) => {
  console.error("❌", e?.message ?? e);
  process.exit(1);
});
