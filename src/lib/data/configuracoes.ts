import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type PerfilRestauranteBasico = {
  nome: string | null;
  endereco: string | null;
  telefone: string | null;
  horarioFuncionamento: string | null;
  sobre: string | null;
  siteUrl: string | null;
  ifoodUrl: string | null;
  cardapioDigitalUrl: string | null;
  outrasUnidades: string | null;
  espacoEventosInfo: string | null;
};

export async function getConfiguracoes(): Promise<{ logoUrl: string | null } & PerfilRestauranteBasico> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("configuracoes_painel")
    .select(
      "logo_url, nome, endereco, telefone, horario_funcionamento, sobre, site_url, ifood_url, cardapio_digital_url, outras_unidades, espaco_eventos_info"
    )
    .eq("id", 1)
    .maybeSingle();

  return {
    logoUrl: data?.logo_url ?? null,
    nome: data?.nome ?? null,
    endereco: data?.endereco ?? null,
    telefone: data?.telefone ?? null,
    horarioFuncionamento: data?.horario_funcionamento ?? null,
    sobre: data?.sobre ?? null,
    siteUrl: data?.site_url ?? null,
    ifoodUrl: data?.ifood_url ?? null,
    cardapioDigitalUrl: data?.cardapio_digital_url ?? null,
    outrasUnidades: data?.outras_unidades ?? null,
    espacoEventosInfo: data?.espaco_eventos_info ?? null,
  };
}
