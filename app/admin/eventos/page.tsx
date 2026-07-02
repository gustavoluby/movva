import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { fetchUserEmails } from "@/lib/admin-users";
import { formatPrice } from "@/lib/utils/date";
import { RemoveSaleButton } from "./remove-sale-button";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
function fmtDate(d: string | null): string {
  if (!d) return "—";
  return dateFmt.format(new Date(d));
}

type Buyer = {
  userId: string;
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  paidAt: string | null;
  amountCents: number;
};

type EventRow = {
  id: string;
  title: string;
  status: string | null;
  buyers: Buyer[];
  revenue: number;
};

function EventSalesBlock({ e }: { e: EventRow }) {
  return (
    <section className="admin-event-block">
      <div className="admin-event-head">
        <span className="admin-event-title">{e.title}</span>
        <span className="admin-event-count">
          {e.buyers.length} venda{e.buyers.length === 1 ? "" : "s"}
          {e.revenue > 0 ? ` · ${formatPrice(e.revenue)}` : ""}
        </span>
      </div>

      {e.buyers.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Pago em</th>
                <th>Valor</th>
                <th aria-label="Ações"></th>
              </tr>
            </thead>
            <tbody>
              {e.buyers.map((b) => (
                <tr key={`${e.id}-${b.userId}`}>
                  <td>{b.name}</td>
                  <td>{b.email}</td>
                  <td>{b.phone}</td>
                  <td>{fmtDate(b.paidAt)}</td>
                  <td>{formatPrice(b.amountCents)}</td>
                  <td className="admin-table-action">
                    <RemoveSaleButton bookingId={b.bookingId} name={b.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function AdminEventosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabRaw } = await searchParams;
  const tab = tabRaw === "contas" ? "contas" : "vendas";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/eventos");
  if (!isAdmin(user.email)) redirect("/perfil");

  const admin = createAdminClient();

  // Email mora em auth.users; busca uma vez e reaproveita nas duas abas.
  const emailById = await fetchUserEmails(admin);

  // ---- Aba VENDAS ----
  const { data: events } = await admin
    .from("events")
    .select("id, title, status, price_cents, event_date")
    .order("event_date", { ascending: false });

  const { data: paidBookings } = await admin
    .from("bookings")
    .select("id, event_id, user_id, amount_cents, paid_at, created_at")
    .eq("payment_status", "paid");

  // Perfis de quem comprou (nome + WhatsApp).
  const buyerIds = [...new Set((paidBookings ?? []).map((b) => b.user_id))];
  const profById = new Map<string, { full_name: string; phone: string | null }>();
  if (buyerIds.length > 0) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", buyerIds);
    for (const p of profs ?? [])
      profById.set(p.id, { full_name: p.full_name, phone: p.phone });
  }

  const buyersByEvent = new Map<string, Buyer[]>();
  for (const b of paidBookings ?? []) {
    const prof = profById.get(b.user_id);
    const buyer: Buyer = {
      userId: b.user_id,
      bookingId: b.id,
      name: prof?.full_name ?? "—",
      email: emailById.get(b.user_id) ?? "—",
      phone: prof?.phone ?? "—",
      paidAt: b.paid_at ?? b.created_at,
      amountCents: b.amount_cents,
    };
    const arr = buyersByEvent.get(b.event_id);
    if (arr) arr.push(buyer);
    else buyersByEvent.set(b.event_id, [buyer]);
  }

  const eventRows: EventRow[] = (events ?? []).map((e) => {
    const buyers = (buyersByEvent.get(e.id) ?? []).sort((a, b) =>
      (b.paidAt ?? "").localeCompare(a.paidAt ?? ""),
    );
    const revenue = buyers.reduce((s, b) => s + (b.amountCents ?? 0), 0);
    return { id: e.id, title: e.title, status: e.status, buyers, revenue };
  });

  // Ativos = publicados (à venda); inativos = rascunhos/cancelados/etc.
  const ativos = eventRows.filter((e) => e.status === "published");
  const inativos = eventRows.filter((e) => e.status !== "published");

  const totalVendas = (paidBookings ?? []).length;
  const totalReceita = (paidBookings ?? []).reduce(
    (s, b) => s + (b.amount_cents ?? 0),
    0,
  );

  // ---- Aba CONTAS ----
  let contas: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string | null;
    createdAt: string | null;
  }[] = [];
  if (tab === "contas") {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, phone, city, neighborhood, created_at")
      .order("created_at", { ascending: false });
    contas = (profiles ?? []).map((p) => ({
      id: p.id,
      name: p.full_name,
      email: emailById.get(p.id) ?? "—",
      phone: p.phone ?? "—",
      city: [p.neighborhood, p.city].filter(Boolean).join(" · ") || null,
      createdAt: p.created_at,
    }));
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
          <div className="greeting-name">Eventos</div>
        </header>

        <nav className="elas-tabs" style={{ position: "static" }}>
          <Link
            href="/admin/eventos?tab=vendas"
            className={`elas-tab${tab === "vendas" ? " active" : ""}`}
          >
            Vendas
          </Link>
          <Link
            href="/admin/eventos?tab=contas"
            className={`elas-tab${tab === "contas" ? " active" : ""}`}
          >
            Contas
          </Link>
        </nav>

        {tab === "vendas" ? (
          <div className="admin-events">
            <p className="admin-summary">
              {totalVendas} venda{totalVendas === 1 ? "" : "s"} no total ·{" "}
              {formatPrice(totalReceita)}
            </p>

            <details className="admin-group" open>
              <summary className="admin-group-head">
                Eventos ativos · {ativos.length}
              </summary>
              <div className="admin-group-body">
                {ativos.length === 0 ? (
                  <p className="admin-summary">Nenhum evento ativo.</p>
                ) : (
                  ativos.map((e) => <EventSalesBlock key={e.id} e={e} />)
                )}
              </div>
            </details>

            <details className="admin-group">
              <summary className="admin-group-head">
                Eventos inativos · {inativos.length}
              </summary>
              <div className="admin-group-body">
                {inativos.length === 0 ? (
                  <p className="admin-summary">Nenhum evento inativo.</p>
                ) : (
                  inativos.map((e) => <EventSalesBlock key={e.id} e={e} />)
                )}
              </div>
            </details>
          </div>
        ) : (
          <div className="admin-events">
            <p className="admin-summary">
              {contas.length} conta{contas.length === 1 ? "" : "s"} criada
              {contas.length === 1 ? "" : "s"}
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>WhatsApp</th>
                    <th>Local</th>
                    <th>Criada em</th>
                  </tr>
                </thead>
                <tbody>
                  {contas.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.email}</td>
                      <td>{c.phone}</td>
                      <td>{c.city ?? "—"}</td>
                      <td>{fmtDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="h-12" />
      </div>
    </div>
  );
}
