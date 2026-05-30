"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

async function setStatus(postId: string, status: "approved" | "rejected") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) {
    return { ok: false as const, error: "sem permissão" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("feed_posts")
    .update({ status })
    .eq("id", postId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/posts");
  revalidatePath("/comunidade");
  return { ok: true as const };
}

export async function aprovarPost(formData: FormData) {
  await setStatus(String(formData.get("id")), "approved");
}

export async function rejeitarPost(formData: FormData) {
  await setStatus(String(formData.get("id")), "rejected");
}
