"use client";

import { removerVenda } from "./actions";

// Botão de remover venda com confirmação nativa. Deixa explícito que a ação
// libera a vaga mas NÃO estorna o pagamento (o estorno é feito no Mercado Pago).
export function RemoveSaleButton({
  bookingId,
  name,
}: {
  bookingId: string;
  name: string;
}) {
  return (
    <form
      action={removerVenda}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Remover a venda de ${name}?\n\nIsso libera a vaga imediatamente. NÃO estorna o pagamento — faça o estorno no Mercado Pago, se necessário.`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <button
        type="submit"
        className="admin-remove-btn"
        aria-label={`Remover venda de ${name}`}
      >
        Remover
      </button>
    </form>
  );
}
