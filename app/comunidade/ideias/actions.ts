"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

const MAX_LEN = 280;

export type IdeaState = { error?: string };

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

  const { error } = await supabase.from("ideas").insert({
    user_id: user.id,
    text,
    is_anonymous: isAnonymous,
    status: "pending",
  });
  if (error) return { error: `Não consegui postar: ${error.message}` };

  revalidatePath("/comunidade/ideias");
  return {};
}

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
  const { error } = await supabase
    .from("ideas")
    .update({ is_anonymous: next })
    .eq("id", ideaId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/comunidade/ideias");
  return { ok: true as const, isAnonymous: next };
}

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
    await supabase.from("idea_likes").insert({ idea_id: ideaId, user_id: user.id });
  }

  const { count } = await supabase
    .from("idea_likes")
    .select("*", { count: "exact", head: true })
    .eq("idea_id", ideaId);
  const admin = createAdminClient();
  await admin.from("ideas").update({ likes_count: count ?? 0 }).eq("id", ideaId);

  revalidatePath("/comunidade/ideias");
  return { ok: true as const, liked: !existing };
}

export type IdeaComment = {
  id: string;
  text: string;
  createdAt: string | null;
  userId: string | null;
  fromAnonAuthor: boolean;
  author: { name: string; avatarUrl: string | null };
};

export async function getIdeaComments(ideaId: string): Promise<IdeaComment[]> {
  const supabase = await createClient();

  const [{ data: idea }, { data: rows }] = await Promise.all([
    supabase.from("ideas").select("user_id, is_anonymous").eq("id", ideaId).maybeSingle(),
    supabase
      .from("idea_comments")
      .select("id, text, created_at, user_id")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: true }),
  ]);

  const list = rows ?? [];
  const ids = [
    ...new Set(list.map((c) => c.user_id).filter((v): v is string => !!v)),
  ];
  const profs = new Map<string, { full_name: string; avatar_url: string | null }>();
  if (ids.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", ids);
    for (const p of data ?? [])
      profs.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
  }

  return list.map((c) => {
    const fromAnonAuthor = !!idea?.is_anonymous && c.user_id === idea?.user_id;
    const prof = c.user_id ? profs.get(c.user_id) : null;
    return {
      id: c.id,
      text: c.text,
      createdAt: c.created_at,
      userId: c.user_id,
      fromAnonAuthor,
      author: {
        name: fromAnonAuthor ? "Autora" : prof?.full_name ?? "Movva",
        avatarUrl: fromAnonAuthor ? null : prof?.avatar_url ?? null,
      },
    };
  });
}

export async function addIdeaComment(
  ideaId: string,
  text: string,
): Promise<{ ok: false; error: string } | { ok: true; comment: IdeaComment }> {
  const clean = text.trim();
  if (!clean) return { ok: false, error: "escreve algo" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "não logada" };

  const [{ data: idea }, { data, error }] = await Promise.all([
    supabase.from("ideas").select("user_id, is_anonymous").eq("id", ideaId).maybeSingle(),
    supabase
      .from("idea_comments")
      .insert({ idea_id: ideaId, user_id: user.id, text: clean })
      .select("id, text, created_at, user_id")
      .single(),
  ]);

  if (error || !data) return { ok: false, error: error?.message ?? "falhou" };

  const fromAnonAuthor = !!idea?.is_anonymous && data.user_id === idea?.user_id;
  let name = "Você";
  let avatarUrl: string | null = null;
  if (!fromAnonAuthor) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    name = prof?.full_name ?? "Você";
    avatarUrl = prof?.avatar_url ?? null;
  }

  revalidatePath("/comunidade/ideias");
  return {
    ok: true,
    comment: {
      id: data.id,
      text: data.text,
      createdAt: data.created_at,
      userId: data.user_id,
      fromAnonAuthor,
      author: { name, avatarUrl },
    },
  };
}

export async function deleteIdeaComment(
  commentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "não logada" };

  const admin = createAdminClient();
  const { data: comment } = await admin
    .from("idea_comments")
    .select("id, user_id")
    .eq("id", commentId)
    .maybeSingle();
  if (!comment) return { ok: false, error: "comentário não existe" };

  const allowed = comment.user_id === user.id || isAdmin(user.email);
  if (!allowed) return { ok: false, error: "sem permissão" };

  const { error } = await admin
    .from("idea_comments")
    .delete()
    .eq("id", commentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/comunidade/ideias");
  return { ok: true };
}
