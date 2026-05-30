import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PostCard, type FeedPost } from "@/components/comunidade/post-card";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function ComunidadePage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>;
}) {
  const { enviado } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: posts } = await supabase
    .from("feed_posts")
    .select(
      `id, text, photo_url, location_name, created_at, likes_count, comments_count, user_id,
       profiles!feed_posts_user_id_fkey(full_name, handle, avatar_url),
       events(title, going_count)`,
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

  const list = posts ?? [];

  // Marca quais posts a usuária logada já curtiu (1 query).
  let likedSet = new Set<string>();
  if (user && list.length > 0) {
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in(
        "post_id",
        list.map((p) => p.id),
      );
    likedSet = new Set((likes ?? []).map((l) => l.post_id));
  }

  const feed: FeedPost[] = list.map((p) => ({
    id: p.id,
    text: p.text,
    photoUrl: p.photo_url,
    locationName: p.location_name,
    createdAt: p.created_at,
    likesCount: p.likes_count ?? 0,
    commentsCount: p.comments_count ?? 0,
    liked: likedSet.has(p.id),
    author: {
      name: p.profiles?.full_name ?? "Movva",
      handle: p.profiles?.handle ?? null,
      avatarUrl: p.profiles?.avatar_url ?? null,
    },
    event: p.events
      ? { title: p.events.title, goingCount: p.events.going_count ?? 0 }
      : null,
  }));

  return (
    <div className="movva-shell">
      <div className="scroll-area with-nav">
        <header className="home-header">
          <div>
            <div className="greeting-label">o que rolou</div>
            <div className="greeting-name">Comunidade</div>
          </div>
          <div className="comunidade-head-links">
            {isAdmin(user?.email) && (
              <Link href="/admin/posts" className="comunidade-rank-link admin">
                Moderar
              </Link>
            )}
            <Link href="/comunidade/ranking" className="comunidade-rank-link">
              Ranking ✦
            </Link>
          </div>
        </header>

        {enviado && (
          <div className="checkin-sent">
            Seu check-in foi enviado pra aprovação ✦ Em breve ele aparece aqui.
          </div>
        )}

        {feed.length === 0 ? (
          <div className="minhas-empty">
            <p className="minhas-empty-text">
              Ainda não tem check-ins por aqui. Seja a primeira a compartilhar
              uma experiência ✿
            </p>
            {user ? (
              <Link href="/comunidade/novo" className="minhas-empty-cta">
                Fazer meu check-in →
              </Link>
            ) : (
              <Link
                href="/login?next=/comunidade/novo"
                className="minhas-empty-cta"
              >
                Entrar pra postar →
              </Link>
            )}
          </div>
        ) : (
          <div className="feed-list">
            {feed.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <div className="h-12" />
      </div>

      <Link
        href={user ? "/comunidade/novo" : "/login?next=/comunidade/novo"}
        className="checkin-fab"
        aria-label="Fazer check-in"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Check-in</span>
      </Link>

      <BottomNav loggedIn={!!user} />
    </div>
  );
}
