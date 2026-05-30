import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { timeAgo } from "@/lib/utils/date";
import { aprovarIdeia, rejeitarIdeia } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminIdeiasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/ideias");
  if (!isAdmin(user.email)) redirect("/comunidade/ideias");

  // RLS de ideas é using(true), então a SSR já lê as pendentes. Admin SEMPRE
  // vê a autora real (mesmo anônimas) — moderação.
  const { data: ideas } = await supabase
    .from("ideas")
    .select("id, text, is_anonymous, created_at, user_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const list = ideas ?? [];

  const authorIds = [
    ...new Set(list.map((i) => i.user_id).filter((v): v is string => !!v)),
  ];
  const nameMap = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);
    for (const p of profs ?? []) nameMap.set(p.id, p.full_name);
  }

  return (
    <div className="movva-shell">
      <div className="scroll-area">
        <header className="home-header">
          <div>
            <div className="greeting-label">
              moderação · {list.length} na fila
            </div>
            <div className="greeting-name">Aprovar ideias</div>
          </div>
        </header>

        {list.length === 0 ? (
          <div className="minhas-empty">
            <p className="minhas-empty-text">Nada na fila. Tudo aprovado ✦</p>
          </div>
        ) : (
          <div className="admin-list">
            {list.map((i) => (
              <div key={i.id} className="admin-post">
                <div className="admin-post-body">
                  <div className="admin-post-meta">
                    <strong>
                      {(i.user_id && nameMap.get(i.user_id)) || "—"}
                    </strong>
                    {i.is_anonymous && <span> · (quer anônima)</span>}
                    <span className="admin-post-time">
                      {" "}
                      · {timeAgo(i.created_at)}
                    </span>
                  </div>
                  <p className="admin-post-text">{i.text}</p>
                  <div className="admin-post-actions">
                    <form action={aprovarIdeia}>
                      <input type="hidden" name="id" value={i.id} />
                      <button type="submit" className="admin-btn approve">
                        Aprovar
                      </button>
                    </form>
                    <form action={rejeitarIdeia}>
                      <input type="hidden" name="id" value={i.id} />
                      <button type="submit" className="admin-btn reject">
                        Rejeitar
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-12" />
      </div>
    </div>
  );
}
