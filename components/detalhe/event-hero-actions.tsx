"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { toggleSave, type SaveState } from "@/app/eventos/[slug]/actions";

export function EventHeroActions({
  slug,
  title,
  loggedIn,
  initialSaved,
}: {
  slug: string;
  title: string;
  loggedIn: boolean;
  initialSaved: boolean;
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    toggleSave,
    { saved: initialSaved },
  );
  const saved = state.saved;
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/eventos/${slug}`;
    // No celular abre a folha de compartilhamento nativa (WhatsApp etc.);
    // no desktop cai pra copiar o link.
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `Olha esse evento no Movva: ${title}`, url });
        return;
      } catch {
        // usuária cancelou ou share falhou — tenta copiar.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // último recurso: prompt pra copiar manualmente.
      window.prompt("Copie o link do evento:", url);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        className="hero-btn"
        aria-label="Compartilhar"
        onClick={share}
      >
        {copied ? (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        )}
      </button>

      {loggedIn ? (
        <form action={formAction}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="saved" value={saved ? "true" : "false"} />
          <button
            type="submit"
            className="hero-btn"
            aria-label={saved ? "Remover dos salvos" : "Salvar"}
            aria-pressed={saved}
            disabled={pending}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </form>
      ) : (
        <Link
          href={`/login?next=/eventos/${slug}`}
          className="hero-btn"
          aria-label="Salvar"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </Link>
      )}
    </div>
  );
}
