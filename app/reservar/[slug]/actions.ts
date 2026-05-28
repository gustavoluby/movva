"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReservaState = { error?: string } | null;

// Cria a reserva (status 'confirmed', pagamento pendente) de forma
// idempotente. Disparada por um clique explícito — não no render da
// página — pra evitar que prefetch/re-render gravem reserva sem ação.
export async function confirmarReserva(
  _prev: ReservaState,
  formData: FormData,
): Promise<ReservaState> {
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return { error: "Evento inválido." };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa entrar pra reservar." };

  const { data: event } = await supabase
    .from("events")
    .select("id, price_cents, capacity, going_count")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!event) return { error: "Evento não encontrado." };

  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_id", event.id)
    .maybeSingle();

  if (!existing) {
    if ((event.going_count ?? 0) >= event.capacity) {
      return { error: "Esse evento esgotou as vagas." };
    }

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      event_id: event.id,
      amount_cents: event.price_cents,
      payment_status: "pending",
      status: "confirmed",
    });

    // unique(user_id, event_id): em corrida, o duplicate é benigno.
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return { error: `Não rolou criar a reserva: ${error.message}` };
    }
  }

  // Re-renderiza a página de reserva (mostra a confirmação), atualiza
  // "Minhas" e o going_count na vitrine/detalhe.
  revalidatePath(`/reservar/${slug}`);
  revalidatePath("/minhas");
  revalidatePath(`/eventos/${slug}`);
  revalidatePath("/");
  return null;
}
