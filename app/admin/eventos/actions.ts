"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

// Remove uma venda (reserva paga) e libera a vaga. A trigger
// trg_bookings_update_event_count decrementa o going_count do evento no delete.
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
    .delete()
    .eq("id", bookingId)
    .eq("payment_status", "paid");
  if (error) throw new Error(error.message);

  revalidatePath("/admin/eventos");
}
