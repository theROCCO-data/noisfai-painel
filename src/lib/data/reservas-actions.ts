"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type CriarReservaInput = {
  nome: string;
  telefone: string;
  cpf: string;
  email: string;
  data: string;
  horario: string;
  turno: "almoco" | "jantar";
  pessoas: number;
  objetivo: string;
  canal: "online" | "presencial";
  observacao: string;
  /** null = Chatbot IA (mesma convenção usada em toda reserva feita pelo bot) */
  responsavelUserId: string | null;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Cria uma reserva manual (walk-in / telefone) pelo painel.
 * IMPORTANTE: usa a MESMA RPC `reservar_lugares` que o bot usa via n8n,
 * pra não duplicar a lógica de capacidade em dois lugares.
 *
 * Ressalva conhecida: a chamada da RPC (decrementa capacidade) e o INSERT
 * em `reservas` são duas operações separadas, não uma transação única —
 * se o INSERT falhar depois da RPC ter sucesso, a vaga fica descontada
 * sem reserva correspondente. Risco baixo (mesmo padrão que outros pontos
 * do sistema), mas o ideal a médio prazo é uma RPC única que faça as duas
 * coisas atomicamente. Registrado como próxima melhoria.
 */
export async function criarReservaManual(input: CriarReservaInput): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: capacidade, error: capErr } = await supabase
    .from("capacidade_turno")
    .select("id, disponivel_atual")
    .eq("data", input.data)
    .eq("turno", "dia")
    .maybeSingle();

  if (capErr) return { ok: false, error: `Erro ao checar capacidade: ${capErr.message}` };
  if (!capacidade) return { ok: false, error: "Não há capacidade cadastrada para essa data." };
  if (capacidade.disponivel_atual < input.pessoas) {
    return { ok: false, error: `Só há ${capacidade.disponivel_atual} vaga(s) disponível(is) nesse dia.` };
  }

  const { error: rpcErr } = await supabase.rpc("reservar_lugares", {
    p_capacidade_id: capacidade.id,
    p_pessoas: input.pessoas,
  });
  if (rpcErr) return { ok: false, error: `Erro ao reservar vagas: ${rpcErr.message}` };

  // Só cria um cliente novo se esse telefone ainda não existir — se já
  // existir, reaproveita o cadastro tal como está. O nome dado aqui fica só
  // nessa reserva (reservas.nome, abaixo), não sobrescreve o cadastro
  // mestre: telefone é a chave de identidade, não o nome — quem liga de
  // novo pode dar um nome diferente (apelido, quem atendeu o telefone
  // dessa vez etc.) sem isso "corrigir" o cliente já cadastrado.
  const { data: clienteExistente, error: buscaErr } = await supabase
    .from("clientes")
    .select("id")
    .eq("telefone", input.telefone)
    .maybeSingle();
  if (buscaErr) return { ok: false, error: `Erro ao checar cliente: ${buscaErr.message}` };

  let clienteId: number;
  if (clienteExistente) {
    clienteId = clienteExistente.id;
  } else {
    const { data: novoCliente, error: clienteErr } = await supabase
      .from("clientes")
      .insert({ telefone: input.telefone, nome: input.nome, cpf: input.cpf || null, email: input.email || null })
      .select("id")
      .single();
    if (clienteErr) return { ok: false, error: `Erro ao gravar cliente: ${clienteErr.message}` };
    clienteId = novoCliente.id;
  }

  const { error: insertErr } = await supabase.from("reservas").insert({
    cliente_id: clienteId,
    nome: input.nome,
    telefone: input.telefone,
    cpf: input.cpf || null,
    email: input.email || null,
    data: input.data,
    horario: input.horario,
    turno: input.turno,
    pessoas: input.pessoas,
    objetivo: input.objetivo || null,
    status: "confirmada",
    origem_alteracao: "painel",
    canal: input.canal,
    observacao: input.observacao || null,
    responsavel_user_id: input.responsavelUserId,
  });

  if (insertErr) {
    // best-effort: devolve a vaga diretamente, já que não há reserva pra usar cancelar_reserva
    await supabase
      .from("capacidade_turno")
      .update({ disponivel_atual: capacidade.disponivel_atual })
      .eq("id", capacidade.id);
    return { ok: false, error: `Vaga reservada mas falhou ao gravar a reserva: ${insertErr.message}. Avise o suporte.` };
  }

  revalidatePath("/reservas");
  revalidatePath("/inicio");
  return { ok: true };
}

export type EditarReservaInput = {
  nome: string;
  cpf: string;
  email: string;
  horario: string;
  turno: "almoco" | "jantar";
  pessoas: number;
  objetivo: string;
  observacao: string;
  canal: "online" | "presencial";
  responsavelUserId: string | null;
};

