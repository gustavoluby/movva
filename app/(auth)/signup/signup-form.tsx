"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "./actions";
import type { AuthState } from "../login/actions";
import { PasswordField } from "../password-field";

export function SignupForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signupAction,
    null,
  );

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
