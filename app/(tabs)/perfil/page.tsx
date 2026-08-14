import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/actions/logout";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { isAdmin } from "@/lib/admin";
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

const ICON_HELP = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ICON_SOBRE = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
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

const ICON_MOD = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const ICON_CREATE = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="12" y1="14" x2="12" y2="18" />
    <line x1="10" y1="16" x2="14" y2="16" />
  </svg>
);

const ICON_SALES = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const ICON_COUPON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const ICON_ACCOUNTS = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/perfil");

  const [{ data: profile }, { count: checkins }, { data: candidatura }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "full_name, instagram, avatar_url, created_at, total_experiences, role",
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("feed_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "approved"),
      // Candidatura a organizadora, pra saber o que dizer na linha do perfil.
      supabase
        .from("organizer_applications")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const name = profile?.full_name ?? "Sua conta";
  const insta = profile?.instagram ?? null;
  const since = memberSince(profile?.created_at ?? user.created_at);

  const stats = [
    { n: profile?.total_experiences ?? 0, label: "experiências" },
    { n: checkins ?? 0, label: "check-ins" },
  ];

  const supportHref = getWhatsAppLink({
    number: "5541999458878",
    message: "Olá! Preciso de ajuda com o Moodpass.",
  });

  return (
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

        {/* Organizadora parceira: só as experiências dela e as vendas delas. */}
        {!isAdmin(user.email) && profile?.role === "organizer" && (
          <section className="account-section">
            <div className="account-label">Organizadora</div>
            <div className="account-rows">
              <Link href="/admin/experiencias" className="account-row">
                <span className="account-row-icon">{ICON_CREATE}</span>
                <span className="account-row-label">Minhas experiências</span>
                {CHEVRON}
              </Link>
              <Link href="/admin/eventos" className="account-row">
                <span className="account-row-icon">{ICON_SALES}</span>
                <span className="account-row-label">Quem comprou</span>
                {CHEVRON}
              </Link>
            </div>
          </section>
        )}

        {isAdmin(user.email) && (
          <section className="account-section">
            <div className="account-label">Admin</div>
            <div className="account-rows">
              <Link href="/admin/aprovar" className="account-row">
                <span className="account-row-icon">{ICON_MOD}</span>
                <span className="account-row-label">Fila de aprovação</span>
                {CHEVRON}
              </Link>
              <Link href="/admin/experiencias" className="account-row">
                <span className="account-row-icon">{ICON_CREATE}</span>
                <span className="account-row-label">Criar / editar experiências</span>
                {CHEVRON}
              </Link>
              <Link href="/admin/eventos" className="account-row">
                <span className="account-row-icon">{ICON_SALES}</span>
                <span className="account-row-label">Eventos (vendas e contas)</span>
                {CHEVRON}
              </Link>
              <Link href="/admin/contas" className="account-row">
                <span className="account-row-icon">{ICON_ACCOUNTS}</span>
                <span className="account-row-label">Contas criadas</span>
                {CHEVRON}
              </Link>
              <Link href="/admin/cupons" className="account-row">
                <span className="account-row-icon">{ICON_COUPON}</span>
                <span className="account-row-label">Cupons de desconto</span>
                {CHEVRON}
              </Link>
            </div>
          </section>
        )}

        <section className="account-section">
          <div className="account-label">Sua conta</div>
          <div className="account-rows">
            {/* Quem ainda não é organizadora pode se candidatar por aqui. */}
            {!isAdmin(user.email) && profile?.role !== "organizer" && (
              <Link href="/perfil/organizadora" className="account-row">
                <span className="account-row-icon">{ICON_CREATE}</span>
                <span className="account-row-label">
                  {candidatura?.status === "pending"
                    ? "Candidatura em análise"
                    : candidatura?.status === "rejected"
                      ? "Sua candidatura · ver resposta"
                      : "Quero publicar uma experiência"}
                </span>
                {CHEVRON}
              </Link>
            )}
            <Link href="/perfil/dados" className="account-row">
              <span className="account-row-icon">{ICON_DATA}</span>
              <span className="account-row-label">Meus dados</span>
              {CHEVRON}
            </Link>
            <Link href="/sobre" className="account-row">
              <span className="account-row-icon">{ICON_SOBRE}</span>
              <span className="account-row-label">Sobre o Moodpass</span>
              {CHEVRON}
            </Link>
            <a
              href={supportHref}
              target="_blank"
              rel="noopener noreferrer"
              className="account-row"
            >
              <span className="account-row-icon">{ICON_HELP}</span>
              <span className="account-row-label">Ajuda e suporte</span>
              {CHEVRON}
            </a>
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
  );
}
