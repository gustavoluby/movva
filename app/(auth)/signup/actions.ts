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
  const phone = String(formData.get("phone") ?? "").trim();
  const next = safeNext(formData.get("next")?.toString());

  if (!email || !password || !fullName || !phone) {
    return { error: "Preenche nome, email, WhatsApp e senha" };
  }
  // Pelo menos 10 dígitos (DDD + número). Aceita máscara/espaços.
  if (phone.replace(/\D/g, "").length < 10) {
    return { error: "Coloca um WhatsApp válido com DDD" };
  }
  if (password.length < 6) {
    return { error: "Senha precisa ter pelo menos 6 caracteres" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return { error: "Esse email já tem conta. Vai pra Entrar." };
    }
    return { error: error.message };
  }

  // Supabase NÃO dá erro em signup de email já existente (anti-enumeração):
  // devolve um user "fantasma" com identities vazio. É assim que detectamos
  // a conta duplicada — senão o cadastro "passa" sem reclamar.
  if (!data.user || (data.user.identities?.length ?? 0) === 0) {
    return { error: "Esse email já tem conta. Vai pra Entrar." };
  }

  // O trigger handle_new_user cria o profile só com nome/handle; gravamos o
  // WhatsApp aqui (sessão já ativa → RLS "atualize só seu perfil" permite).
  await supabase.from("profiles").update({ phone }).eq("id", data.user.id);

  // Boas-vindas (não quebra o signup — sendWelcomeEmail trata erro internamente).
  await sendWelcomeEmail({ email, fullName });

  // Email confirmation está OFF → sessão já criada no signUp, redireciona.
  // O `novo=1` é o recado pro Meta Pixel: o tracker no layout lê, dispara o
  // CompleteRegistration e limpa o parâmetro da URL.
  const destino = new URL(next, "http://local");
  destino.searchParams.set("novo", "1");
  redirect(`${destino.pathname}${destino.search}${destino.hash}`);
}
