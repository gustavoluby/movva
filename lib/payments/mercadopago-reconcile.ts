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

  // external_reference agora é `${bookingId}:${timestamp}` (único por tentativa
  // p/ antifraude). Pega a parte antes do ":". Refs antigas sem ":" seguem
  // funcionando (split devolve a string inteira). metadata.booking_id é fallback.
  const rawRef = payment.external_reference ?? null;
  const metaBookingId =
    (payment.metadata as { booking_id?: string } | undefined)?.booking_id ??
    null;
  const bookingId = (rawRef ? rawRef.split(":")[0] : null) ?? metaBookingId;
  if (!bookingId) return null;

  const status = payment.status ?? "unknown";
  const statusDetail = payment.status_detail ?? null;
  const paid = status === "approved";

  const supabase = createAdminClient();

  // Diagnóstico: guarda na própria reserva o status e o MOTIVO da recusa do MP
  // (não toca no payment_status interno). Separa antifraude (cc_rejected_high_risk
  // → nossos dados de payer ajudam) de causa do banco/cartão (saldo/bloqueio →
  // não dá pra resolver por código). Persistido pra agregar por dias; também loga.
  await supabase
    .from("bookings")
    .update({ mp_status: status, mp_status_detail: statusDetail })
    .eq("id", bookingId);

  if (status === "rejected" || status === "cancelled") {
    console.warn("[mp] pagamento não aprovado", {
      bookingId,
      paymentId: String(payment.id ?? paymentId),
      status,
      status_detail: statusDetail,
      payment_method: payment.payment_method_id ?? null,
    });
  }

  if (paid) {
    const method = payment.payment_type_id?.includes("card") ? "card" : "pix";
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
      .select("id, coupon_code");

    // Só houve linha atualizada na transição REAL pending→paid. Isso dedup
    // o email (e o incremento do cupom) se o MP mandar o webhook 2x ou se o
    // retorno reconciliar antes.
    if (updated && updated.length > 0) {
      const couponCode = updated[0].coupon_code as string | null;
      if (couponCode) {
        await supabase.rpc("increment_coupon_use", { p_code: couponCode });
      }
      await sendBookingConfirmationEmail(bookingId);
    }
  }

  return { bookingId, status, paid };
}

// Rede de segurança: puxa do MP os pagamentos APROVADOS dos últimos dias e
// reconcilia cada um. É o espelho do webhook — em vez de esperar o MP avisar,
// a gente pergunta. Pega qualquer aprovação assíncrona (Pix ou cartão que exigiu
// autorização do banco/3DS) cujo webhook se perdeu. Idempotente: reservas já
// pagas viram no-op (o .neq('payment_status','paid') não atualiza nada, então
// não reenvia email nem reincrementa cupom). Rodado por cron.
export async function sweepRecentPayments(
  sinceDays = 3,
): Promise<{ scanned: number; paid: number }> {
  const search = await new Payment(mpClient()).search({
    options: {
      sort: "date_created",
      criteria: "desc",
      range: "date_created",
      begin_date: `NOW-${sinceDays}DAYS`,
      end_date: "NOW",
      status: "approved",
      limit: 100,
    },
  });

  const results = search.results ?? [];
  let paid = 0;
  for (const p of results) {
    if (!p.id) continue;
    try {
      const r = await reconcilePayment(String(p.id));
      if (r?.paid) paid++;
    } catch (err) {
      console.error("[sweep] reconcile falhou p/ pagamento", p.id, err);
    }
  }
  return { scanned: results.length, paid };
}
