import { createAdminClient } from "@/lib/supabase/admin";

export type Availability = {
  /** Vendas reais (reservas pagas) do evento, contando todas as usuárias. */
  sold: number;
  /** Total de vagas exibido (events.capacity). */
  total: number;
  /** Limite de vendas: deixamos 1 vaga de reserva (capacidade 18 → vende 17). */
  salesLimit: number;
  /** Esgotado quando as vendas pagas atingem o limite. */
  soldOut: boolean;
  /** Atingiu 50% da capacidade — só aí vale mostrar o número de ocupadas. */
  halfReached: boolean;
};

// "Venda" = reserva paga (payment_status='paid'). A contagem cruza TODAS as
// usuárias, então usa o client service-role (a RLS de bookings só deixa cada
// uma ver as próprias). going_count NÃO serve aqui: inclui base de prova
// social do seed + reservas ainda não pagas.
export async function getEventAvailability(
  eventId: string,
  capacity: number,
): Promise<Availability> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("payment_status", "paid");

  const sold = count ?? 0;
  const salesLimit = Math.max(0, capacity - 1);
  return {
    sold,
    total: capacity,
    salesLimit,
    soldOut: sold >= salesLimit,
    halfReached: sold * 2 >= capacity,
  };
}
