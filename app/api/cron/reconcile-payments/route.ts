import { NextResponse } from "next/server";
import { sweepRecentPayments } from "@/lib/payments/mercadopago-reconcile";

// Cron de rede de segurança pros pagamentos assíncronos (Pix e cartão com
// autorização do banco/3DS). Se o webhook do MP não chegou ou falhou, esta
// varredura pega os pagamentos aprovados recentes e sincroniza as reservas.
// Idempotente. Protegido por CRON_SECRET (mesmo padrão do reminders-24h).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await sweepRecentPayments();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron reconcile-payments] erro:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
