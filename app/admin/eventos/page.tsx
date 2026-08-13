import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/roles";
import { fetchUserEmails } from "@/lib/admin-users";
import { formatPrice } from "@/lib/utils/date";
import { getClientWhatsAppLink } from "@/lib/whatsapp";
import { RemoveSaleButton } from "./remove-sale-button";
import { AddSaleForm } from "./add-sale-form";

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
  paymentMethod: string | null;
  paymentId: string | null;
};

type PendingBuyer = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string | null;
};

type EventRow = {
  id: string;
  title: string;
  status: string | null;
  buyers: Buyer[];
  pending: PendingBuyer[];
  revenue: number;
  /** Quanto sai pra organizadora (null = evento da casa, sem repasse). */
  payout: { commission: number; net: number } | null;
};

/**
 * Repasse pra organizadora: o dinheiro cai todo na conta do Moodpass, então o
 * que a tela mostra é a conta do acerto — bruto menos a comissão combinada
 * pra esse evento. A taxa do Mercado Pago não entra aqui (ela é debitada lá).
 */
function calcPayout(
  revenue: number,
  sales: number,
  type: string | null,
  value: number | null,
): { commission: number; net: number } {
  const v = value ?? 0;
  const commission =
    type === "percent"
      ? Math.round((revenue * v) / 100)
      : type === "fixed"
        ? Math.round(v * 100) * sales
        : 0;
  return { commission, net: Math.max(0, revenue - commission) };
}

function paymentLabel(method: string | null): string {
  if (method === "pix") return "Pix";
  if (method === "card" || method === "credit_card") return "Cartão";
  if (method === "dinheiro") return "Dinheiro";
  if (method === "cortesia") return "Cortesia";
  return method ?? "—";
}

/** Célula de telefone: vira link do WhatsApp quando o número é válido. */
function PhoneCell({ phone }: { phone: string | null }) {
  const href = getClientWhatsAppLink(phone);
  return (
    <td>
      {href ? (
        <a
          className="admin-conta-field-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {phone}
        </a>
      ) : (
        (phone ?? "—")
      )}
    </td>
  );
}

