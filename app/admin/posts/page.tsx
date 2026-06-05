import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { timeAgo } from "@/lib/utils/date";
import { aprovarPost, rejeitarPost } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/posts");
  if (!isAdmin(user.email)) redirect("/comunidade");

  // Service-role pra ver pendentes de todas as usuárias (bypassa RLS).
  const admin = createAdminClient();
  const { data: posts } = await admin
    .from("feed_posts")
    .select(
      `id, text, photo_url, location_name, created_at,
       profiles!feed_posts_user_id_fkey(full_name), events(title)`,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const list = posts ?? [];

  return (
    <div className="moodpass-shell">
      <div className="scroll-area">
        <header className="home-header">
          <div>
            <div className="greeting-label">moderação · {list.length} na fila</div>
            <div className="greeting-name">Aprovar check-ins</div>
          </div>
        </header>

        {list.length === 0 ? (
          <div className="minhas-empty">
            <p className="minhas-empty-text">Nada na fila. Tudo aprovado ✦</p>
          </div>
        ) : (
          <div className="admin-list">
            {list.map((p) => (
              <div key={p.id} className="admin-post">
                {p.photo_url && (
                  <div className="admin-post-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photo_url} alt="" />
                  </div>
                )}
                <div className="admin-post-body">
                  <div className="admin-post-meta">
                    <strong>{p.profiles?.full_name ?? "—"}</strong>
                    {p.location_name && <span> · {p.location_name}</span>}
                    {p.events?.title && <span> · {p.events.title}</span>}
                    <span className="admin-post-time">
                      {" "}
                      · {timeAgo(p.created_at)}
                    </span>
                  </div>
                  {p.text && <p className="admin-post-text">{p.text}</p>}
                  <div className="admin-post-actions">
                    <form action={aprovarPost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="admin-btn approve">
                        Aprovar
                      </button>
                    </form>
                    <form action={rejeitarPost}>
                      <input type="hidden" name="id" value={p.id} />
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
