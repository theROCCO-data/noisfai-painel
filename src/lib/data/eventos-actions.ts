"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/data/reservas-actions";

export type CriarEventoInput = {
  nome: string;
  telefone: string;
  cpf: string;
  email: string;
  nomeEvento: string;
  tipo: string;
  data: string;
  horario: string;
  pessoas: number;
  valor: string;
  observacao: string;
};

export async function criarEventoManual(input: CriarEventoInput): Promise<ActionResult> {
  const supabase = createAdminClient();

  if (!input.nome || !input.telefone) return { ok: false, error: "Nome e telefone do cliente são obrigatórios." };
  if (!input.nomeEvento) return { ok: false, error: "Dê um nome para o evento." };
  if (!input.data) return { ok: false, error: "Escolha a data do evento." };
  if (input.pessoas < 1) return { ok: false, error: "Número de pessoas inválido." };

  // mesmo padrão de "não sobrescrever cliente já existente" usado em
  // criarReservaManual — telefone é a chave de identidade.
  const { data: clienteExistente, error: buscaErr } = await supabase
    .from("clientes")
    .select("id")
    .eq("telefone", input.telefone)
    .maybeSingle();
  if (buscaErr) return { ok: false, error: `Erro ao checar cliente: ${buscaErr.message}` };

  let clienteId = clienteExistente?.id;
  if (!clienteId) {
    const { data: novoCliente, error: criarErr } = await supabase
      .from("clientes")
      .insert({ nome: input.nome, telefone: input.telefone, cpf: input.cpf || null, email: input.email || null })
      .select("id")
      .single();
    if (criarErr) return { ok: false, error: `Erro ao criar cliente: ${criarErr.message}` };
    clienteId = novoCliente.id;
  }

  const { error } = await supabase.from("eventos_reservas").insert({
    cliente_id: clienteId,
    nome_evento: input.nomeEvento,
    tipo: input.tipo || null,
    data: input.data,
    horario: input.horario || null,
    pessoas: input.pessoas,
    valor: input.valor ? Number(input.valor) : null,
    observacao: input.observacao || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/eventos");
  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}

export async function atualizarStatusEvento(eventoId: number, status: "pendente" | "confirmado" | "cancelado"): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: evento, error: buscaErr } = await supabase.from("eventos_reservas").select("cliente_id").eq("id", eventoId).maybeSingle();
  if (buscaErr) return { ok: false, error: buscaErr.message };

  const { error } = await supabase.from("eventos_reservas").update({ status }).eq("id", eventoId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/eventos");
  if (evento) revalidatePath(`/clientes/${evento.cliente_id}`);
  return { ok: true };
}
