import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TipoConfirmacaoGerente } from "@/lib/confirmacoes-gerente-shared";

export type { TipoConfirmacaoGerente } from "@/lib/confirmacoes-gerente-shared";
export { rotuloConfirmacao } from "@/lib/confirmacoes-gerente-shared";

export type ConfirmacaoGerente = {
  id: number;
  telefone: string;
  tipo: TipoConfirmacaoGerente;
  detalhe: string | null;
  criadoEm: string;
};

/**
 * Pendências de confirmação do gerente por telefone — casos que o bot NÃO
 * decide sozinho e manda pro grupo do WhatsApp (grupo acima da cota
 * automática, ou comprovante do Jantar Harmonizado que não bateu/não deu
 * pra identificar o valor). Gravado pelo n8n (nodes "Registra Pendencia..."
 * em `Logistica de Reservas` e `Confirma Pagamento Jantar Harmonizado`),
 * lido aqui só pra exibir; "resolver" é uma ação do Painel (marcarConfirmada).
 */
export async function getConfirmacoesPendentesEmLote(telefones: string[]): Promise<Map<string, ConfirmacaoGerente>> {
  if (telefones.length === 0) return new Map();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("confirmacoes_gerente")
    .select("id, telefone, tipo, detalhe, criado_em")
    .in("telefone", telefones)
    .eq("status", "pendente")
    .order("criado_em", { ascending: false });

  const mapa = new Map<string, ConfirmacaoGerente>();
  for (const row of data ?? []) {
    // se houver mais de uma pendência pro mesmo telefone, fica só a mais
    // recente (já ordenado desc acima, primeira ocorrência vence).
    if (mapa.has(row.telefone)) continue;
    mapa.set(row.telefone, {
      id: row.id,
      telefone: row.telefone,
      tipo: row.tipo,
      detalhe: row.detalhe,
      criadoEm: row.criado_em,
    });
  }
  return mapa;
}

export async function contarConfirmacoesPendentes(): Promise<number> {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("confirmacoes_gerente")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendente");
  return count ?? 0;
}
