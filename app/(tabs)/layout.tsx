import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/bottom-nav";

// Layout persistente das abas: a casca (movva-shell) e a barra inferior ficam
// montadas o tempo todo. Ao trocar de aba, só o {children} (o miolo) é
// re-renderizado — a BottomNav não remonta, então não há "flash" de recarga.
export default async function TabsLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="movva-shell">
      {children}
      {modal}
      <BottomNav loggedIn={!!user} />
    </div>
  );
}
