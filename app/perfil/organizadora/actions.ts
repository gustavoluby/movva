"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CandidaturaState = { error?: string };

/**
 * "Quero publicar um evento": a usuária manda a ideia dela pra análise.
 *
 * A escrita passa pelo service-role de propósito — a tabela não tem policy de
 * insert/update, então `status` só muda por aqui e pela fila do admin. Quem
 * decide de quem é a candidatura é o getUser() abaixo, nunca o formulário.
 */
export async function enviarCandidatura(
  _prev: CandidaturaState,
  formData: FormData,
): Promise<CandidaturaState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Entre pra se candidatar." };

  const eventIdea = String(formData.get("event_idea") ?? "").trim();
  if (eventIdea.length < 20) {
    return {
      error:
        "Conta um pouco mais sobre a experiência que você quer fazer (pelo menos uma frase).",
    };
  }

  const admin = createAdminClient();
  const { data: atual } = await admin
    .from("organizer_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  // Já aprovada: não tem o que reenviar (o acesso está no perfil dela).
  if (atual?.status === "approved") redirect("/admin/experiencias");

  const row = {
    user_id: user.id,
    event_idea: eventIdea,
    about: String(formData.get("about") ?? "").trim() || null,
    instagram: String(formData.get("instagram") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    // Reenvio depois de uma recusa volta pra fila e limpa o recado antigo.
    status: "pending",
    admin_note: null,
    updated_at: new Date().toISOString(),
  };

  const { error } = atual
    ? await admin
        .from("organizer_applications")
        .update(row)
        .eq("id", atual.id)
    : await admin.from("organizer_applications").insert(row);

  if (error) return { error: `Não consegui enviar: ${error.message}` };

  revalidatePath("/perfil/organizadora");
  revalidatePath("/perfil");
  redirect("/perfil/organizadora?enviado=1");
}
