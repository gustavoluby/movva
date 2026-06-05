"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { createCheckin, type CheckinState } from "@/app/comunidade/novo/actions";

type EventOption = { id: string; title: string };

export function CheckinForm({
  events,
  defaultEventId = "",
}: {
  events: EventOption[];
  defaultEventId?: string;
}) {
  const [state, formAction, isPending] = useActionState<CheckinState, FormData>(
    createCheckin,
    {},
  );
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <form action={formAction} className="checkin-form">
      <header className="checkin-head">
        <Link href="/comunidade" className="checkin-back" aria-label="Voltar">
          ←
        </Link>
        <h1 className="checkin-title">Novo check-in</h1>
      </header>

      <button
        type="button"
        className="checkin-photo"
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="prévia" />
        ) : (
          <span className="checkin-photo-empty">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            adicionar foto
          </span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        name="photo"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onPick}
      />

      <div className="checkin-field">
        <label htmlFor="ci-loc">Onde você estava?</label>
        <input
          id="ci-loc"
          className="auth-input"
          type="text"
          name="location_name"
          placeholder="Ex.: Catedral de Curitiba, Batel..."
          autoComplete="off"
          required
        />
      </div>

      <div className="checkin-field">
        <label htmlFor="ci-text">Como foi?</label>
        <textarea
          id="ci-text"
          className="auth-input checkin-textarea"
          name="text"
          rows={4}
          placeholder="Conta pra elas como foi a experiência ✿"
        />
      </div>

      {events.length > 0 && (
        <div className="checkin-field">
          <label htmlFor="ci-event">Foi em algum evento Moodpass? (opcional)</label>
          <select
            id="ci-event"
            name="event_id"
            className="auth-input"
            defaultValue={defaultEventId}
          >
            <option value="">Nenhum / experiência avulsa</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {state?.error && <div className="auth-error">{state.error}</div>}

      <p className="checkin-note">
        Seu check-in passa por uma aprovação rápida antes de aparecer no feed.
      </p>

      <button type="submit" className="auth-submit" disabled={isPending}>
        {isPending ? "Enviando..." : "Publicar check-in"}
      </button>
    </form>
  );
}
