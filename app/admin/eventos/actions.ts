"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

// Remove uma venda e libera a vaga. NÃO apaga a linha: marca a reserva como
// estornada/cancelada, preservando o registro financeiro (quem comprou, quanto,
// payment_id). A trigger trg_bookings_update_event_count vê payment_status sair
// de 'paid' e decrementa o going_count; getEventAvailability só conta 'paid', então
// a vaga volta ao estoque na hora. Recompra segue possível (reservarEPagar reusa a
// linha existente quando não está 'paid').
// ATENÇÃO: NÃO estorna o pagamento no Mercado Pago — o estorno é manual.
export async function removerVenda(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("bookings")
    .update({
      payment_status: "refunded",
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("payment_status", "paid");
  if (error) throw new Error(error.message);

  revalidatePath("/admin/eventos");
}
