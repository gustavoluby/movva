"use server";

import { createClient } from "@/lib/supabase/server";

export type ResetState = { ok?: boolean; sent?: boolean; error?: string };

// Passo 1: dispara o email com o código de recuperação.
// (Pré-setado: só chega quando o email do Supabase estiver configurado.)
export async function requestReset(email: string): Promise<ResetState> {
  const e = email.trim().toLowerCase();
  if (!e || !e.includes("@")) return { error: "Coloca um email válido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(e);
  if (error) return { error: error.message };
  return { sent: true };
}

// Passo 2: verifica o código (cria sessão de recuperação) e define a nova senha.
export async function confirmReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<ResetState> {
  const e = email.trim().toLowerCase();
  const token = code.trim();
  if (!token) return { error: "Coloca o código que chegou no email." };
  if (newPassword.length < 6) {
    return { error: "A senha precisa ter pelo menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { error: otpErr } = await supabase.auth.verifyOtp({
    email: e,
    token,
    type: "recovery",
  });
  if (otpErr) return { error: otpErr.message };

  const { error: passErr } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (passErr) return { error: passErr.message };

  return { ok: true };
}
