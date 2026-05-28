"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "./actions";
import type { AuthState } from "../login/actions";

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
        <label htmlFor="signup-password">Senha</label>
        <input
          id="signup-password"
          className="auth-input"
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>

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
