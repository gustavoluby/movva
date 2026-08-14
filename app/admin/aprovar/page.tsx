import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { timeAgo } from "@/lib/utils/date";
import { getClientWhatsAppLink } from "@/lib/whatsapp";
import { aprovarPost, rejeitarPost } from "@/app/admin/posts/actions";
import { aprovarIdeia, rejeitarIdeia } from "@/app/admin/ideias/actions";
import {
  aprovarCandidatura,
  recusarCandidatura,
} from "@/app/admin/organizadoras/actions";

export const dynamic = "force-dynamic";

export default async function AprovarPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabRaw } = await searchParams;
  const tab =
    tabRaw === "ideias"
      ? "ideias"
      : tabRaw === "organizadoras"
        ? "organizadoras"
        : "posts";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/aprovar");
  if (!isAdmin(user.email)) redirect("/perfil");

  const admin = createAdminClient();

  const { data: posts } = await admin
    .from("feed_posts")
    .select(
      `id, text, photo_url, location_name, created_at,
       profiles!feed_posts_user_id_fkey(full_name), events(title)`,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const postList = posts ?? [];

  const { data: ideas } = await supabase
    .from("ideas")
    .select("id, text, is_anonymous, created_at, user_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const ideaList = ideas ?? [];
  const ideaAuthorIds = [
    ...new Set(ideaList.map((i) => i.user_id).filter((v): v is string => !!v)),
  ];
  const nameMap = new Map<string, string>();
  if (ideaAuthorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ideaAuthorIds);
    for (const p of profs ?? []) nameMap.set(p.id, p.full_name);
  }

  // Candidaturas a organizadora ("quero publicar uma experiência").
  const { data: cands } = await admin
    .from("organizer_applications")
    .select("id, user_id, event_idea, about, instagram, phone, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const candList = cands ?? [];
  if (candList.length > 0) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", candList.map((c) => c.user_id));
    for (const p of profs ?? []) nameMap.set(p.id, p.full_name);
  }

  return (
    <div className="moodpass-shell">
      <div className="scroll-area">
        <header className="aprovar-head">
          <Link href="/perfil" className="hero-btn" aria-label="Voltar pro perfil">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="greeting-name">Aprovação</div>
        </header>

        <nav className="elas-tabs" style={{ position: "static" }}>
          <Link
            href="/admin/aprovar?tab=posts"
            className={`elas-tab${tab === "posts" ? " active" : ""}`}
          >
            Check-ins{postList.length > 0 ? ` (${postList.length})` : ""}
          </Link>
          <Link
            href="/admin/aprovar?tab=ideias"
            className={`elas-tab${tab === "ideias" ? " active" : ""}`}
          >
            Ideias{ideaList.length > 0 ? ` (${ideaList.length})` : ""}
          </Link>
          <Link
            href="/admin/aprovar?tab=organizadoras"
            className={`elas-tab${tab === "organizadoras" ? " active" : ""}`}
          >
            Organizadoras{candList.length > 0 ? ` (${candList.length})` : ""}
          </Link>
        </nav>

        {tab === "organizadoras" ? (
          candList.length === 0 ? (
            <div className="minhas-empty">
              <p className="minhas-empty-text">
                Nenhuma candidatura esperando ✦
              </p>
            </div>
          ) : (
            <div className="admin-list">
              {candList.map((c) => {
                const zap = getClientWhatsAppLink(c.phone);
                return (
                  <div key={c.id} className="admin-post">
                    <div className="admin-post-body">
                      <div className="admin-post-meta">
                        <strong>{nameMap.get(c.user_id) ?? "—"}</strong>
                        {c.instagram && <span> · {c.instagram}</span>}
                        <span className="admin-post-time">
                          {" "}
                          · {timeAgo(c.created_at)}
                        </span>
                      </div>
                      <p className="admin-post-text">{c.event_idea}</p>
                      {c.about && (
                        <p className="admin-post-text admin-post-about">
                          {c.about}
                        </p>
                      )}
                      {c.phone && (
                        <p className="admin-post-text">
                          {zap ? (
                            <a
                              className="admin-conta-field-link"
                              href={zap}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {c.phone}
                            </a>
                          ) : (
                            c.phone
                          )}
                        </p>
                      )}
                      <div className="admin-post-actions">
                        <form action={aprovarCandidatura}>
                          <input type="hidden" name="id" value={c.id} />
                          <button type="submit" className="admin-btn approve">
                            Aprovar como organizadora
                          </button>
                        </form>
                      </div>
                      {/* Recusa com recado: é o que ela lê no perfil pra
                          ajustar e mandar de novo. */}
                      <details className="exp-review-devolver">
                        <summary className="admin-btn reject">Recusar</summary>
                        <form
                          action={recusarCandidatura}
                          className="exp-review-form"
                        >
                          <input type="hidden" name="id" value={c.id} />
                          <textarea
                            name="admin_note"
                            rows={2}
                            placeholder="O que dizer pra ela (opcional)"
                          />
                          <button type="submit" className="admin-btn reject">
                            Recusar candidatura
                          </button>
                        </form>
                      </details>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : tab === "posts" ? (
          postList.length === 0 ? (
            <div className="minhas-empty">
              <p className="minhas-empty-text">
                Nada na fila de check-ins. Tudo aprovado ✦
              </p>
            </div>
          ) : (
            <div className="admin-list">
              {postList.map((p) => (
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
          )
        ) : ideaList.length === 0 ? (
          <div className="minhas-empty">
            <p className="minhas-empty-text">
              Nada na fila de ideias. Tudo aprovado ✦
            </p>
          </div>
        ) : (
          <div className="admin-list">
            {ideaList.map((i) => (
              <div key={i.id} className="admin-post">
                <div className="admin-post-body">
                  <div className="admin-post-meta">
                    <strong>{(i.user_id && nameMap.get(i.user_id)) || "—"}</strong>
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
