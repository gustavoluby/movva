"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

async function setStatus(ideaId: string, status: "approved" | "rejected") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) {
    return { ok: false as const, error: "sem permissão" };
  }

  const admin = createAdminClient();
  // Cliente admin tipa `ideas` como never (tipos gerados); cast pontual.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from("ideas") as any)
    .update({ status })
    .eq("id", ideaId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/ideias");
  revalidatePath("/comunidade/ideias");
  return { ok: true as const };
}

export async function aprovarIdeia(formData: FormData) {
  await setStatus(String(formData.get("id")), "approved");
}

export async function rejeitarIdeia(formData: FormData) {
  await setStatus(String(formData.get("id")), "rejected");
}
