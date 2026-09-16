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
