"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/roles";

/**
 * Fila de candidaturas a organizadora. Aprovar é o que liga o acesso: muda
 * profiles.role pra 'organizer'. Recusar guarda o recado que ela lê no perfil
 * — e ela pode ajustar e reenviar.
 */
export async function aprovarCandidatura(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const admin = createAdminClient();
  const { data: cand } = await admin
    .from("organizer_applications")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();
  if (!cand) return;

  const now = new Date().toISOString();
  await admin
    .from("organizer_applications")
    .update({
      status: "approved",
      admin_note: null,
      reviewed_at: now,
      reviewed_by: viewer.userId,
      updated_at: now,
    })
    .eq("id", id);

  await admin
    .from("profiles")
    .update({ role: "organizer" })
    .eq("id", cand.user_id);

  revalidatePath("/admin/aprovar");
  revalidatePath("/admin/contas");
}

export async function recusarCandidatura(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const now = new Date().toISOString();
  await createAdminClient()
    .from("organizer_applications")
    .update({
      status: "rejected",
      admin_note: String(formData.get("admin_note") ?? "").trim() || null,
      reviewed_at: now,
      reviewed_by: viewer.userId,
      updated_at: now,
    })
    .eq("id", id);

  revalidatePath("/admin/aprovar");
}
