"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_LEN = 280;

export type IdeaState = { error?: string };

// Cria uma ideia (vai pra moderação). is_anonymous decide a exibição pública.
export async function createIdea(
  _prev: IdeaState,
  formData: FormData,
): Promise<IdeaState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logada pra dar uma ideia." };

  const text = String(formData.get("text") ?? "").trim();
  const isAnonymous = formData.get("anonymous") === "on";

  if (!text) return { error: "Escreve sua ideia ✿" };
  if (text.length > MAX_LEN) return { error: `Máx. ${MAX_LEN} caracteres.` };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("ideas") as any).insert({
    user_id: user.id,
    text,
    is_anonymous: isAnonymous,
    status: "pending",
  });
  if (error) return { error: `Não consegui postar: ${error.message}` };

  revalidatePath("/comunidade/ideias");
  return {};
}

// Liga/desliga o anonimato da própria ideia (revelar/ocultar o perfil).
// O UPDATE em ideas vai por service-role (ainda não há policy de update).
export async function toggleIdeaAnonymous(ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "não logada" };

  const { data: idea } = await supabase
    .from("ideas")
    .select("id, user_id, is_anonymous")
    .eq("id", ideaId)
    .maybeSingle();
  if (!idea || idea.user_id !== user.id) {
    return { ok: false as const, error: "sem permissão" };
  }

  const next = !idea.is_anonymous;
  const admin = createAdminClient();
  // O cliente admin tipa `ideas` como never (tipos gerados); cast pontual.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from("ideas") as any)
    .update({ is_anonymous: next })
    .eq("id", ideaId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/comunidade/ideias");
  return { ok: true as const, isAnonymous: next };
}

// "Eu topo" / interesse. As linhas de idea_likes vão pela SSR (têm policy);
// likes_count é recontado e gravado por service-role (não há trigger).
export async function toggleIdeaLike(ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "não logada" };

  const { data: existing } = await supabase
    .from("idea_likes")
    .select("idea_id")
    .eq("idea_id", ideaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("idea_likes")
      .delete()
      .eq("idea_id", ideaId)
      .eq("user_id", user.id);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("idea_likes") as any).insert({
      idea_id: ideaId,
      user_id: user.id,
    });
  }

  const { count } = await supabase
    .from("idea_likes")
    .select("*", { count: "exact", head: true })
    .eq("idea_id", ideaId);

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("ideas") as any)
    .update({ likes_count: count ?? 0 })
    .eq("id", ideaId);

  revalidatePath("/comunidade/ideias");
  return { ok: true as const, liked: !existing };
}
