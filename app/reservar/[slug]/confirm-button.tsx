"use client";

import { useActionState } from "react";
import { confirmarReserva, type ReservaState } from "./actions";

export function ConfirmReserva({
  slug,
  isFull,
}: {
  slug: string;
  isFull: boolean;
}) {
  const [state, formAction, pending] = useActionState<ReservaState, FormData>(
    confirmarReserva,
    null,
  );

  if (isFull) {
    return (
      <button className="cta-btn" disabled aria-disabled>
        Esgotado
      </button>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="slug" value={slug} />
      <button className="cta-btn" type="submit" disabled={pending}>
        {pending ? "Confirmando…" : "Confirmar reserva"}
        {!pending && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        )}
      </button>
      {state?.error && (
        <p className="reservar-subtitle" style={{ marginTop: 12, marginBottom: 0, color: "var(--accent)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
