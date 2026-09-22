import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type EtapaCardapioJH = {
  titulo: string;
  vinho: string;
  prato: string;
};

export type EdicaoJH = {
  id: number;
  nome: string;
  titulo: string;
  valorPessoa: number;
  dataEvento: string;
  ativo: boolean;
  imagemUrl: string | null;
  cotaVagas: number | null;
  vagasDisponiveis: number | null;
  horaEvento: string | null;
  cardapioIntro: string | null;
  cardapioPalestrante: string | null;
  cardapioEtapas: EtapaCardapioJH[];
  regrasReserva: string | null;
};

function tituloPadrao(dataEvento: string) {
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mes = meses[new Date(dataEvento + "T00:00:00").getMonth()];
  return `Edição de ${mes}`;
}

export async function getEdicaoJH(): Promise<EdicaoJH | null> {
  const supabase = createAdminClient();

  const { data: evento, error } = await supabase
    .from("eventos_especiais")
    .select(
      "id, nome, titulo, valor_pessoa, data_evento, ativo, imagem_url, hora_evento, cardapio_intro, cardapio_palestrante, cardapio_etapas, regras_reserva"
    )
    .eq("nome", "Jantar Harmonizado")
    .maybeSingle();

  if (error) throw new Error(`getEdicaoJH: ${error.message}`);
  if (!evento) return null;

  const { data: capacidade } = await supabase
    .from("capacidade_turno")
    .select("capacidade_bot, disponivel_atual")
    .eq("turno", "jantar_harmonizado")
    .eq("data", evento.data_evento)
    .maybeSingle();

  return {
    id: evento.id,
    nome: evento.nome,
    titulo: evento.titulo || tituloPadrao(evento.data_evento),
    valorPessoa: evento.valor_pessoa,
    dataEvento: evento.data_evento,
    ativo: evento.ativo,
    imagemUrl: evento.imagem_url,
    cotaVagas: capacidade?.capacidade_bot ?? null,
    vagasDisponiveis: capacidade?.disponivel_atual ?? null,
    horaEvento: evento.hora_evento ? String(evento.hora_evento).slice(0, 5) : null,
    cardapioIntro: evento.cardapio_intro,
    cardapioPalestrante: evento.cardapio_palestrante,
    cardapioEtapas: Array.isArray(evento.cardapio_etapas) ? evento.cardapio_etapas : [],
    regrasReserva: evento.regras_reserva,
  };
}

export type PreReservaJH = {
  id: number;
  nome: string;
  telefone: string;
  cpf: string | null;
  email: string | null;
  pessoas: number;
  data: string;
  statusPagamento: string;
  comprovanteUrl: string | null;
  canal: string;
};

export async function getPreReservasJH(): Promise<PreReservaJH[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reservas")
    .select("id, nome, telefone, cpf, email, pessoas, data, status_pagamento, comprovante_url, canal")
    .ilike("objetivo", "%harmonizado%")
    .neq("status", "cancelado")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getPreReservasJH: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id,
    nome: r.nome,
    telefone: r.telefone ?? "",
    cpf: r.cpf,
    email: r.email,
    pessoas: r.pessoas,
    data: r.data,
    statusPagamento: r.status_pagamento ?? "pendente",
    comprovanteUrl: r.comprovante_url,
    canal: r.canal ?? "online",
  }));
}

export type InteresseJantarHarmonizado = {
  /** true quando o cliente já tem uma reserva de Jantar Harmonizado com
   * pagamento confirmado (e não cancelada). false = interessado, mas ainda
   * não confirmou. */
  confirmado: boolean;
};

/**
 * Quem demonstrou interesse em Jantar Harmonizado, em lote (mesmo padrão do
 * `getConfirmacoesPendentesEmLote`: recebe telefones, devolve um Map). Usado
 * pelo filtro "Jantar Harmonizado" da lista de Conversas. "Interessado" =
 * mencionou JH numa conversa (tabela `jantar_harmonizado_interesse`, gravada
 * pelo n8n a cada menção) OU já tem uma reserva de JH. `confirmado` = tem
 * reserva de JH com `status_pagamento = 'confirmado'` e não cancelada.
 */
export async function getInteresseJantarHarmonizadoEmLote(
  telefones: string[]
): Promise<Map<string, InteresseJantarHarmonizado>> {
  if (telefones.length === 0) return new Map();
  const supabase = createAdminClient();

  const [interessesRes, reservasRes] = await Promise.all([
    supabase.from("jantar_harmonizado_interesse").select("telefone").in("telefone", telefones),
    supabase
      .from("reservas")
      .select("telefone, status, status_pagamento")
      .ilike("objetivo", "%harmonizado%")
      .in("telefone", telefones),
  ]);

  const interessados = new Set<string>((interessesRes.data ?? []).map((r) => r.telefone as string));
  const confirmados = new Set<string>();
  for (const r of reservasRes.data ?? []) {
    const tel = r.telefone as string | null;
    if (!tel) continue;
    interessados.add(tel); // ter reserva de JH já conta como interesse
    if (r.status !== "cancelado" && r.status_pagamento === "confirmado") confirmados.add(tel);
  }

  const mapa = new Map<string, InteresseJantarHarmonizado>();
  for (const tel of interessados) mapa.set(tel, { confirmado: confirmados.has(tel) });
  return mapa;
}

export type EdicaoHistoricoJH = {
  id: number;
  titulo: string | null;
  valorPessoa: number;
  dataEvento: string;
  cotaVagas: number | null;
  arquivadoEm: string;
};

export async function listHistoricoJH(): Promise<EdicaoHistoricoJH[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("eventos_especiais_historico")
    .select("id, titulo, valor_pessoa, data_evento, cota_vagas, arquivado_em")
    .order("arquivado_em", { ascending: false });

  if (error) throw new Error(`listHistoricoJH: ${error.message}`);

  return (data ?? []).map((h) => ({
    id: h.id,
    titulo: h.titulo,
    valorPessoa: h.valor_pessoa,
    dataEvento: h.data_evento,
    cotaVagas: h.cota_vagas,
    arquivadoEm: h.arquivado_em,
  }));
}
