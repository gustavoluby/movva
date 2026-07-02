"use client";

import { removerVenda, estornarERemover } from "./actions";

// Ações de remoção de venda, com confirmação nativa:
// - "Estornar e liberar": chama a API de refund do Mercado Pago e libera a vaga.
//   Só aparece quando há payment_id (necessário pro estorno via API).
// - "Só liberar": libera a vaga sem estornar (quando o estorno já foi manual).
export function RemoveSaleButton({
  bookingId,
  name,
  paymentId,
}: {
  bookingId: string;
  name: string;
  paymentId: string | null;
}) {
  return (
    <div className="admin-sale-actions">
      {paymentId ? (
        <form
          action={estornarERemover}
          onSubmit={(e) => {
            const ok = window.confirm(
              `Estornar o pagamento de ${name} no Mercado Pago e liberar a vaga?\n\nO valor será devolvido ao comprador (estorno total).`,
            );
            if (!ok) e.preventDefault();
          }}
        >
          <input type="hidden" name="bookingId" value={bookingId} />
          <button
            type="submit"
            className="admin-remove-btn refund"
            aria-label={`Estornar e liberar a vaga de ${name}`}
          >
            Estornar e liberar
          </button>
        </form>
      ) : null}

      <form
        action={removerVenda}
        onSubmit={(e) => {
          const ok = window.confirm(
            `Liberar a vaga de ${name} sem estornar?\n\nNÃO devolve o dinheiro — use quando o estorno já foi feito no Mercado Pago.`,
          );
          if (!ok) e.preventDefault();
        }}
      >
        <input type="hidden" name="bookingId" value={bookingId} />
        <button
          type="submit"
          className="admin-remove-btn"
          aria-label={`Só liberar a vaga de ${name}`}
        >
          Só liberar
        </button>
      </form>
    </div>
  );
}
