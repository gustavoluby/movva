"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EmailState = { ok?: boolean; sent?: boolean; error?: string };

// Passo 1: pede a troca → Supabase envia um código pro NOVO email.
// (Pré-setado: só chega quando o email/SMTP do Supabase estiver configurado.)
export async function requestEmailChange(newEmail: string): Promise<EmailState> {
  const email = newEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Coloca um email válido." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };
  return { sent: true };
}

// Passo 2: confirma o código (OTP) enviado pro novo email.
export async function confirmEmailChange(
  newEmail: string,
  code: string,
): Promise<EmailState> {
  const email = newEmail.trim().toLowerCase();
  const token = code.trim();
  if (!token) return { error: "Coloca o código que chegou no email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email_change",
  });
  if (error) return { error: error.message };

  revalidatePath("/perfil/dados");
  revalidatePath("/perfil");
  return { ok: true };
}
