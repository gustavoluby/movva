import { createClient } from "@/lib/supabase/server";
import { IdeaComposer } from "@/components/comunidade/idea-composer";
import { IdeaCard, type Idea } from "@/components/comunidade/idea-card";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function IdeiasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from("ideas")
    .select("id, text, is_anonymous, created_at, likes_count, comments_count, user_id")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

  const list = rows ?? [];

  // Perfis das autoras (busca separada — evita depender do embed na tipagem).
  const authorIds = [
    ...new Set(list.map((i) => i.user_id).filter((v): v is string => !!v)),
  ];
  const profMap = new Map<
    string,
    { full_name: string; avatar_url: string | null }
  >();
  if (authorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", authorIds);
    for (const p of profs ?? []) {
      profMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
    }
  }

  // Quais ideias a usuária já topou.
  let likedSet = new Set<string>();
  if (user && list.length > 0) {
    const { data: likes } = await supabase
      .from("idea_likes")
      .select("idea_id")
      .eq("user_id", user.id)
      .in(
        "idea_id",
        list.map((i) => i.id),
      );
    likedSet = new Set((likes ?? []).map((l) => l.idea_id));
  }

  const ideas: Idea[] = list.map((i) => {
    const prof = i.user_id ? profMap.get(i.user_id) : null;
    return {
      id: i.id,
      text: i.text,
      isAnonymous: i.is_anonymous ?? true,
      createdAt: i.created_at,
      likesCount: i.likes_count ?? 0,
      commentsCount: i.comments_count ?? 0,
      liked: likedSet.has(i.id),
      isMine: !!user && i.user_id === user.id,
      author: {
        name: prof?.full_name ?? "Movva",
        avatarUrl: prof?.avatar_url ?? null,
      },
    };
  });

  return (
    <div className="scroll-area with-nav">
      <section className="ideias-intro">
        <h2 className="ideias-title">
          Joga a <em>ideia</em>
        </h2>
        <p className="ideias-sub">
          Proponha um rolê e veja quem topa. Pode ser anônima — coragem primeiro,
          perfil depois ✿
        </p>
        {isAdmin(user?.email) && (
          <a href="/admin/ideias" className="comunidade-rank-link admin">
            Moderar ideias
          </a>
        )}
      </section>

      {user ? (
        <IdeaComposer />
      ) : (
        <div className="minhas-empty">
          <a href="/login?next=/comunidade/ideias" className="minhas-empty-cta">
            Entre pra dar uma ideia →
          </a>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="minhas-empty">
          <p className="minhas-empty-text">
            Ainda não tem ideias por aqui. Seja a primeira a propor um encontro ✿
          </p>
        </div>
      ) : (
        <div className="idea-list">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              loggedIn={!!user}
              currentUserId={user?.id ?? null}
              isAdmin={isAdmin(user?.email)}
            />
          ))}
        </div>
      )}

      <div className="h-12" />
    </div>
  );
}
