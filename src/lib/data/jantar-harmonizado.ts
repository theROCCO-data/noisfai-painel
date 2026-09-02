import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .select("id, nome, titulo, valor_pessoa, data_evento, ativo, imagem_url")
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
  };
}

export type PreReservaJH = {
  id: number;
  nome: string;
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
    .select("id, nome, pessoas, data, status_pagamento, comprovante_url, canal")
    .ilike("objetivo", "%harmonizado%")
    .neq("status", "cancelado")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getPreReservasJH: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id,
    nome: r.nome,
    pessoas: r.pessoas,
    data: r.data,
    statusPagamento: r.status_pagamento ?? "pendente",
    comprovanteUrl: r.comprovante_url,
    canal: r.canal ?? "online",
  }));
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
