import { MercadoPagoConfig } from "mercadopago";

// Client server-side do Mercado Pago. Usa o Access Token (de teste agora,
// produção depois). Nunca exponha esse token no client.
export function mpClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN não configurado — adicione no .env.local",
    );
  }
  return new MercadoPagoConfig({ accessToken });
}
