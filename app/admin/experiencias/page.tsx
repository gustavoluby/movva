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

type EventRow = {
  id: string;
  slug: string;
  title: string;
  status: string | null;
  event_date: string | null;
  price_cents: number | null;
  capacity: number | null;
};

export default async function AdminExperienciasPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/experiencias");
  if (!isAdmin(user.email)) redirect("/perfil");

  const admin = createAdminClient();
  const { data: events } = await admin
    .from("events")
    .select("id, slug, title, status, event_date, price_cents, capacity")
    .order("event_date", { ascending: false });

  const list = (events ?? []) as EventRow[];

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
              admin · {list.length} experiência(s)
            </div>
            <div className="greeting-name">Experiências</div>
          </div>
        </header>

        {ok && (
          <p className="exp-saved">Experiência salva com sucesso.</p>
        )}

        <div className="exp-list-actions">
          <Link href="/admin/experiencias/nova" className="admin-btn approve">
            + Nova experiência
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="minhas-empty">
            <p className="minhas-empty-text">Nenhuma experiência ainda.</p>
          </div>
        ) : (
          <div className="exp-admin-list">
            {list.map((e) => (
              <div
                key={e.id}
                className={`exp-admin-row${e.status === "published" ? "" : " is-off"}`}
              >
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
                  <Link
                    href={`/admin/experiencias/${e.id}`}
                    className="admin-btn"
                  >
                    Editar
                  </Link>
                  {e.status === "published" ? (
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
                  {e.status === "published" && (
                    <Link
                      href={`/eventos/${e.slug}`}
                      className="admin-btn"
                      target="_blank"
                    >
                      Ver
                    </Link>
                  )}
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
