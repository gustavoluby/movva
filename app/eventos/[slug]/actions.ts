"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { saved: boolean; error?: string };

// Salva/remove um evento da lista "Minhas" da usuária. Idempotente:
// se já está salvo, remove; senão, insere. Disparado por clique explícito.
export async function toggleSave(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const slug = String(formData.get("slug") ?? "");
  const wasSaved = String(formData.get("saved") ?? "") === "true";
  if (!slug) return { saved: wasSaved, error: "Evento inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { saved: wasSaved, error: "Entre pra salvar eventos." };

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!event) return { saved: wasSaved, error: "Evento não encontrado." };

  if (wasSaved) {
    const { error } = await supabase
      .from("saved_events")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", event.id);
    if (error) return { saved: true, error: `Não rolou remover: ${error.message}` };
    revalidatePath("/minhas");
    revalidatePath(`/eventos/${slug}`);
    return { saved: false };
  }

  const { error } = await supabase
    .from("saved_events")
    .insert({ user_id: user.id, event_id: event.id });
  // unique(user_id, event_id): em corrida, o duplicate é benigno (já salvo).
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return { saved: false, error: `Não rolou salvar: ${error.message}` };
  }
  revalidatePath("/minhas");
  revalidatePath(`/eventos/${slug}`);
  return { saved: true };
}
