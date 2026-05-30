import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/bottom-nav";

export const dynamic = "force-dynamic";

const CIDADE = "Curitiba";

type RankRow = {
  userId: string;
  name: string;
  neighborhood: string | null;
  avatarUrl: string | null;
  count: number;
};

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function RankingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cada check-in aprovado conta como 1 atividade. Agrega por autora.
  const { data: posts } = await supabase
    .from("feed_posts")
    .select(
      "user_id, profiles!feed_posts_user_id_fkey(full_name, avatar_url, city, neighborhood)",
    )
    .eq("status", "approved");

  const byUser = new Map<string, RankRow>();
  for (const p of posts ?? []) {
    if (p.profiles?.city !== CIDADE) continue;
    const cur = byUser.get(p.user_id);
    if (cur) {
      cur.count += 1;
    } else {
      byUser.set(p.user_id, {
        userId: p.user_id,
        name: p.profiles?.full_name ?? "Movva",
        neighborhood: p.profiles?.neighborhood ?? null,
        avatarUrl: p.profiles?.avatar_url ?? null,
        count: 1,
      });
    }
  }

  const ranking = [...byUser.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  return (
    <div className="movva-shell">
      <div className="scroll-area with-nav">
        <header className="home-header">
          <div>
            <div className="greeting-label">quem mais participou em {CIDADE}</div>
            <div className="greeting-name">Ranking</div>
          </div>
          <Link href="/comunidade" className="comunidade-rank-link">
            ← Feed
          </Link>
        </header>

        {ranking.length === 0 ? (
          <div className="minhas-empty">
            <p className="minhas-empty-text">
              O ranking de {CIDADE} começa com os primeiros check-ins. Bora abrir
              a temporada? ✿
            </p>
          </div>
        ) : (
          <ol className="ranking-list">
            {ranking.map((row, i) => (
              <li
                key={row.userId}
                className={`ranking-row${i < 3 ? " top" : ""}`}
              >
                <span className="ranking-pos">{i + 1}</span>
                <span className="ranking-avatar">
                  {row.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.avatarUrl} alt={row.name} />
                  ) : (
                    <span>{initials(row.name)}</span>
                  )}
                </span>
                <span className="ranking-id">
                  <span className="ranking-name">{row.name}</span>
                  {row.neighborhood && (
                    <span className="ranking-hood">{row.neighborhood}</span>
                  )}
                </span>
                <span className="ranking-count">
                  {row.count}
                  <span className="ranking-count-label">
                    {row.count === 1 ? "atividade" : "atividades"}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="h-12" />
      </div>
      <BottomNav loggedIn={!!user} />
    </div>
  );
}
