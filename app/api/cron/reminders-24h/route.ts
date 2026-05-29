import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email/notifications";

// Lembrete 24h antes do evento. Busca reservas pagas cujo evento é amanhã e
// que ainda não receberam lembrete, dispara o email e marca reminder_sent_at
// (idempotente — não duplica). NÃO há cron agendado ainda; quando for ligar,
// configurar Vercel Cron apontando pra GET /api/cron/reminders-24h com o
// header Authorization: Bearer $CRON_SECRET.
export async function GET(req: Request) {
  // Proteção: se CRON_SECRET estiver setado, exige o Bearer. Sem ele (dev/mock),
  // libera pra dar pra testar agora.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // "amanhã" em UTC (suficiente pra um cron diário; refinar tz se precisar).
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const db = createAdminClient();
  const { data: bookings, error } = await db
    .from("bookings")
    .select("id, events!inner(event_date)")
    .eq("payment_status", "paid")
    .neq("status", "cancelled")
    .is("reminder_sent_at", null)
    .eq("events.event_date", tomorrow);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const b of bookings ?? []) {
    await sendReminderEmail(b.id);
    await db
      .from("bookings")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", b.id);
    sent++;
  }

  return NextResponse.json({ ok: true, date: tomorrow, sent });
}
