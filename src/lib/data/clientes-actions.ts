"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/data/reservas-actions";

export type CriarClienteInput = {
  nome: string;
  telefone: string;
  cpf: string;
  email: string;
};

/**
 * Cadastro manual de cliente pelo balcão (fora do fluxo de reserva).
 * Diferente do upsert usado em `criarReservaManual`, aqui é sempre um
 * registro novo — se o telefone já existir, erro (o operador deve achar o
 * cliente existente em vez de duplicar).
 */
export async function criarClienteManual(input: CriarClienteInput): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: existente } = await supabase
    .from("clientes")
    .select("id")
    .eq("telefone", input.telefone)
    .maybeSingle();
  if (existente) return { ok: false, error: "Já existe um cliente com esse telefone." };

  const { error } = await supabase.from("clientes").insert({
    nome: input.nome,
    telefone: input.telefone,
    cpf: input.cpf || null,
    email: input.email || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/clientes");
  return { ok: true };
}

export type EditarClienteInput = {
  nome: string;
  telefone: string;
  cpf: string;
  email: string;
};

/**
 * Edição explícita do cadastro do cliente — diferente das ações de
 * reserva (`criarReservaManual`, `atualizarReserva` etc.), que
 * propositalmente NUNCA tocam em `clientes` pra não sobrescrever o
 * cadastro com um nome dado numa reserva específica. Aqui é o contrário:
 * o usuário decidiu editar o cliente de propósito, então atualiza direto.
 */
export async function editarCliente(clienteId: number, input: EditarClienteInput): Promise<ActionResult> {
  if (!input.nome.trim() || !input.telefone.trim()) {
    return { ok: false, error: "Nome e telefone são obrigatórios." };
  }

  const supabase = createAdminClient();

  const { data: outroComMesmoTelefone } = await supabase
    .from("clientes")
    .select("id")
    .eq("telefone", input.telefone)
    .neq("id", clienteId)
    .maybeSingle();
  if (outroComMesmoTelefone) {
    return { ok: false, error: "Já existe outro cliente cadastrado com esse telefone." };
  }

  const { error } = await supabase
    .from("clientes")
    .update({
      nome: input.nome.trim(),
      telefone: input.telefone.trim(),
      cpf: input.cpf.trim() || null,
      email: input.email.trim() || null,
    })
    .eq("id", clienteId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}
