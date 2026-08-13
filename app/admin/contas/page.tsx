import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage } from "@/lib/roles";
import { fetchUserEmails } from "@/lib/admin-users";
import { getClientWhatsAppLink } from "@/lib/whatsapp";
import { alternarOrganizadora } from "./actions";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
function fmtDate(d: string | null): string {
  if (!d) return "—";
  return dateFmt.format(new Date(d));
}
function fmtDateTime(d: string | null): string {
  if (!d) return "—";
  return dateTimeFmt.format(new Date(d));
}

type Conta = {
  id: string;
  name: string;
  handle: string | null;
  email: string;
  phone: string | null;
  birthday: string | null;
  city: string | null;
  neighborhood: string | null;
  bio: string | null;
  isActive: boolean;
  isVerified: boolean;
  isOrganizer: boolean;
  totalExperiences: number;
  totalFriends: number;
  totalBadges: number;
  createdAt: string | null;
};

function Field({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="admin-conta-field">
      <span className="admin-conta-field-label">{label}</span>
      {href ? (
        <a
          className="admin-conta-field-value admin-conta-field-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {value}
        </a>
      ) : (
        <span className="admin-conta-field-value">{value}</span>
      )}
    </div>
  );
}

export default async function AdminContasPage() {
  await requireAdminPage("/admin/contas");

  const admin = createAdminClient();

  // Email mora em auth.users; só o service-role enxerga.
  const emailById = await fetchUserEmails(admin);

  const { data: profiles } = await admin
    .from("profiles")
    .select(
      "id, full_name, handle, phone, birthday, city, neighborhood, bio, is_active, is_verified, role, total_experiences, total_friends, total_badges, created_at",
    )
    .order("created_at", { ascending: false });

  const contas: Conta[] = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.full_name,
    handle: p.handle,
    email: emailById.get(p.id) ?? "—",
    phone: p.phone,
    birthday: p.birthday,
    city: p.city,
    neighborhood: p.neighborhood,
    bio: p.bio,
    isActive: p.is_active ?? true,
    isVerified: p.is_verified ?? false,
    isOrganizer: p.role === "organizer",
    totalExperiences: p.total_experiences ?? 0,
    totalFriends: p.total_friends ?? 0,
    totalBadges: p.total_badges ?? 0,
    createdAt: p.created_at,
  }));

  const ativas = contas.filter((c) => c.isActive).length;

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
          <div className="greeting-name">Contas criadas</div>
        </header>

        <div className="admin-events">
          <p className="admin-summary">
            {contas.length} conta{contas.length === 1 ? "" : "s"} criada
            {contas.length === 1 ? "" : "s"} · {ativas} ativa
            {ativas === 1 ? "" : "s"}
          </p>

          {contas.length === 0 ? (
            <p className="admin-summary">Nenhuma conta criada ainda.</p>
          ) : (
            <div className="admin-conta-list">
              {contas.map((c) => (
                <section key={c.id} className="admin-conta-card">
                  <div className="admin-conta-head">
                    <span className="admin-conta-name">{c.name || "—"}</span>
                    <span className="admin-conta-badges">
                      {c.isVerified && (
                        <span className="admin-conta-badge verified">
                          Verificada
                        </span>
                      )}
                      {c.isOrganizer && (
                        <span className="admin-conta-badge organizer">
                          Organizadora
                        </span>
                      )}
                      {!c.isActive && (
                        <span className="admin-conta-badge inactive">
                          Inativa
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="admin-conta-grid">
                    <Field label="Instagram" value={c.handle ? `@${c.handle}` : "—"} />
                    <Field label="Email" value={c.email} />
                    <Field
                      label="WhatsApp"
                      value={c.phone ?? "—"}
                      href={getClientWhatsAppLink(c.phone)}
                    />
                    <Field label="Aniversário" value={fmtDate(c.birthday)} />
                    <Field label="Cidade" value={c.city ?? "—"} />
                    <Field label="Bairro" value={c.neighborhood ?? "—"} />
                    <Field
                      label="Experiências"
                      value={String(c.totalExperiences)}
                    />
                    <Field label="Amigas" value={String(c.totalFriends)} />
                    <Field label="Badges" value={String(c.totalBadges)} />
                    <Field label="Criada em" value={fmtDateTime(c.createdAt)} />
                  </div>

                  {/* Acesso de organizadora: cria e edita as experiências dela
                      e vê quem comprou — nada de contas, cupons ou estorno. */}
                  <form action={alternarOrganizadora} className="admin-conta-role">
                    <input type="hidden" name="id" value={c.id} />
                    <input
                      type="hidden"
                      name="tornar"
                      value={c.isOrganizer ? "0" : "1"}
                    />
                    <button
                      type="submit"
                      className={`admin-btn${c.isOrganizer ? " reject" : ""}`}
                    >
                      {c.isOrganizer
                        ? "Tirar acesso de organizadora"
                        : "Tornar organizadora"}
                    </button>
                  </form>

                  {c.bio && (
                    <p className="admin-conta-bio">
                      <span className="admin-conta-field-label">Bio</span>
                      {c.bio}
                    </p>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="h-12" />
      </div>
    </div>
  );
}
