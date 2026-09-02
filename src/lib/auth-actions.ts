"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

async function origemDoSite() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocolo = h.get("x-forwarded-proto") ?? "https";
  return `${protocolo}://${host}`;
}

export async function signIn(formData: FormData): Promise<{ error: string } | void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/inicio");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Email ou senha incorretos." };

  redirect(redirectTo || "/inicio");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Sempre responde "ok" mesmo se o e-mail não existir — não dá pra deixar
 * alguém descobrir quais e-mails têm conta só tentando redefinir a senha.
 */
export async function solicitarResetSenha(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Informe seu e-mail primeiro." };

  const supabase = await createClient();
  const origem = await origemDoSite();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origem}/auth/confirm?next=/redefinir-senha`,
  });

  return { ok: true };
}

export async function redefinirSenha(formData: FormData): Promise<{ error: string } | void> {
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

  if (senha.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (senha !== confirmarSenha) return { error: "As senhas não coincidem." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Link expirado ou inválido. Peça um novo em \"Esqueceu sua senha?\"." };

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { error: error.message };

  redirect("/inicio");
}
