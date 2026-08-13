"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/roles";

/**
 * Liga/desliga o acesso de organizadora de uma conta.
 *
 * Passa pelo service-role de propósito: a policy de update de profiles é
 * "atualize só o seu", e um trigger no banco ignora troca de `role` que não
 * venha daqui — ninguém se promove sozinho.
 */
export async function alternarOrganizadora(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return;

  const id = String(formData.get("id") ?? "").trim();
  const tornar = String(formData.get("tornar") ?? "") === "1";
  if (!id) return;

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ role: tornar ? "organizer" : "member" })
    .eq("id", id);

  revalidatePath("/admin/contas");
}
