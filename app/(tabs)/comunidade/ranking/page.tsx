import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { monthNameUpper } from "@/lib/utils/date";

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

const TIERS = ["gold", "silver", "bronze"] as const;

function Avatar({ row, className }: { row: RankRow; className: string }) {
  return (
    <span className={className}>
      {row.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.avatarUrl} alt={row.name} />
      ) : (
        <span>{initials(row.name)}</span>
      )}
    </span>
  );
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope: scopeRaw } = await searchParams;
  const scope = scopeRaw === "sempre" ? "sempre" : "mes";

  const supabase = await createClient();

  // Cada check-in aprovado conta como 1 experiência. Agrega por autora.
  const { data: posts } = await supabase
    .from("feed_posts")
    .select(
      "user_id, created_at, profiles!feed_posts_user_id_fkey(full_name, avatar_url, city, neighborhood)",
    )
    .eq("status", "approved");

  // Recorte do mês atual (string ISO compara lexicograficamente).
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthLabel = monthNameUpper(now).toLowerCase();

  const byUser = new Map<string, RankRow>();
  for (const p of posts ?? []) {
    if (p.profiles?.city !== CIDADE) continue;
    if (scope === "mes" && (p.created_at ?? "") < monthStart) continue;
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
    .slice(0, 10);

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  // Ordem visual do pódio: 2º à esquerda, 1º no centro (mais alto), 3º à direita.
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <div className="scroll-area with-nav">
      <header className="ranking-top">
        <div className="ranking-scope">
          <Link
            href="/comunidade/ranking?scope=mes"
            className={scope === "mes" ? "active" : ""}
          >
            Este mês
          </Link>
          <Link
            href="/comunidade/ranking?scope=sempre"
            className={scope === "sempre" ? "active" : ""}
          >
            Sempre
          </Link>
        </div>
        <h2 className="ranking-lede">
          As <em>Curitibanas</em> que mais <em>florescem</em> com a gente
        </h2>
      </header>

      {ranking.length === 0 ? (
        <div className="minhas-empty">
          <p className="minhas-empty-text">
            {scope === "mes"
              ? `Ainda não rolou check-in em ${CIDADE} esse mês. Bora abrir a temporada? ✿`
              : `O ranking de ${CIDADE} começa com os primeiros check-ins. ✿`}
          </p>
        </div>
      ) : (
        <>
          {/* Pódio top 3 */}
          <div className="podium">
            {podiumOrder.map((row, idx) => {
              if (!row) return <div key={idx} className="podium-col empty" />;
              const rank = ranking.indexOf(row) + 1;
              const tier = TIERS[rank - 1];
              return (
                <div key={row.userId} className={`podium-col ${tier}`}>
                  <div className="podium-person">
                    <div className="podium-avatar-wrap">
                      <Avatar row={row} className="podium-avatar" />
                      <span className="podium-badge">{rank}</span>
                    </div>
                    <div className="podium-name">{row.name}</div>
                    <div className="podium-xp">{row.count}</div>
                    <div className="podium-xp-label">
                      {row.count === 1 ? "experiência" : "experiências"}
                    </div>
                  </div>
                  <div className="podium-bar">
                    <span>{rank}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabela 4º+ */}
          {rest.length > 0 && (
            <>
              <div className="ranking-table-head">
                Top {ranking.length} — {scope === "mes" ? monthLabel : "sempre"}
              </div>
              <ol className="ranking-table">
                {rest.map((row, i) => (
                  <li key={row.userId} className="rt-row">
                    <span className="rt-pos">{i + 4}</span>
                    <Avatar row={row} className="rt-avatar" />
                    <span className="rt-name">{row.name}</span>
                    <span className="rt-count">
                      {row.count}
                      <span className="rt-flower" aria-hidden>
                        ✿
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}

          <div className="ranking-foot">
            <Link href="/comunidade" className="comunidade-rank-link">
              ← Voltar pro feed
            </Link>
          </div>
        </>
      )}

      <div className="h-12" />
    </div>
  );
}
