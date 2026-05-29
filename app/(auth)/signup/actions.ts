"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils/safe-next";
import { sendWelcomeEmail } from "@/lib/email/notifications";
import type { AuthState } from "../login/actions";

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const next = safeNext(formData.get("next")?.toString());

  if (!email || !password || !fullName) {
    return { error: "Preenche nome, email e senha" };
  }
  if (password.length < 6) {
    return { error: "Senha precisa ter pelo menos 6 caracteres" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return { error: "Esse email já tem conta. Vai pra Entrar." };
    }
    return { error: error.message };
  }

  // Boas-vindas (não quebra o signup — sendWelcomeEmail trata erro internamente).
  await sendWelcomeEmail({ email, fullName });

  // Email confirmation está OFF → sessão já criada no signUp, redireciona.
  redirect(next);
}
