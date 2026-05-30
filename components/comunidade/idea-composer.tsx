"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createIdea, type IdeaState } from "@/app/comunidade/ideias/actions";

const MAX_LEN = 280;

// Caixa pra postar uma ideia (estilo tweet) com escolha de anonimato.
export function IdeaComposer() {
  const [state, formAction, pending] = useActionState<IdeaState, FormData>(
    createIdea,
    {},
  );
  const [text, setText] = useState("");
  const [justSent, setJustSent] = useState(false);
  const wasPending = useRef(false);

  const error = state?.error;

  // Quando a action termina (pending true→false) sem erro: limpa e confirma.
  useEffect(() => {
    if (wasPending.current && !pending) {
      if (!error) {
        setText("");
        setJustSent(true);
      }
    }
    wasPending.current = pending;
  }, [pending, error]);

  return (
    <form action={formAction} className="idea-composer">
      <textarea
        name="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (justSent) setJustSent(false);
        }}
        placeholder="E se a gente... ? Joga a ideia pra ver quem topa ✿"
        className="idea-composer-input"
        maxLength={MAX_LEN}
        rows={3}
      />
      <div className="idea-composer-row">
        <label className="idea-anon-toggle">
          <input type="checkbox" name="anonymous" defaultChecked />
          <span>Postar anônima</span>
        </label>
        <button
          type="submit"
          className="idea-post-btn"
          disabled={pending || !text.trim()}
        >
          {pending ? "Postando…" : "Postar ideia"}
        </button>
      </div>
      {error && <div className="auth-error">{error}</div>}
      {justSent && (
        <div className="checkin-sent" style={{ margin: "8px 0 0" }}>
          Sua ideia foi enviada pra aprovação ✦ Em breve ela aparece aqui.
        </div>
      )}
      <div className="idea-anon-hint">
        Anônima dá coragem de propor. Depois, se bombar, você revela seu perfil ✿
      </div>
    </form>
  );
}