/**
 * Edita os dados de uma reserva já existente. Telefone, data e status ficam
 * de fora de propósito: telefone é a chave usada pra casar com `clientes` e
 * com o histórico de conversas em vários lugares do painel — trocar aqui
 * quebraria esses vínculos; data e status têm fluxos próprios (cancelar
 * devolve vaga via RPC; mudar de data exigiria mover a reserva entre dois
 * dias de `capacidade_turno`, mais arriscado que vale nesta leva).
 * Pessoas É editável, e ajusta `capacidade_turno` pela diferença.
 */
export async function atualizarReserva(reservaId: number, input: EditarReservaInput): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: reserva, error: reservaErr } = await supabase
    .from("reservas")
    .select("id, data, pessoas, status, telefone")
    .eq("id", reservaId)
    .maybeSingle();
  if (reservaErr) return { ok: false, error: reservaErr.message };
  if (!reserva) return { ok: false, error: "Reserva não encontrada." };

  const diffPessoas = input.pessoas - reserva.pessoas;
  if (diffPessoas !== 0 && reserva.status !== "cancelado") {
    const { data: capacidade, error: capErr } = await supabase
      .from("capacidade_turno")
      .select("id, reservado, disponivel_atual")
      .eq("data", reserva.data)
      .eq("turno", "dia")
      .maybeSingle();
    if (capErr) return { ok: false, error: `Erro ao checar capacidade: ${capErr.message}` };
    if (!capacidade) return { ok: false, error: "Não há capacidade cadastrada pra essa data." };
    if (diffPessoas > 0 && capacidade.disponivel_atual < diffPessoas) {
      return { ok: false, error: `Só há ${capacidade.disponivel_atual} vaga(s) sobrando nesse dia.` };
    }

    const { error: capUpdateErr } = await supabase
      .from("capacidade_turno")
      .update({
        reservado: capacidade.reservado + diffPessoas,
        disponivel_atual: capacidade.disponivel_atual - diffPessoas,
      })
      .eq("id", capacidade.id);
    if (capUpdateErr) return { ok: false, error: `Erro ao ajustar capacidade: ${capUpdateErr.message}` };
  }

  // Propositalmente NÃO atualiza `clientes` aqui — nome/cpf/email dados
  // nesta edição valem só pra essa reserva (colunas abaixo, desnormalizadas
  // em `reservas`). O cadastro mestre do cliente só muda se ele for
  // realmente novo (ver `criarReservaManual`), pra não sobrescrever o nome
  // de alguém já cadastrado só porque essa reserva específica veio com um
  // nome diferente.
  const { error: updateErr } = await supabase
    .from("reservas")
    .update({
      nome: input.nome,
      cpf: input.cpf || null,
      email: input.email || null,
      horario: input.horario,
      turno: input.turno,
      pessoas: input.pessoas,
      objetivo: input.objetivo || null,
      observacao: input.observacao || null,
      canal: input.canal,
      responsavel_user_id: input.responsavelUserId,
      origem_alteracao: "painel",
    })
    .eq("id", reservaId);
  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath("/reservas");
  revalidatePath("/inicio");
  revalidatePath("/clientes");
  return { ok: true };
}

export async function cancelarReserva(reservaId: number, motivo?: string): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { error } = await supabase.rpc("cancelar_reserva", {
    p_reserva_id: reservaId,
    p_origem: "painel",
  });

  if (error) return { ok: false, error: error.message };

  if (motivo && motivo.trim()) {
    // best-effort: a reserva já foi cancelada e a vaga devolvida nesse ponto;
    // se isso falhar, o cancelamento continua válido, só o motivo não fica registrado.
    await supabase.from("reservas").update({ motivo_cancelamento: motivo.trim() }).eq("id", reservaId);
  }

  revalidatePath("/reservas");
  revalidatePath("/inicio");
  return { ok: true };
}

const STATUS_PERMITIDOS_NO_MENU = ["confirmada", "pendente", "compareceu", "nao_compareceu"];

/**
 * Muda o status pelo menu inline da tabela — não inclui "cancelado" de
 * propósito: cancelar tem fluxo próprio (devolve vaga via RPC + motivo),
 * só isso mexe em `capacidade_turno`. Marcar comparecimento é só rótulo,
 * não devolve nem consome vaga.
 */
export async function atualizarStatusReserva(reservaId: number, status: string): Promise<ActionResult> {
  if (!STATUS_PERMITIDOS_NO_MENU.includes(status)) {
    return { ok: false, error: "Status inválido." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("reservas")
    .update({ status, origem_alteracao: "painel" })
    .eq("id", reservaId)
    .neq("status", "cancelado");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/reservas");
  revalidatePath("/inicio");
  revalidatePath("/analises");
  return { ok: true };
}
