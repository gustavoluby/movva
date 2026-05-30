"use client";

import { useState, useTransition } from "react";
import {
  requestEmailChange,
  confirmEmailChange,
} from "@/app/perfil/dados/email-actions";

type Step = "idle" | "email" | "code" | "done";

export function EmailChange({ currentEmail }: { currentEmail: string }) {
  const [step, setStep] = useState<Step>("idle");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setError(null);
    startTransition(async () => {
      const res = await requestEmailChange(newEmail);
      if (res.error) setError(res.error);
      else setStep("code");
    });
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await confirmEmailChange(newEmail, code);
      if (res.error) setError(res.error);
      else setStep("done");
    });
  }

  return (
    <div className="dados-field">
      <label>Email</label>
      <div className="dados-readonly">{currentEmail}</div>

      {step === "idle" && (
        <button
          type="button"
          className="dados-link-btn"
          onClick={() => setStep("email")}
        >
          Alterar email
        </button>
      )}

      {step === "email" && (
        <div className="dados-flow">
          <input
            className="auth-input"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="novo@email.com"
            autoComplete="off"
          />
          {error && <div className="auth-error">{error}</div>}
          <div className="dados-flow-actions">
            <button
              type="button"
              className="dados-cancel"
              onClick={() => setStep("idle")}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="auth-submit dados-submit"
              onClick={send}
              disabled={pending || !newEmail.trim()}
            >
              {pending ? "Enviando..." : "Enviar código"}
            </button>
          </div>
        </div>
      )}

      {step === "code" && (
        <div className="dados-flow">
          <p className="dados-hint">
            Enviamos um código pra <strong>{newEmail}</strong>. Cola ele aqui:
          </p>
          <input
            className="auth-input"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="código de 6 dígitos"
            autoComplete="one-time-code"
          />
          {error && <div className="auth-error">{error}</div>}
          <div className="dados-flow-actions">
            <button
              type="button"
              className="dados-cancel"
              onClick={() => setStep("idle")}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="auth-submit dados-submit"
              onClick={confirm}
              disabled={pending || !code.trim()}
            >
              {pending ? "Confirmando..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="profile-saved">
          Email atualizado pra {newEmail} ✦
        </div>
      )}
    </div>
  );
}
