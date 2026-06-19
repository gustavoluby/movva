import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/utils/date";
import {
  criarCupom,
  atualizarCupom,
  toggleCupom,
  excluirCupom,
} from "./actions";

export const dynamic = "force-dynamic";

type Coupon = {
  code: string;
  discount_type: string; // 'percentage' | 'fixed'
  discount_value: number;
  event_id: string | null;
  max_uses: number | null;
  uses_count: number | null;
  valid_until: string | null;
  is_active: boolean | null;
};

type EventOpt = { id: string; title: string };

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function describeDiscount(c: Coupon): string {
  return c.discount_type === "percentage"
    ? `${c.discount_value}% OFF`
    : `${formatPrice(c.discount_value)} OFF`;
}

// Form reusável (criar ou editar). Sem `coupon` = criação. Na edição o código é
// a PK e fica travado (readonly), passado também como hidden.
function CouponForm({
  events,
  coupon,
}: {
  events: EventOpt[];
  coupon?: Coupon;
}) {
  const editing = !!coupon;
  const action = editing ? atualizarCupom : criarCupom;
  // fixed é guardado em centavos → exibe em reais no input.
  const valueDefault = coupon
    ? coupon.discount_type === "percentage"
      ? String(coupon.discount_value)
      : String(coupon.discount_value / 100)
    : "";
  const validDefault = coupon?.valid_until
    ? coupon.valid_until.slice(0, 10)
    : "";

  return (
    <form action={action} className="coupon-form">
      <div className="coupon-form-grid">
        <label className="coupon-field coupon-field-code">
          <span>Código</span>
          <input
            name="code"
            defaultValue={coupon?.code ?? ""}
            placeholder="BEMVINDO10"
            required
            readOnly={editing}
            autoCapitalize="characters"
            autoComplete="off"
          />
        </label>

        <label className="coupon-field">
          <span>Tipo</span>
          <select
            name="discount_type"
            defaultValue={coupon?.discount_type ?? "percentage"}
          >
            <option value="percentage">Porcentagem (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </select>
        </label>

        <label className="coupon-field">
          <span>Desconto</span>
          <input
            name="discount_value"
            type="number"
            min="1"
            step="any"
            defaultValue={valueDefault}
            placeholder="10"
            required
          />
        </label>

        <label className="coupon-field coupon-field-wide">
          <span>Experiência (opcional)</span>
          <select name="event_id" defaultValue={coupon?.event_id ?? ""}>
            <option value="">Todas as experiências</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </label>

        <label className="coupon-field">
          <span>Limite de usos</span>
          <input
            name="max_uses"
            type="number"
            min="1"
            step="1"
            defaultValue={coupon?.max_uses ?? ""}
            placeholder="ilimitado"
          />
        </label>

        <label className="coupon-field">
          <span>Válido até</span>
          <input name="valid_until" type="date" defaultValue={validDefault} />
        </label>
      </div>

      <button type="submit" className="admin-btn approve">
        {editing ? "Salvar alterações" : "Criar cupom"}
      </button>
    </form>
  );
}

export default async function AdminCuponsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/cupons");
  if (!isAdmin(user.email)) redirect("/");

  const admin = createAdminClient();
  const [{ data: coupons }, { data: events }] = await Promise.all([
    admin
      .from("coupons")
      .select(
        "code, discount_type, discount_value, event_id, max_uses, uses_count, valid_until, is_active",
      )
      .order("created_at", { ascending: false }),
    admin
      .from("events")
      .select("id, title")
      .eq("status", "published")
      .order("event_date", { ascending: true }),
  ]);

  const list = (coupons ?? []) as Coupon[];
  const eventOpts = (events ?? []) as EventOpt[];
  const eventName = new Map(eventOpts.map((e) => [e.id, e.title]));

  return (
    <div className="moodpass-shell">
      <div className="scroll-area">
        <header className="home-header">
          <div>
            <div className="greeting-label">admin · {list.length} cupom(ns)</div>
            <div className="greeting-name">Cupons de desconto</div>
          </div>
        </header>

        <section className="admin-card">
          <div className="admin-card-title">Novo cupom</div>
          <CouponForm events={eventOpts} />
        </section>

        {list.length === 0 ? (
          <div className="minhas-empty">
            <p className="minhas-empty-text">Nenhum cupom ainda.</p>
          </div>
        ) : (
          <div className="coupon-admin-list">
            {list.map((c) => (
              <div
                key={c.code}
                className={`coupon-admin-row${c.is_active ? "" : " is-off"}`}
              >
                <div className="coupon-admin-head">
                  <div className="coupon-admin-code">
                    {c.code}
                    {!c.is_active && (
                      <span className="coupon-admin-badge">inativo</span>
                    )}
                  </div>
                  <div className="coupon-admin-discount">
                    {describeDiscount(c)}
                  </div>
                </div>

                <div className="coupon-admin-meta">
                  <span>
                    {c.event_id
                      ? (eventName.get(c.event_id) ?? "experiência específica")
                      : "Todas as experiências"}
                  </span>
                  <span>
                    Usos: {c.uses_count ?? 0}
                    {c.max_uses != null ? ` / ${c.max_uses}` : ""}
                  </span>
                  {c.valid_until && (
                    <span>Até {dateFmt.format(new Date(c.valid_until))}</span>
                  )}
                </div>

                <div className="coupon-admin-actions">
                  <form action={toggleCupom}>
                    <input type="hidden" name="code" value={c.code} />
                    <input
                      type="hidden"
                      name="active"
                      value={String(!!c.is_active)}
                    />
                    <button type="submit" className="admin-btn reject">
                      {c.is_active ? "Desativar" : "Ativar"}
                    </button>
                  </form>

                  <details className="coupon-edit">
                    <summary className="admin-btn">Editar</summary>
                    <div className="coupon-edit-body">
                      <CouponForm events={eventOpts} coupon={c} />
                      <form action={excluirCupom} className="coupon-delete">
                        <input type="hidden" name="code" value={c.code} />
                        <button type="submit" className="coupon-delete-btn">
                          Excluir cupom
                        </button>
                      </form>
                    </div>
                  </details>
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
