"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaffUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/data/reservas-actions";

const CARGOS_PODEM_REMOVER = ["desenvolvedor", "proprietário", "proprietario", "gerente"];

export type ConvidarResult = ActionResult & { senhaTemporaria?: string };

export async function convidarUsuario(formData: FormData): Promise<ConvidarResult> {
  const email = String(formData.get("email") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim() || "Equipe";

  if (!email || !nome) return { ok: false, error: "Nome e e-mail são obrigatórios." };

  const supabase = createAdminClient();
  const senhaTemporaria = randomBytes(9).toString("base64url");

  const { error } = await supabase.auth.admin.createUser({
    email,
    password: senhaTemporaria,
    email_confirm: true,
    user_metadata: { nome, cargo },
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/configuracoes");
  return { ok: true, senhaTemporaria };
}

export async function excluirUsuario(id: string): Promise<ActionResult> {
  // reforço no servidor, não só na UI: só desenvolvedor/proprietário/gerente
  // pode remover usuários, e ninguém remove a própria conta por essa tela.
  const staff = await getCurrentStaffUser();
  if (!staff || !CARGOS_PODEM_REMOVER.includes(staff.role.toLowerCase())) {
    return { ok: false, error: "Sem permissão pra remover usuários." };
  }
  if (staff.id === id) {
    return { ok: false, error: "Você não pode remover a própria conta por aqui." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracoes");
  return { ok: true };
}
