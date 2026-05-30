import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/bottom-nav";
import { logoutAction } from "@/app/actions/logout";
import { memberSince } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const ICON_DATA = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ICON_LOGOUT = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const CHEVRON = (
  <svg className="row-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/perfil");

  const [{ data: profile }, { count: checkins }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, instagram, avatar_url, created_at, total_experiences")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("feed_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "approved"),
  ]);

  const name = profile?.full_name ?? "Sua conta";
  const insta = profile?.instagram ?? null;
  const since = memberSince(profile?.created_at ?? user.created_at);

  const stats = [
    { n: profile?.total_experiences ?? 0, label: "experiências" },
    { n: checkins ?? 0, label: "check-ins" },
  ];

  return (
    <div className="movva-shell">
      <div className="scroll-area with-nav perfil-gradient">
        <section className="perfil-hero">
          <Link href="/perfil/dados" className="perfil-avatar" aria-label="Editar perfil">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={name} />
            ) : (
              <span>{initials(name)}</span>
            )}
          </Link>
          <h1 className="perfil-name">{name}</h1>
          <p className="perfil-sub">
            {insta ? `@${insta} · ` : ""}membro desde {since}
          </p>

          <div className="perfil-stats">
            {stats.map((s) => (
              <div key={s.label} className="perfil-stat">
                <div className="perfil-stat-n">{s.n}</div>
                <div className="perfil-stat-l">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="account-section">
          <div className="account-label">Sua conta</div>
          <div className="account-rows">
            <Link href="/perfil/dados" className="account-row">
              <span className="account-row-icon">{ICON_DATA}</span>
              <span className="account-row-label">Meus dados</span>
              {CHEVRON}
            </Link>
            <form action={logoutAction} className="account-row-form">
              <button type="submit" className="account-row danger">
                <span className="account-row-icon">{ICON_LOGOUT}</span>
                <span className="account-row-label">Sair da conta</span>
              </button>
            </form>
          </div>
        </section>

        <div className="h-12" />
      </div>
      <BottomNav loggedIn={!!user} />
    </div>
  );
}
