"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaffUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/data/reservas-actions";

const CARGOS_PRIVILEGIADOS = ["desenvolvedor", "proprietário", "proprietario", "gerente"];

export type ConvidarResult = ActionResult & { senhaTemporaria?: string };

export async function convidarUsuario(formData: FormData): Promise<ConvidarResult> {
  // reforço no servidor, não só na UI: só desenvolvedor/proprietário/gerente
  // pode criar novos usuários (e escolher o cargo deles) — sem essa checagem,
  // qualquer conta logada conseguia criar um "Desenvolvedor" novo pra si.
  const staff = await getCurrentStaffUser();
  if (!staff || !CARGOS_PRIVILEGIADOS.includes(staff.role.toLowerCase())) {
    return { ok: false, error: "Sem permissão pra convidar usuários." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim() || "Equipe";

  if (!email || !nome) return { ok: false, error: "Nome e e-mail são obrigatórios." };

  const supabase = createAdminClient();
  const senhaTemporaria = randomBytes(9).toString("base64url");

  // cargo em app_metadata (só service_role escreve) — nunca em user_metadata,
  // que o próprio usuário pode editar direto pela API do Supabase Auth.
  const { error } = await supabase.auth.admin.createUser({
    email,
    password: senhaTemporaria,
    email_confirm: true,
    user_metadata: { nome },
    app_metadata: { cargo },
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/configuracoes");
  return { ok: true, senhaTemporaria };
}

export async function excluirUsuario(id: string): Promise<ActionResult> {
  // reforço no servidor, não só na UI: só desenvolvedor/proprietário/gerente
  // pode remover usuários, e ninguém remove a própria conta por essa tela.
  const staff = await getCurrentStaffUser();
  if (!staff || !CARGOS_PRIVILEGIADOS.includes(staff.role.toLowerCase())) {
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
