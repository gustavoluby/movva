import { NextResponse } from "next/server";
import { reconcilePayment } from "@/lib/payments/mercadopago-reconcile";

// Webhook do Mercado Pago. O MP avisa aqui quando um pagamento muda de status.
// A gente extrai o id do pagamento, consulta o MP e sincroniza a reserva.
// Sempre responde 200 (mesmo em erro) pra evitar que o MP reenvie em loop —
// a reconferência no retorno do checkout serve de rede de segurança.
//
// TODO(prod): validar o header x-signature com MERCADOPAGO_WEBHOOK_SECRET.
// Hoje é seguro por design: como consultamos o pagamento direto no MP, um
// webhook forjado não consegue marcar uma reserva como paga.
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => null);

    const type =
      body?.type ??
      body?.topic ??
      url.searchParams.get("type") ??
      url.searchParams.get("topic");

    const paymentId =
      body?.data?.id ??
      url.searchParams.get("data.id") ??
      url.searchParams.get("id");

    if (paymentId && (type === "payment" || type === "payment.updated")) {
      await reconcilePayment(String(paymentId));
    }
  } catch (err) {
    console.error("[webhook mercadopago] erro:", err);
  }

  return NextResponse.json({ received: true });
}
