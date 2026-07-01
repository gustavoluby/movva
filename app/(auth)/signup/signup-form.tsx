"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signupAction } from "./actions";
import type { AuthState } from "../login/actions";
import { PasswordField } from "../password-field";

// Máscara (XX) XXXXX-XXXX enquanto digita; limita a 11 dígitos. O server strippa
// não-dígitos, então o valor mascarado é submetido normalmente.
function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function SignupForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signupAction,
    null,
  );

  const [phone, setPhone] = useState("");

  return (
    <form action={formAction} className="auth-form">
      <h1 className="auth-title">Criar conta</h1>
      <p className="auth-subtitle">
        Conta rápida pra você reservar sua vaga.
      </p>

      <input type="hidden" name="next" value={next} />

      <div className="auth-field">
        <label htmlFor="signup-name">Seu nome</label>
        <input
          id="signup-name"
          className="auth-input"
          type="text"
          name="full_name"
          autoComplete="name"
          autoFocus
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          className="auth-input"
          type="email"
          name="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="signup-phone">WhatsApp</label>
        <input
          id="signup-phone"
          className="auth-input"
          type="tel"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(41) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          required
        />
      </div>

      <PasswordField
        id="signup-password"
        autoComplete="new-password"
        minLength={6}
      />

      {state?.error && <div className="auth-error">{state.error}</div>}

      <button type="submit" className="auth-submit" disabled={isPending}>
        {isPending ? "Criando conta..." : "Criar conta"}
      </button>

      <div className="auth-switch">
        já tem conta?{" "}
        <Link
          href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
        >
          entrar
        </Link>
      </div>
    </form>
  );
}
