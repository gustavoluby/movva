import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/utils/date";
import { mudarStatusExperiencia } from "./actions";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
function fmtDate(d: string | null): string {
  if (!d) return "—";
  return dateFmt.format(new Date(`${d}T12:00:00`));
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

type Tab = "avenda" | "passados" | "rascunhos";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  status: string | null;
  event_date: string | null;
  price_cents: number | null;
  capacity: number | null;
  updated_at: string | null;
};

function EventAdminRow({ e }: { e: EventRow }) {
  const published = e.status === "published";
  return (
    <div className={`exp-admin-row${published ? "" : " is-off"}`}>
      <div className="exp-admin-main">
        <div className="exp-admin-title">{e.title}</div>
        <div className="exp-admin-meta">
          <span className={`exp-status exp-status-${e.status ?? "draft"}`}>
            {STATUS_LABEL[e.status ?? "draft"] ?? e.status}
          </span>
          <span>{fmtDate(e.event_date)}</span>
          <span>{formatPrice(e.price_cents ?? 0)}</span>
          <span>{e.capacity ?? 0} vagas</span>
        </div>
      </div>
      <div className="exp-admin-actions">
        <Link href={`/admin/experiencias/${e.id}`} className="admin-btn">
          Editar
        </Link>
        {published ? (
          <form action={mudarStatusExperiencia}>
            <input type="hidden" name="id" value={e.id} />
            <input type="hidden" name="status" value="draft" />
            <button type="submit" className="admin-btn reject">
              Despublicar
            </button>
          </form>
        ) : (
          <form action={mudarStatusExperiencia}>
            <input type="hidden" name="id" value={e.id} />
            <input type="hidden" name="status" value="published" />
            <button type="submit" className="admin-btn approve">
              Publicar
            </button>
          </form>
        )}
        {published && (
          <Link href={`/eventos/${e.slug}`} className="admin-btn" target="_blank">
            Ver
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function AdminExperienciasPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; tab?: string }>;
}) {
  const { ok, tab: tabRaw } = await searchParams;
  const tab: Tab =
    tabRaw === "passados"
      ? "passados"
      : tabRaw === "rascunhos"
        ? "rascunhos"
        : "avenda";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/experiencias");
  if (!isAdmin(user.email)) redirect("/perfil");

  const admin = createAdminClient();
  // Ordena pela última edição (mais recente no topo).
  const { data: events } = await admin
    .from("events")
    .select(
      "id, slug, title, status, event_date, price_cents, capacity, updated_at",
    )
    .order("updated_at", { ascending: false, nullsFirst: false });

  const all = (events ?? []) as EventRow[];

  // Hoje em Curitiba (America/Sao_Paulo) como "YYYY-MM-DD" — compara com
  // event_date pra separar publicados à venda dos que já rolaram.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  const avenda = all.filter(
    (e) => e.status === "published" && (e.event_date ?? "") >= today,
  );
  const passados = all.filter(
    (e) => e.status === "published" && (e.event_date ?? "") < today,
  );
  const rascunhos = all.filter((e) => e.status !== "published");

  const current =
    tab === "passados" ? passados : tab === "rascunhos" ? rascunhos : avenda;

  const emptyText =
    tab === "passados"
      ? "Nenhuma experiência publicada já aconteceu."
      : tab === "rascunhos"
        ? "Nenhum rascunho."
        : "Nenhuma experiência à venda.";

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "avenda", label: "À venda", count: avenda.length },
    { key: "passados", label: "Passados", count: passados.length },
    { key: "rascunhos", label: "Rascunhos", count: rascunhos.length },
  ];

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
          <div>
            <div className="greeting-label">
              admin · {all.length} experiência(s)
            </div>
            <div className="greeting-name">Experiências</div>
          </div>
        </header>

        {ok && <p className="exp-saved">Experiência salva com sucesso.</p>}

        <div className="exp-list-actions">
          <Link href="/admin/experiencias/nova" className="admin-btn approve">
            + Nova experiência
          </Link>
        </div>

        <nav className="elas-tabs" style={{ position: "static" }}>
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin/experiencias?tab=${t.key}`}
              className={`elas-tab${tab === t.key ? " active" : ""}`}
            >
              {t.label} · {t.count}
            </Link>
          ))}
        </nav>

        {current.length === 0 ? (
          <div className="minhas-empty">
            <p className="minhas-empty-text">{emptyText}</p>
          </div>
        ) : (
          <div className="exp-admin-list">
            {current.map((e) => (
              <EventAdminRow key={e.id} e={e} />
            ))}
          </div>
        )}

        <div className="h-12" />
      </div>
    </div>
  );
}
