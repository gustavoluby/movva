"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

// Curte/descurte um post. Os triggers do banco atualizam likes_count.
export async function toggleLike(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "não logada" };

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: user.id });
  }

  revalidatePath("/comunidade");
  return { ok: true, liked: !existing };
}

export type Comment = {
  id: string;
  text: string;
  createdAt: string | null;
  userId: string | null;
  author: { name: string; avatarUrl: string | null };
};

// Lista os comentários de um post (mais antigos primeiro).
export async function getComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("post_comments")
    .select(
      "id, text, created_at, user_id, profiles!post_comments_user_id_fkey(full_name, avatar_url)",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((c) => ({
    id: c.id,
    text: c.text,
    createdAt: c.created_at,
    userId: c.user_id,
    author: {
      name: c.profiles?.full_name ?? "Moodpass",
      avatarUrl: c.profiles?.avatar_url ?? null,
    },
  }));
}

// Adiciona um comentário (instantâneo, sem moderação). Retorna o comentário
// criado pra inserção otimista no feed.
export async function addComment(
  postId: string,
  text: string,
): Promise<{ ok: false; error: string } | { ok: true; comment: Comment }> {
  const clean = text.trim();
  if (!clean) return { ok: false, error: "escreve algo" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "não logada" };

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, user_id: user.id, text: clean })
    .select(
      "id, text, created_at, user_id, profiles!post_comments_user_id_fkey(full_name, avatar_url)",
    )
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "falhou" };
  }

  revalidatePath("/comunidade");
  return {
    ok: true,
    comment: {
      id: data.id,
      text: data.text,
      createdAt: data.created_at,
      userId: data.user_id,
      author: {
        name: data.profiles?.full_name ?? "Você",
        avatarUrl: data.profiles?.avatar_url ?? null,
      },
    },
  };
}

// Apaga um comentário. A autora apaga o dela; admin apaga qualquer um
// (moderação). Usa service-role, com a checagem de permissão no código.
export async function deleteComment(
  commentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "não logada" };

  const admin = createAdminClient();
  const { data: comment } = await admin
    .from("post_comments")
    .select("id, user_id")
    .eq("id", commentId)
    .maybeSingle();
  if (!comment) return { ok: false, error: "comentário não existe" };

  const allowed = comment.user_id === user.id || isAdmin(user.email);
  if (!allowed) return { ok: false, error: "sem permissão" };

  const { error } = await admin
    .from("post_comments")
    .delete()
    .eq("id", commentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/comunidade");
  return { ok: true };
}
