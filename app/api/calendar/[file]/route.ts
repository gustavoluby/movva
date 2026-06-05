import { createAdminClient } from "@/lib/supabase/admin";

// Gera um .ics pra adicionar o evento ao calendário.
// Link no email: /api/calendar/{bookingId}.ics → param `file` = "<id>.ics".
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const bookingId = file.replace(/\.ics$/i, "");

  const db = createAdminClient();
  const { data: booking } = await db
    .from("bookings")
    .select("id, event_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return new Response("Reserva não encontrada", { status: 404 });

  const { data: event } = await db
    .from("events")
    .select("title, subtitle, event_date, event_time, location_name, location_address")
    .eq("id", booking.event_id)
    .maybeSingle();
  if (!event) return new Response("Evento não encontrado", { status: 404 });

  const ics = buildIcs({
    uid: `${booking.id}@moodpass`,
    title: event.title,
    description: event.subtitle ?? "",
    location: event.location_address || event.location_name,
    date: event.event_date,
    time: event.event_time,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${bookingId}.ics"`,
    },
  });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Tenta extrair a hora de início de textos tipo "19h", "19h30 às 22h".
function parseStartHour(time: string | null): { h: number; m: number } | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2})h(\d{2})?/);
  if (!m) return null;
  return { h: Number(m[1]), m: m[2] ? Number(m[2]) : 0 };
}

function buildIcs(e: {
  uid: string;
  title: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string | null;
}) {
  const [y, mo, d] = e.date.split("-").map(Number);
  const start = parseStartHour(e.time);

  let dtStart: string;
  let dtEnd: string;
  if (start) {
    // horário local (floating, sem tz) — start e +2h
    const sh = pad(start.h);
    const sm = pad(start.m);
    const eh = pad((start.h + 2) % 24);
    dtStart = `DTSTART:${y}${pad(mo)}${pad(d)}T${sh}${sm}00`;
    dtEnd = `DTEND:${y}${pad(mo)}${pad(d)}T${eh}${sm}00`;
  } else {
    // dia inteiro
    dtStart = `DTSTART;VALUE=DATE:${y}${pad(mo)}${pad(d)}`;
    const nd = new Date(Date.UTC(y, mo - 1, d + 1));
    dtEnd = `DTEND;VALUE=DATE:${nd.getUTCFullYear()}${pad(nd.getUTCMonth() + 1)}${pad(nd.getUTCDate())}`;
  }

  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Moodpass//Eventos//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    dtStart,
    dtEnd,
    `SUMMARY:${esc(e.title)}`,
    e.description ? `DESCRIPTION:${esc(e.description)}` : "",
    `LOCATION:${esc(e.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