function EventSalesBlock({
  e,
  canManage,
}: {
  e: EventRow;
  /** Estorno/remoção mexem no Mercado Pago — só admin. */
  canManage: boolean;
}) {
  return (
    <section className="admin-event-block">
      <div className="admin-event-head">
        <span className="admin-event-title">{e.title}</span>
        <span className="admin-event-count">
          {e.buyers.length} venda{e.buyers.length === 1 ? "" : "s"}
          {e.revenue > 0 ? ` · ${formatPrice(e.revenue)}` : ""}
          {e.pending.length > 0 ? ` · ${e.pending.length} pendente${e.pending.length === 1 ? "" : "s"}` : ""}
        </span>
      </div>

      {e.payout && e.revenue > 0 && (
        <p className="admin-payout">
          Repasse à organizadora: <strong>{formatPrice(e.payout.net)}</strong>
          {e.payout.commission > 0
            ? ` (bruto ${formatPrice(e.revenue)} − comissão ${formatPrice(e.payout.commission)})`
            : " (sem comissão combinada)"}
          <span className="admin-payout-hint">
            Antes da taxa do Mercado Pago, que é debitada na conta do Moodpass.
          </span>
        </p>
      )}

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
                <th>Pagamento</th>
                {canManage && <th aria-label="Ações"></th>}
              </tr>
            </thead>
            <tbody>
              {e.buyers.map((b) => (
                <tr key={`${e.id}-${b.userId}`}>
                  <td>{b.name}</td>
                  <td>{b.email}</td>
                  <PhoneCell phone={b.phone} />
                  <td>{fmtDate(b.paidAt)}</td>
                  <td>{formatPrice(b.amountCents)}</td>
                  <td>
                    {paymentLabel(b.paymentMethod)}
                    {b.paymentId ? (
                      <span className="admin-payment-id" title="ID do pagamento no Mercado Pago">
                        {" "}#{b.paymentId}
                      </span>
                    ) : null}
                  </td>
                  {canManage && (
                    <td className="admin-table-action">
                      <RemoveSaleButton
                        bookingId={b.bookingId}
                        name={b.name}
                        paymentId={b.paymentId}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {e.pending.length > 0 && (
        <details className="admin-pending">
          <summary className="admin-pending-head">
            {e.pending.length} reserva{e.pending.length === 1 ? "" : "s"} pendente
            {e.pending.length === 1 ? "" : "s"} (checkout não pago)
          </summary>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Iniciado em</th>
                </tr>
              </thead>
              <tbody>
                {e.pending.map((p) => (
                  <tr key={`${e.id}-pend-${p.userId}`}>
                    <td>{p.name}</td>
                    <td>{p.email}</td>
                    <PhoneCell phone={p.phone} />
                    <td>{fmtDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
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
  const viewer = await requireStaff("/admin/eventos");
  // Contas e venda manual mexem em dado de todo mundo — só admin.
  const tab = !viewer.isAdmin
    ? "vendas"
    : tabRaw === "contas"
      ? "contas"
      : tabRaw === "adicionar"
        ? "adicionar"
        : "vendas";

  const admin = createAdminClient();

  // Email mora em auth.users; busca uma vez e reaproveita nas duas abas.
  const emailById = await fetchUserEmails(admin);

  // ---- Aba VENDAS ----
  // Organizadora só vê as vendas das experiências dela.
  let eventsQuery = admin
    .from("events")
    .select(
      "id, title, status, price_cents, event_date, owner_id, commission_type, commission_value",
    )
    .order("event_date", { ascending: false });
  if (!viewer.isAdmin) eventsQuery = eventsQuery.eq("owner_id", viewer.userId);
  const { data: events } = await eventsQuery;

  const eventIds = (events ?? []).map((e) => e.id);
  // Sem evento nenhum, `in()` com lista vazia devolveria tudo — corta antes.
  const semEventos = !viewer.isAdmin && eventIds.length === 0;

  let paidQuery = admin
    .from("bookings")
    .select(
      "id, event_id, user_id, amount_cents, paid_at, created_at, payment_method, payment_id",
    )
    .eq("payment_status", "paid");
  if (!viewer.isAdmin) paidQuery = paidQuery.in("event_id", eventIds);
  const { data: paidBookings } = semEventos ? { data: [] } : await paidQuery;

  // Reservas pendentes (checkout iniciado, não pago) — não seguram vaga, mas
  // ajudam a enxergar abandono de checkout.
  let pendingQuery = admin
    .from("bookings")
    .select("event_id, user_id, created_at")
    .eq("payment_status", "pending");
  if (!viewer.isAdmin) pendingQuery = pendingQuery.in("event_id", eventIds);
  const { data: pendingBookings } = semEventos ? { data: [] } : await pendingQuery;

  // Perfis de quem comprou/iniciou (nome + WhatsApp) — busca uma vez pros dois.
  const buyerIds = [
    ...new Set([
      ...(paidBookings ?? []).map((b) => b.user_id),
      ...(pendingBookings ?? []).map((b) => b.user_id),
    ]),
  ];
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
      paymentMethod: b.payment_method,
      paymentId: b.payment_id,
    };
    const arr = buyersByEvent.get(b.event_id);
    if (arr) arr.push(buyer);
    else buyersByEvent.set(b.event_id, [buyer]);
  }

  const pendingByEvent = new Map<string, PendingBuyer[]>();
  for (const b of pendingBookings ?? []) {
    const prof = profById.get(b.user_id);
    const pend: PendingBuyer = {
      userId: b.user_id,
      name: prof?.full_name ?? "—",
      email: emailById.get(b.user_id) ?? "—",
      phone: prof?.phone ?? "—",
      createdAt: b.created_at,
    };
    const arr = pendingByEvent.get(b.event_id);
    if (arr) arr.push(pend);
    else pendingByEvent.set(b.event_id, [pend]);
  }

  const eventRows: EventRow[] = (events ?? []).map((e) => {
    const buyers = (buyersByEvent.get(e.id) ?? []).sort((a, b) =>
      (b.paidAt ?? "").localeCompare(a.paidAt ?? ""),
    );
    const pending = (pendingByEvent.get(e.id) ?? []).sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    );
    const revenue = buyers.reduce((s, b) => s + (b.amountCents ?? 0), 0);
    return {
      id: e.id,
      title: e.title,
      status: e.status,
      buyers,
      pending,
      revenue,
      payout: e.owner_id
        ? calcPayout(
            revenue,
            buyers.length,
            e.commission_type,
            e.commission_value,
          )
        : null,
    };
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
  const canManage = viewer.isAdmin;

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
          <div>
            {!viewer.isAdmin && (
              <div className="greeting-label">organizadora · suas vendas</div>
            )}
            <div className="greeting-name">Eventos</div>
          </div>
        </header>

        {viewer.isAdmin && (
          <nav className="elas-tabs" style={{ position: "static" }}>
            <Link
              href="/admin/eventos?tab=vendas"
              className={`elas-tab${tab === "vendas" ? " active" : ""}`}
            >
              Vendas
            </Link>
            <Link
              href="/admin/eventos?tab=adicionar"
              className={`elas-tab${tab === "adicionar" ? " active" : ""}`}
            >
              Adicionar
            </Link>
            <Link
              href="/admin/eventos?tab=contas"
              className={`elas-tab${tab === "contas" ? " active" : ""}`}
            >
              Contas
            </Link>
          </nav>
        )}

        {tab === "adicionar" ? (
          <AddSaleForm
            events={(events ?? []).map((e) => ({
              id: e.id,
              title: e.title,
              active: e.status === "published",
            }))}
          />
        ) : tab === "vendas" ? (
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
                  ativos.map((e) => (
                    <EventSalesBlock key={e.id} e={e} canManage={canManage} />
                  ))
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
                  inativos.map((e) => (
                    <EventSalesBlock key={e.id} e={e} canManage={canManage} />
                  ))
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
                      <PhoneCell phone={c.phone} />
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
