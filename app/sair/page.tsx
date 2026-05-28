import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Rota utilitária pra testar logout sem mexer em cookies. Numa V2 isso
// vira um botão com Server Action (CSRF-safe via POST).
export default async function SairPage() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
