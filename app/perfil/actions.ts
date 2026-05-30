"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProfileState = { ok?: boolean; error?: string };

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// Normaliza o handle do Instagram: tira @, espaços e URL.
function normalizeInstagram(raw: string): string {
  let v = raw.trim();
  v = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  v = v.replace(/\/+$/, "");
  v = v.replace(/^@/, "");
  return v;
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logada." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const instagramRaw = String(formData.get("instagram") ?? "");
  const photo = formData.get("photo");

  if (!fullName) return { error: "Coloca seu nome." };

  const update: {
    full_name: string;
    instagram: string | null;
    avatar_url?: string;
  } = {
    full_name: fullName,
    instagram: instagramRaw.trim() ? normalizeInstagram(instagramRaw) : null,
  };

  // Foto nova (opcional) — upload via service-role pro bucket avatars.
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_BYTES) return { error: "A foto é grande demais (máx. 8 MB)." };
    const admin = createAdminClient();
    const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${randomUUID()}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("avatars")
      .upload(path, photo, {
        contentType: photo.type || "image/jpeg",
        upsert: true,
      });
    if (upErr) return { error: `Não consegui subir a foto: ${upErr.message}` };
    update.avatar_url = admin.storage.from("avatars").getPublicUrl(path)
      .data.publicUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);
  if (error) return { error: `Não consegui salvar: ${error.message}` };

  revalidatePath("/perfil");
  revalidatePath("/comunidade");
  return { ok: true };
}
