import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStatusHumanoEmLote } from "@/lib/data/status-humano";
import { formatTelefoneBR } from "@/lib/format";

function hojeISO() {
  // horário de Brasília, não UTC — importante pra "hoje" bater com o que o gerente vê
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export type ReservaHoje = {
  id: number;
  horario: string;
  nome: string;
  pessoas: number;
  status: string;
};

export async function getReservasHoje() {
  const supabase = createAdminClient();
  const data = hojeISO();

  const { data: reservas, error } = await supabase
    .from("reservas")
    .select("id, horario, nome, pessoas, status, turno")
    .eq("data", data)
    .neq("status", "cancelado")
    .order("horario", { ascending: true });

  if (error) throw new Error(`getReservasHoje: ${error.message}`);

  const almoco = reservas.filter((r) => r.turno === "almoco").length;
  const jantar = reservas.filter((r) => r.turno === "jantar").length;

  return {
    total: reservas.length,
    almoco,
    jantar,
    lista: reservas as ReservaHoje[],
  };
}

export async function getConversasIniciadasHoje() {
  const supabase = createAdminClient();
  const inicio = `${hojeISO()}T00:00:00-03:00`;

  const { count, error } = await supabase
    .from("chats")
    .select("id", { count: "exact", head: true })
    .gte("created_at", inicio);

  if (error) throw new Error(`getConversasIniciadasHoje: ${error.message}`);
  return count ?? 0;
}

export async function getReservasFeitasHoje() {
  const supabase = createAdminClient();
  const inicio = `${hojeISO()}T00:00:00-03:00`;

  const { count, error } = await supabase
    .from("reservas")
    .select("id", { count: "exact", head: true })
    .gte("created_at", inicio)
    .neq("status", "cancelado");

  if (error) throw new Error(`getReservasFeitasHoje: ${error.message}`);
  return count ?? 0;
}

export async function getVagasHoje() {
  const supabase = createAdminClient();
  const data = hojeISO();

  const { data: capacidade, error } = await supabase
    .from("capacidade_turno")
    .select("capacidade_bot, disponivel_atual")
    .eq("data", data)
    .eq("turno", "dia")
    .maybeSingle();

  if (error) throw new Error(`getVagasHoje: ${error.message}`);

  return {
    disponivel: capacidade?.disponivel_atual ?? 0,
    total: capacidade?.capacidade_bot ?? 0,
  };
}

export type PagamentoPendente = {
  id: number;
  nome: string;
  pessoas: number;
  valorEsperado: number;
  criadoEm: string;
  comprovanteUrl: string | null;
};

/**
 * Heurística: reservas do Jantar Harmonizado são identificadas pelo campo
 * `objetivo` (não há FK direta pra eventos_especiais no schema atual).
 * TODO: confirmar o valor exato que o workflow n8n grava em `objetivo`
 * assim que houver reservas reais do evento pra conferir.
 */
export async function getPagamentosPendentesJH(): Promise<PagamentoPendente[]> {
  const supabase = createAdminClient();

  const [{ data: reservas, error }, { data: evento }] = await Promise.all([
    supabase
      .from("reservas")
      .select("id, nome, pessoas, created_at, status_pagamento, comprovante_url, objetivo")
      .ilike("objetivo", "%harmonizado%")
      .eq("status_pagamento", "pendente")
      .order("created_at", { ascending: true }),
    supabase
      .from("eventos_especiais")
      .select("valor_pessoa")
      .eq("nome", "Jantar Harmonizado")
      .eq("ativo", true)
      .maybeSingle(),
  ]);

  if (error) throw new Error(`getPagamentosPendentesJH: ${error.message}`);

  const valorPessoa = evento?.valor_pessoa ?? 0;

  return (reservas ?? []).map((r) => ({
    id: r.id,
    nome: r.nome,
    pessoas: r.pessoas,
    valorEsperado: valorPessoa * r.pessoas,
    criadoEm: r.created_at,
    comprovanteUrl: r.comprovante_url,
  }));
}

export type ConversaHumana = {
  conversationId: string;
  telefone: string;
  telefoneFormatado: string;
  ultimaMensagem: string;
};

export async function getConversasComHumano(): Promise<ConversaHumana[]> {
  const supabase = createAdminClient();

  const { data: chats, error } = await supabase.from("chats").select("conversation_id, phone");
  if (error) throw new Error(`getConversasComHumano: ${error.message}`);
  if (!chats || chats.length === 0) return [];

  const statusPorTelefone = await getStatusHumanoEmLote(chats.map((c) => c.phone));
  const comHumano = chats.filter((c) => statusPorTelefone.get(c.phone) === "atencao");
  if (comHumano.length === 0) return [];

  const { data: msgs } = await supabase
    .from("chat_messages")
    .select("conversation_id, user_message, bot_message, created_at")
    .in("conversation_id", comHumano.map((c) => c.conversation_id))
    .order("created_at", { ascending: false });

  const ultimaPorConversa = new Map<string, string>();
  for (const m of msgs ?? []) {
    if (!ultimaPorConversa.has(m.conversation_id)) {
      ultimaPorConversa.set(m.conversation_id, m.user_message || m.bot_message || "");
    }
  }

  return comHumano.map((c) => ({
    conversationId: c.conversation_id,
    telefone: c.phone,
    telefoneFormatado: formatTelefoneBR(c.phone),
    ultimaMensagem: ultimaPorConversa.get(c.conversation_id) ?? "",
  }));
}

export function formatTempoDecorrido(isoDate: string): { texto: string; atrasado: boolean } {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const atrasado = diffMin >= 60;

  if (diffMin < 60) return { texto: `${diffMin} min`, atrasado };
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return { texto: `${h}h ${String(m).padStart(2, "0")}min`, atrasado };
}
