"use client";

import { useActionState, useRef } from "react";
import { adicionarPagante, type AddSaleState } from "./actions";

type EventOpt = { id: string; title: string; active: boolean };

// Formulário de venda por fora (Pix direto, dinheiro, cortesia). Cria/anexa a
// reserva paga sem passar pelo Mercado Pago. O email é opcional: com email, a
// pessoa acessa a conta depois; sem email, fica só o registro de controle.
export function AddSaleForm({ events }: { events: EventOpt[] }) {
  const [state, formAction, pending] = useActionState<AddSaleState, FormData>(
    adicionarPagante,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa os campos depois de registrar com sucesso (mas mantém o evento
  // escolhido — costuma lançar várias vendas do mesmo evento em sequência).
  if (state?.ok && formRef.current) {
    const f = formRef.current;
    for (const name of ["name", "email", "phone", "amount"]) {
      const el = f.elements.namedItem(name) as HTMLInputElement | null;
      if (el) el.value = "";
    }
  }

  const ativos = events.filter((e) => e.active);
  const inativos = events.filter((e) => !e.active);

  return (
    <form action={formAction} className="exp-form" ref={formRef}>
      <section className="admin-card">
        <div className="admin-card-title">Nova venda por fora</div>
        <p className="exp-hint" style={{ marginBottom: 14 }}>
          Pra pagamento feito fora do app (Pix direto, dinheiro, cortesia). A
          pessoa entra na lista de compradoras na hora.
        </p>

        <div className="coupon-form-grid">
          <label className="coupon-field coupon-field-wide">
            Evento
            <select name="eventId" defaultValue="" required>
              <option value="" disabled>
                Escolhe o evento…
              </option>
              {ativos.length > 0 && (
                <optgroup label="Ativos">
                  {ativos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </optgroup>
              )}
              {inativos.length > 0 && (
                <optgroup label="Inativos">
                  {inativos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          <label className="coupon-field coupon-field-wide">
            Nome
            <input name="name" required placeholder="Nome da pagante" />
          </label>

          <label className="coupon-field coupon-field-wide">
            Email <span style={{ textTransform: "none" }}>(opcional)</span>
            <input
              name="email"
              type="email"
              autoComplete="off"
              placeholder="pra ela acessar a conta depois"
            />
          </label>

          <label className="coupon-field">
            WhatsApp <span style={{ textTransform: "none" }}>(opcional)</span>
            <input
              name="phone"
              inputMode="tel"
              autoComplete="off"
              placeholder="(41) 9…"
            />
          </label>

          <label className="coupon-field">
            Valor pago
            <input
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="139,00"
            />
          </label>

          <label className="coupon-field coupon-field-wide">
            Forma de pagamento
            <select name="method" defaultValue="pix">
              <option value="pix">Pix (por fora)</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="card">Cartão (por fora)</option>
              <option value="cortesia">Cortesia (grátis)</option>
            </select>
          </label>
        </div>

        {state?.error && <p className="exp-error">{state.error}</p>}
        {state?.ok && <p className="exp-saved">{state.ok}</p>}

        <button
          type="submit"
          className="admin-btn approve exp-submit"
          disabled={pending}
        >
          {pending ? "Registrando…" : "Registrar venda"}
        </button>
      </section>
    </form>
  );
}
