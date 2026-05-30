"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CheckinState = { error?: string };

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function createCheckin(
  _prev: CheckinState,
  formData: FormData,
): Promise<CheckinState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Você precisa estar logada pra fazer check-in." };
  }

  const text = String(formData.get("text") ?? "").trim();
  const locationName = String(formData.get("location_name") ?? "").trim();
  const eventId = String(formData.get("event_id") ?? "").trim() || null;
  const photo = formData.get("photo");

  if (!locationName) {
    return { error: "Conta onde você estava (localização)." };
  }
  if (!text && !(photo instanceof File && photo.size > 0)) {
    return { error: "Escreve um textinho ou anexa uma foto do seu momento." };
  }

  // Upload da foto via service-role (não há policy de write no bucket).
  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_BYTES) {
      return { error: "A foto é grande demais (máx. 8 MB)." };
    }
    const admin = createAdminClient();
    const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${randomUUID()}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("feed-photos")
      .upload(path, photo, {
        contentType: photo.type || "image/jpeg",
        upsert: false,
      });
    if (upErr) {
      return { error: `Não consegui subir a foto: ${upErr.message}` };
    }
    photoUrl = admin.storage.from("feed-photos").getPublicUrl(path)
      .data.publicUrl;
  }

  const { error: insErr } = await supabase.from("feed_posts").insert({
    user_id: user.id,
    text: text || null,
    location_name: locationName,
    event_id: eventId,
    photo_url: photoUrl,
    status: "pending",
  });

  if (insErr) {
    return { error: `Não consegui salvar o check-in: ${insErr.message}` };
  }

  redirect("/comunidade?enviado=1");
}
