import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/bottom-nav";

// Layout persistente das abas: a casca (moodpass-shell) e a barra inferior ficam
// montadas o tempo todo. Ao trocar de aba, só o {children} (o miolo) é
// re-renderizado — a BottomNav não remonta, então não há "flash" de recarga.
export default async function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="moodpass-shell">
      {children}
      <BottomNav loggedIn={!!user} />
    </div>
  );
}
