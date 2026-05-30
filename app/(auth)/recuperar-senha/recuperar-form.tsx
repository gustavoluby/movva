"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { requestReset, confirmReset } from "./actions";

type Step = "email" | "code";

export function RecuperarForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setError(null);
    startTransition(async () => {
      const res = await requestReset(email);
      if (res.error) setError(res.error);
      else setStep("code");
    });
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await confirmReset(email, code, password);
      if (res.error) setError(res.error);
      else router.push("/");
    });
  }

  if (step === "email") {
    return (
      <div className="auth-form">
        <h1 className="auth-title">Recuperar senha</h1>
        <p className="auth-subtitle">
          Te enviamos um código pra redefinir sua senha.
        </p>

        <div className="auth-field">
          <label htmlFor="rs-email">Email</label>
          <input
            id="rs-email"
            className="auth-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button
          type="button"
          className="auth-submit"
          onClick={send}
          disabled={pending || !email.trim()}
        >
          {pending ? "Enviando..." : "Enviar código"}
        </button>

        <div className="auth-switch">
          lembrou? <Link href="/login">voltar pro login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h1 className="auth-title">Nova senha</h1>
      <p className="auth-subtitle">
        Enviamos um código pra <strong>{email}</strong>. Cola ele e escolhe a
        nova senha.
      </p>

      <div className="auth-field">
        <label htmlFor="rs-code">Código</label>
        <input
          id="rs-code"
          className="auth-input"
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="código de 6 dígitos"
          autoComplete="one-time-code"
          autoFocus
        />
      </div>

      <div className="auth-field">
        <label htmlFor="rs-password">Nova senha</label>
        <input
          id="rs-password"
          className="auth-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
        />
      </div>

      {error && <div className="auth-error">{error}</div>}

      <button
        type="button"
        className="auth-submit"
        onClick={confirm}
        disabled={pending || !code.trim() || !password}
      >
        {pending ? "Salvando..." : "Salvar nova senha"}
      </button>

      <div className="auth-switch">
        <button type="button" className="auth-linkish" onClick={() => setStep("email")}>
          reenviar código
        </button>
      </div>
    </div>
  );
}
