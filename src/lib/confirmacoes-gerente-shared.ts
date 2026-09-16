// Tipos/rótulos sem dependência de servidor — importável tanto por Server
// quanto Client Components (diferente de `src/lib/data/confirmacoes-gerente.ts`,
// que é `server-only` por causa do client admin do Supabase).

export type TipoConfirmacaoGerente = "grupo_grande" | "pagamento_jantar_harmonizado";

const ROTULO_TIPO: Record<TipoConfirmacaoGerente, string> = {
  grupo_grande: "Grupo grande",
  pagamento_jantar_harmonizado: "Pagamento Jantar Harmonizado",
};

export function rotuloConfirmacao(tipo: TipoConfirmacaoGerente): string {
  return ROTULO_TIPO[tipo];
}

/**
 * Dados já coletados pela IA na conversa antes de escalar pro gerente
 * (grupo acima da cota automática) — gravados como JSON dentro da coluna
 * `detalhe` pelo node `Registra Confirmacao Gerente - Grupo Grande`
 * (workflow "Logistica de Reservas"), pra o gerente só CONFIRMAR no Painel
 * em vez de digitar tudo de novo.
 */
export type DetalheGrupoGrande = {
  nome: string | null;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  data: string | null;
  horario: string | null;
  turno: "almoco" | "jantar" | null;
  pessoas: number | null;
  objetivo: string | null;
};

/**
 * Tenta ler `detalhe` como o JSON estruturado acima. Pendências antigas
 * (criadas antes dessa mudança) têm `detalhe` como texto solto (ex.: "20
 * pessoas em 2026-09-20") — nesses casos retorna null, e a UI cai de volta
 * pro botão simples de "marcar como confirmado" sem formulário.
 */
export function parseDetalheGrupoGrande(detalhe: string | null): DetalheGrupoGrande | null {
  if (!detalhe) return null;
  try {
    const dados = JSON.parse(detalhe);
    if (typeof dados !== "object" || dados === null || typeof dados.pessoas !== "number") return null;
    return {
      nome: dados.nome ?? null,
      telefone: dados.telefone ?? null,
      email: dados.email ?? null,
      cpf: dados.cpf ?? null,
      data: dados.data ?? null,
      horario: dados.horario ?? null,
      turno: dados.turno === "jantar" ? "jantar" : dados.turno === "almoco" ? "almoco" : null,
      pessoas: dados.pessoas,
      objetivo: dados.objetivo ?? null,
    };
  } catch {
    return null;
  }
}
