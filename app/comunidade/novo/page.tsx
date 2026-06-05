import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckinForm } from "@/components/comunidade/checkin-form";

export const dynamic = "force-dynamic";

export default async function NovoCheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string }>;
}) {
  const { evento } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/comunidade/novo");
  }

  // Eventos que ela reservou — pra amarrar o check-in (opcional).
  const { data: bookings } = await supabase
    .from("bookings")
    .select("events(id, title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const seen = new Set<string>();
  const events = (bookings ?? [])
    .map((b) => b.events)
    .filter((e): e is { id: string; title: string } => !!e)
    .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));

  const defaultEventId = evento && events.some((e) => e.id === evento)
    ? evento
    : "";

  return (
    <div className="moodpass-shell">
      <div className="scroll-area">
        <CheckinForm events={events} defaultEventId={defaultEventId} />
      </div>
    </div>
  );
}
