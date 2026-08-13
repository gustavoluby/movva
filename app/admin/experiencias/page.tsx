import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/roles";
import { formatPrice } from "@/lib/utils/date";
import { mudarStatusExperiencia, revisarExperiencia } from "./actions";

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
  pending_review: "Em análise",
  published: "Publicado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

type Tab = "avenda" | "analise" | "passados" | "rascunhos";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  status: string | null;
  event_date: string | null;
  price_cents: number | null;
  capacity: number | null;
  updated_at: string | null;
  owner_id: string | null;
  review_note: string | null;
};

function EventAdminRow({
  e,
  isAdmin,
  ownerName,
}: {
  e: EventRow;
  isAdmin: boolean;
  ownerName?: string;
}) {
  const status = e.status ?? "draft";
  const published = status === "published";
  const emAnalise = status === "pending_review";

  return (
    <div className={`exp-admin-row${published ? "" : " is-off"}`}>
      <div className="exp-admin-main">
        <div className="exp-admin-title">{e.title}</div>
        <div className="exp-admin-meta">
          <span className={`exp-status exp-status-${status}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
          <span>{fmtDate(e.event_date)}</span>
          <span>{formatPrice(e.price_cents ?? 0)}</span>
          <span>{e.capacity ?? 0} vagas</span>
          {ownerName && <span>por {ownerName}</span>}
        </div>
        {/* O recado da devolução fica à vista até ela reenviar. */}
        {e.review_note && status === "draft" && (
          <p className="exp-review-note">
            <strong>Ajuste pedido:</strong> {e.review_note}
          </p>
        )}
      </div>

      <div className="exp-admin-actions">
        <Link href={`/admin/experiencias/${e.id}`} className="admin-btn">
          Editar
        </Link>

        {isAdmin ? (
          <>
            {emAnalise && (
              <form action={revisarExperiencia}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="decisao" value="aprovar" />
                <button type="submit" className="admin-btn approve">
                  Aprovar e publicar
                </button>
              </form>
            )}
            {published ? (
              <form action={mudarStatusExperiencia}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="status" value="draft" />
                <button type="submit" className="admin-btn reject">
                  Despublicar
                </button>
              </form>
            ) : (
              !emAnalise && (
                <form action={mudarStatusExperiencia}>
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="status" value="published" />
                  <button type="submit" className="admin-btn approve">
                    Publicar
                  </button>
                </form>
              )
            )}
          </>
        ) : (
          <>
            {status === "draft" && (
              <form action={mudarStatusExperiencia}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="status" value="pending_review" />
                <button type="submit" className="admin-btn approve">
                  Enviar pra aprovação
                </button>
              </form>
            )}
            {emAnalise && (
              <form action={mudarStatusExperiencia}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="status" value="draft" />
                <button type="submit" className="admin-btn">
                  Voltar pra rascunho
                </button>
              </form>
            )}
          </>
        )}

        {published && (
          <Link href={`/eventos/${e.slug}`} className="admin-btn" target="_blank">
            Ver
          </Link>
        )}
      </div>

      {/* Devolver pra ajuste: o recado é o que ela vai ler ao abrir a edição. */}
      {isAdmin && emAnalise && (
        <details className="exp-review-devolver">
          <summary className="admin-btn reject">Devolver pra ajuste</summary>
          <form action={revisarExperiencia} className="exp-review-form">
            <input type="hidden" name="id" value={e.id} />
            <input type="hidden" name="decisao" value="devolver" />
            <textarea
              name="review_note"
              rows={2}
              placeholder="O que precisa mudar antes de publicar?"
            />
            <button type="submit" className="admin-btn reject">
              Devolver
            </button>
          </form>
        </details>
      )}
    </div>
  );
}

export default async function AdminExperienciasPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; tab?: string }>;
}) {
  const { ok, tab: tabRaw } = await searchParams;
  const viewer = await requireStaff("/admin/experiencias");

  const admin = createAdminClient();
  // Admin enxerga tudo; organizadora, só as experiências dela.
  let query = admin
    .from("events")
    .select(
      "id, slug, title, status, event_date, price_cents, capacity, updated_at, owner_id, review_note",
    )
    .order("updated_at", { ascending: false, nullsFirst: false });
  if (!viewer.isAdmin) query = query.eq("owner_id", viewer.userId);
  const { data: events } = await query;

  const all = (events ?? []) as EventRow[];

  // Nome de quem criou, só pro admin saber de quem é cada linha.
  const ownerNames = new Map<string, string>();
  if (viewer.isAdmin) {
    const ids = [...new Set(all.map((e) => e.owner_id).filter(Boolean))] as string[];
    if (ids.length > 0) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      for (const p of profs ?? []) ownerNames.set(p.id, p.full_name);
    }
  }

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
  const analise = all.filter((e) => e.status === "pending_review");
  const rascunhos = all.filter(
    (e) => e.status !== "published" && e.status !== "pending_review",
  );

  const tab: Tab =
    tabRaw === "passados"
      ? "passados"
      : tabRaw === "rascunhos"
        ? "rascunhos"
        : tabRaw === "analise"
          ? "analise"
          : // Com gente esperando aprovação, o admin cai direto na fila.
            viewer.isAdmin && analise.length > 0
            ? "analise"
            : "avenda";

  const current =
    tab === "passados"
      ? passados
      : tab === "rascunhos"
        ? rascunhos
        : tab === "analise"
          ? analise
          : avenda;

  const emptyText =
    tab === "passados"
      ? "Nenhuma experiência publicada já aconteceu."
      : tab === "rascunhos"
        ? "Nenhum rascunho."
        : tab === "analise"
          ? viewer.isAdmin
            ? "Nada esperando aprovação."
            : "Nada seu em análise."
          : "Nenhuma experiência à venda.";

  const TABS: { key: Tab; label: string; count: number }[] = [
    ...(viewer.isAdmin
      ? [{ key: "analise" as Tab, label: "Aprovação", count: analise.length }]
      : []),
    { key: "avenda", label: "À venda", count: avenda.length },
    ...(viewer.isAdmin
      ? []
      : [{ key: "analise" as Tab, label: "Em análise", count: analise.length }]),
    { key: "rascunhos", label: "Rascunhos", count: rascunhos.length },
    { key: "passados", label: "Passados", count: passados.length },
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
              {viewer.isAdmin ? "admin" : "organizadora"} · {all.length}{" "}
              experiência(s)
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
              <EventAdminRow
                key={e.id}
                e={e}
                isAdmin={viewer.isAdmin}
                ownerName={
                  e.owner_id ? (ownerNames.get(e.owner_id) ?? undefined) : undefined
                }
              />
            ))}
          </div>
        )}

        <div className="h-12" />
      </div>
    </div>
  );
}
