import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "./client";
import { BookingConfirmation } from "@/emails/BookingConfirmation";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { BookingReminder24h } from "@/emails/BookingReminder24h";
import type { EmailEvent } from "@/emails/types";

const EVENT_FIELDS =
  "slug, title, subtitle, event_date, event_time, location_name, location_address, image_url";

type EventRow = {
  slug: string;
  title: string;
  subtitle: string | null;
  event_date: string;
  event_time: string | null;
  location_name: string;
  location_address: string | null;
  image_url: string | null;
};

function toEmailEvent(e: EventRow): EmailEvent {
  return {
    slug: e.slug,
    title: e.title,
    subtitle: e.subtitle,
    eventDate: e.event_date,
    eventTime: e.event_time,
    locationName: e.location_name,
    locationAddress: e.location_address,
    imageUrl: e.image_url,
  };
}

// Email de confirmação de compra. Chamado quando a reserva vira 'paid'.
export async function sendBookingConfirmationEmail(bookingId: string) {
  try {
    const db = createAdminClient();
    const { data: booking } = await db
      .from("bookings")
      .select("id, amount_cents, payment_method, user_id, event_id")
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) return;

    const [{ data: event }, { data: profile }, { data: authData }] =
      await Promise.all([
        db.from("events").select(EVENT_FIELDS).eq("id", booking.event_id).maybeSingle(),
        db.from("profiles").select("full_name").eq("id", booking.user_id).maybeSingle(),
        db.auth.admin.getUserById(booking.user_id),
      ]);

    const email = authData?.user?.email;
    if (!event || !email) {
      console.warn(`[email] confirmação: faltou event/email pra booking ${bookingId}`);
      return;
    }

    await sendEmail(
      email,
      `Reserva confirmada — ${event.title}`,
      <BookingConfirmation
        user={{ fullName: profile?.full_name ?? "", email }}
        event={toEmailEvent(event as EventRow)}
        booking={{
          id: booking.id,
          amountCents: booking.amount_cents,
          paymentMethod: booking.payment_method,
        }}
      />,
    );
  } catch (err) {
    console.error(`[email] erro na confirmação (booking ${bookingId}):`, err);
  }
}

// Email de boas-vindas pós-cadastro.
export async function sendWelcomeEmail(params: {
  email: string;
  fullName: string;
}) {
  try {
    const db = createAdminClient();
    const { data: events } = await db
      .from("events")
      .select(EVENT_FIELDS)
      .eq("status", "published")
      .order("event_date", { ascending: true })
      .limit(3);

    await sendEmail(
      params.email,
      "Bem-vinda à Movva 🌸",
      <WelcomeEmail
        user={{ fullName: params.fullName, email: params.email }}
        events={(events ?? []).map((e) => toEmailEvent(e as EventRow))}
      />,
    );
  } catch (err) {
    console.error(`[email] erro no welcome (${params.email}):`, err);
  }
}

// Lembrete 24h antes do evento.
export async function sendReminderEmail(bookingId: string) {
  try {
    const db = createAdminClient();
    const { data: booking } = await db
      .from("bookings")
      .select("id, user_id, event_id")
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) return;

    const [{ data: event }, { data: profile }, { data: authData }] =
      await Promise.all([
        db.from("events").select(EVENT_FIELDS).eq("id", booking.event_id).maybeSingle(),
        db.from("profiles").select("full_name").eq("id", booking.user_id).maybeSingle(),
        db.auth.admin.getUserById(booking.user_id),
      ]);

    const email = authData?.user?.email;
    if (!event || !email) return;

    await sendEmail(
      email,
      `Te vejo amanhã — ${event.title}`,
      <BookingReminder24h
        user={{ fullName: profile?.full_name ?? "", email }}
        event={toEmailEvent(event as EventRow)}
      />,
    );
  } catch (err) {
    console.error(`[email] erro no lembrete (booking ${bookingId}):`, err);
  }
}
