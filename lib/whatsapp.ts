// Helpers de link do WhatsApp (wa.me) com mensagem pré-preenchida.
// Funciona server-side (páginas/emails). O número vem de env var, com
// fallback pro número da Nicole (conhecido, não é segredo).

const NICOLE_FALLBACK = "5541991146161"; // +55 41 99114-6161

function onlyDigits(n: string): string {
  return (n ?? "").replace(/\D/g, "");
}

export function getWhatsAppLink({
  number,
  message,
}: {
  number: string;
  message: string;
}): string {
  return `https://wa.me/${onlyDigits(number)}?text=${encodeURIComponent(message)}`;
}

export type WhatsAppContext = "event-question" | "post-purchase" | "general";

// Link pro WhatsApp "oficial" do Moodpass (cai pra Nicole se não configurado).
export function getMoodpassWhatsAppLink({
  context,
  eventTitle,
}: {
  context: WhatsAppContext;
  eventTitle?: string;
}): string {
  const number =
    process.env.WHATSAPP_NUMBER_MOODPASS ||
    process.env.WHATSAPP_NUMBER_MOVVA ||
    process.env.WHATSAPP_NUMBER_NICOLE ||
    NICOLE_FALLBACK;

  const t = eventTitle ?? "";
  const messages: Record<WhatsAppContext, string> = {
    "event-question": `Olá! Tenho interesse no evento ${t} e quero saber mais.`,
    "post-purchase": `Olá! Acabei de comprar o evento ${t} e tenho dúvidas.`,
    general: "Olá! Quero saber mais sobre o Moodpass.",
  };

  return getWhatsAppLink({ number, message: messages[context] });
}

/**
 * Link do WhatsApp (wa.me) pro telefone de um cliente, com mensagem pronta.
 * Normaliza o número (só dígitos, DDI 55 se nacional). Sem número → undefined.
 */
export function getClientWhatsAppLink(
  phone: string | null | undefined,
  message = "Oi! Aqui é da Moodpass 💜",
): string | undefined {
  if (!phone) return undefined;
  let digits = onlyDigits(phone);
  if (!digits) return undefined;
  if (!digits.startsWith("55") && digits.length <= 11) {
    digits = `55${digits}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// Link direto pra Nicole (usado nos emails que pedem o botão dela).
export function getNicoleWhatsAppLink(message: string): string {
  const number = process.env.WHATSAPP_NUMBER_NICOLE || NICOLE_FALLBACK;
  return getWhatsAppLink({ number, message });
}
