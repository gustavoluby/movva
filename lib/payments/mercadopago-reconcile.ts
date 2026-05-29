import { Payment } from "mercadopago";
import { mpClient } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmationEmail } from "@/lib/email/notifications";

export type ReconcileResult = {
  bookingId: string;
  status: string; // status do pagamento no MP: approved | pending | rejected...
  paid: boolean;
};

// Busca o pagamento no Mercado Pago (fonte da verdade) e sincroniza a reserva.
// Idempotente: só marca 'paid' uma vez. Usado tanto pelo webhook quanto pela
// reconferência quando a pessoa volta do checkout (cobre teste em localhost,
// onde o webhook não chega). Como consulta o MP direto, um webhook forjado não
// consegue marcar nada como pago — só refletimos o que o MP confirma.
export async function reconcilePayment(
  paymentId: string,
): Promise<ReconcileResult | null> {
  const payment = await new Payment(mpClient()).get({ id: paymentId });

  const bookingId = payment.external_reference;
  if (!bookingId) return null;

  const status = payment.status ?? "unknown";
  const paid = status === "approved";

  if (paid) {
    const method = payment.payment_type_id?.includes("card") ? "card" : "pix";
    const supabase = createAdminClient();
    const { data: updated } = await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
        payment_method: method,
        payment_id: String(payment.id),
        paid_at: payment.date_approved ?? new Date().toISOString(),
      })
      .eq("id", bookingId)
      .neq("payment_status", "paid")
      .select("id");

    // Só houve linha atualizada na transição REAL pending→paid. Isso dedup
    // o email se o MP mandar o webhook 2x ou se o retorno reconciliar antes.
    if (updated && updated.length > 0) {
      await sendBookingConfirmationEmail(bookingId);
    }
  }

  return { bookingId, status, paid };
}
