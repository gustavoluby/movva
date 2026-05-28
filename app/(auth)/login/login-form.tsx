"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={formAction} className="auth-form">
      <h1 className="auth-title">Entrar</h1>
      <p className="auth-subtitle">Continua de onde parou.</p>

      <input type="hidden" name="next" value={next} />

      <div className="auth-field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          className="auth-input"
          type="email"
          name="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="login-password">Senha</label>
        <input
          id="login-password"
          className="auth-input"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.error && <div className="auth-error">{state.error}</div>}

      <button type="submit" className="auth-submit" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </button>

      <div className="auth-switch">
        ainda não tem conta?{" "}
        <Link
          href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
        >
          criar conta
        </Link>
      </div>
    </form>
  );
}
