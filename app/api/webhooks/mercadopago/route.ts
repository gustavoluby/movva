import { NextResponse } from "next/server";
import { reconcilePayment } from "@/lib/payments/mercadopago-reconcile";

// Webhook do Mercado Pago. O MP avisa aqui quando um pagamento muda de status.
// A gente extrai o id do pagamento, consulta o MP e sincroniza a reserva.
//
// IMPORTANTE (confiabilidade): se a reconciliação falhar de forma transitória
// (API do MP fora, hiccup do Supabase), respondemos 500 DE PROPÓSITO pra que o
// MP REENVIE a notificação. reconcilePayment é idempotente, então reenvio é
// seguro (não duplica email/cupom). Antes respondíamos 200 sempre — o que fazia
// pagamentos assíncronos (Pix e cartão com autorização do banco) se perderem
// quando o webhook dava um erro passageiro.
//
// TODO(prod): validar o header x-signature com MERCADOPAGO_WEBHOOK_SECRET.
// Hoje é seguro por design: como consultamos o pagamento direto no MP, um
// webhook forjado não consegue marcar uma reserva como paga.
export async function POST(req: Request) {
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

  // Notificação que não é de pagamento (ex.: merchant_order) ou sem id: nada a
  // fazer, confirma recebimento pra não gerar reenvio à toa.
  if (!paymentId || !(type === "payment" || type === "payment.updated")) {
    return NextResponse.json({ received: true });
  }

  try {
    await reconcilePayment(String(paymentId));
  } catch (err) {
    console.error("[webhook mercadopago] erro, pedindo retry ao MP:", err);
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
