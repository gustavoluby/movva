import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { reconcilePayment } from "@/lib/payments/mercadopago-reconcile";

// Valida a assinatura HMAC do webhook (header x-signature) contra o secret do
// painel do MP. Só roda se MERCADOPAGO_WEBHOOK_SECRET estiver setado — sem o
// secret, devolve `true` (mantém o comportamento antigo, sem quebrar nada).
// Manifesto oficial do MP: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
function assinaturaValida(req: Request, dataId: string | null): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true; // ainda não configurado → não bloqueia

  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";

  // x-signature vem como "ts=1699999999,v1=abc123..."
  const parts: Record<string, string> = {};
  for (const p of xSignature.split(",")) {
    const [k, v] = p.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !dataId) return false;

  // IDs alfanuméricos devem entrar em minúsculo (recomendação do MP).
  const id = /[a-zA-Z]/.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    const a = Buffer.from(hmac);
    const b = Buffer.from(v1);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

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
// Segurança: valida o header x-signature (HMAC) quando MERCADOPAGO_WEBHOOK_SECRET
// está setado (ver assinaturaValida abaixo). Mesmo sem isso já era seguro por
// design — consultamos o pagamento direto no MP, então webhook forjado não marca
// reserva como paga — mas a assinatura corta abuso do endpoint (defesa em
// profundidade). Pra ativar: copie a "Chave secreta" do painel do MP (Webhooks)
// e adicione como MERCADOPAGO_WEBHOOK_SECRET no ambiente da Vercel.
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

  // Assinatura: rejeita webhook forjado quando o secret está configurado. Usa o
  // data.id da querystring (é o que o MP assina). Defesa em profundidade — a
  // reconciliação já reconsulta o MP, mas isso corta abuso do endpoint.
  const signedDataId = url.searchParams.get("data.id") ?? paymentId ?? null;
  if (!assinaturaValida(req, signedDataId ? String(signedDataId) : null)) {
    console.warn("[webhook mercadopago] assinatura inválida — ignorado");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

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
