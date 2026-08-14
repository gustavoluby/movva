"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { enviarCandidatura, type CandidaturaState } from "./actions";

function SubmitButton({ reenvio }: { reenvio: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="cta-btn organizadora-submit" disabled={pending}>
      {pending
        ? "Enviando…"
        : reenvio
          ? "Enviar de novo pra análise"
          : "Enviar pra análise"}
    </button>
  );
}

export function CandidaturaForm({
  eventIdea,
  about,
  instagram,
  phone,
  reenvio = false,
}: {
  eventIdea?: string | null;
  about?: string | null;
  instagram?: string | null;
  phone?: string | null;
  /** Já mandou antes (em análise ou recusada) — muda só o rótulo do botão. */
  reenvio?: boolean;
}) {
  const [state, formAction] = useActionState<CandidaturaState, FormData>(
    enviarCandidatura,
    {},
  );

  return (
    <form action={formAction} className="organizadora-form">
      <label className="coupon-field coupon-field-wide">
        <span>Que experiência você quer fazer? *</span>
        <textarea
          name="event_idea"
          rows={5}
          defaultValue={eventIdea ?? ""}
          required
          placeholder="Um encontro de cerâmica pra oito pessoas num ateliê no Batel, com vinho e conversa…"
        />
        <span className="exp-hint">
          Vale a ideia crua: o que é, pra quem, mais ou menos onde e quantas
          pessoas.
        </span>
      </label>

      <label className="coupon-field coupon-field-wide">
        <span>Conta um pouco de você</span>
        <textarea
          name="about"
          rows={4}
          defaultValue={about ?? ""}
          placeholder="O que você faz, se já organizou algo antes…"
        />
      </label>

      <label className="coupon-field coupon-field-wide">
        <span>Instagram</span>
        <input
          name="instagram"
          defaultValue={instagram ?? ""}
          placeholder="@seuinsta"
          autoComplete="off"
        />
      </label>

      <label className="coupon-field coupon-field-wide">
        <span>WhatsApp</span>
        <input
          name="phone"
          type="tel"
          defaultValue={phone ?? ""}
          placeholder="(41) 99999-9999"
        />
        <span className="exp-hint">
          É por aqui que a gente fala com você pra combinar os detalhes.
        </span>
      </label>

      {state.error && <p className="exp-error">{state.error}</p>}

      <SubmitButton reenvio={reenvio} />
    </form>
  );
}
