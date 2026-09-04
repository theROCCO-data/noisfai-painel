"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/data/reservas-actions";
import type { EtapaCardapioJH } from "@/lib/data/jantar-harmonizado";

/** O formulário manda as etapas do cardápio serializadas num único campo JSON — mais simples do que um array de campos FormData. */
function parseCardapioFormData(formData: FormData): {
  intro: string | null;
  palestrante: string | null;
  etapas: EtapaCardapioJH[];
  regrasReserva: string | null;
} {
  const intro = String(formData.get("cardapioIntro") ?? "").trim();
  const palestrante = String(formData.get("cardapioPalestrante") ?? "").trim();
  const regrasReserva = String(formData.get("regrasReserva") ?? "").trim();
  const etapasRaw = String(formData.get("cardapioEtapas") ?? "[]");
  let etapas: EtapaCardapioJH[] = [];
  try {
    const parsed = JSON.parse(etapasRaw);
    if (Array.isArray(parsed)) {
      etapas = parsed
        .map((e) => ({ titulo: String(e?.titulo ?? "").trim(), vinho: String(e?.vinho ?? "").trim(), prato: String(e?.prato ?? "").trim() }))
        .filter((e) => e.titulo || e.vinho || e.prato);
    }
  } catch {
    // ignora — segue sem etapas se o JSON vier inválido
  }
  return { intro: intro || null, palestrante: palestrante || null, etapas, regrasReserva: regrasReserva || null };
}

export async function atualizarCardapioJH(id: number, formData: FormData): Promise<ActionResult> {
  const supabase = createAdminClient();
  const cardapio = parseCardapioFormData(formData);

  const { error } = await supabase
    .from("eventos_especiais")
    .update({
      cardapio_intro: cardapio.intro,
      cardapio_palestrante: cardapio.palestrante,
      cardapio_etapas: cardapio.etapas,
      regras_reserva: cardapio.regrasReserva,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/jantar-harmonizado");
  return { ok: true };
}

export async function atualizarEdicaoJH(formData: FormData): Promise<ActionResult> {
  const supabase = createAdminClient();

  const id = Number(formData.get("id"));
  const titulo = String(formData.get("titulo") ?? "").trim();
  const dataEvento = String(formData.get("dataEvento") ?? "");
  const horaEvento = String(formData.get("horaEvento") ?? "").trim();
  const valorPessoa = Number(formData.get("valorPessoa") ?? 0);
  const cotaVagas = Number(formData.get("cotaVagas") ?? 0);
  const ativo = formData.get("ativo") === "on";
  const imagemUrlColada = String(formData.get("imagemUrl") ?? "");
  const arquivo = formData.get("imagemArquivo");
  const cardapio = parseCardapioFormData(formData);

  // arquiva o estado ATUAL antes de sobrescrever — é isso que alimenta o
  // histórico de edições anteriores. Só existe uma linha ativa em
  // eventos_especiais (é o que o bot lê), então o histórico mora numa
  // tabela separada e não afeta essa leitura.
  const { data: antes } = await supabase
    .from("eventos_especiais")
    .select(
      "id, nome, titulo, valor_pessoa, data_evento, ativo, imagem_url, hora_evento, cardapio_intro, cardapio_palestrante, cardapio_etapas, regras_reserva"
    )
    .eq("id", id)
    .maybeSingle();
  if (antes) {
    const { data: capacidadeAntes } = await supabase
      .from("capacidade_turno")
      .select("capacidade_bot")
      .eq("turno", "jantar_harmonizado")
      .eq("data", antes.data_evento)
      .maybeSingle();
    await supabase.from("eventos_especiais_historico").insert({
      evento_id: antes.id,
      nome: antes.nome,
      titulo: antes.titulo,
      valor_pessoa: antes.valor_pessoa,
      data_evento: antes.data_evento,
      ativo: antes.ativo,
      imagem_url: antes.imagem_url,
      hora_evento: antes.hora_evento,
      cardapio_intro: antes.cardapio_intro,
      cardapio_palestrante: antes.cardapio_palestrante,
      cardapio_etapas: antes.cardapio_etapas,
      regras_reserva: antes.regras_reserva,
      cota_vagas: capacidadeAntes?.capacidade_bot ?? null,
    });
  }

  let imagemUrl = imagemUrlColada || null;

  if (arquivo instanceof File && arquivo.size > 0) {
    const extensao = arquivo.name.split(".").pop() || "jpg";
    const caminho = `jantar-harmonizado/${Date.now()}.${extensao}`;

    const { error: uploadErr } = await supabase.storage
      .from("painel-uploads")
      .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });

    if (uploadErr) return { ok: false, error: `Falha no upload da imagem: ${uploadErr.message}` };

    const { data: publicUrl } = supabase.storage.from("painel-uploads").getPublicUrl(caminho);
    imagemUrl = publicUrl.publicUrl;
  }

  const { error } = await supabase
    .from("eventos_especiais")
    .update({
      titulo: titulo || null,
      data_evento: dataEvento,
      hora_evento: horaEvento || null,
      valor_pessoa: valorPessoa,
      ativo,
      imagem_url: imagemUrl,
      cardapio_intro: cardapio.intro,
      cardapio_palestrante: cardapio.palestrante,
      cardapio_etapas: cardapio.etapas,
      regras_reserva: cardapio.regrasReserva,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  if (cotaVagas > 0) {
    const { data: existente } = await supabase
      .from("capacidade_turno")
      .select("id, capacidade_bot, reservado")
      .eq("turno", "jantar_harmonizado")
      .eq("data", dataEvento)
      .maybeSingle();

    if (existente) {
      await supabase
        .from("capacidade_turno")
        .update({ capacidade_bot: cotaVagas, disponivel_atual: cotaVagas - existente.reservado })
        .eq("id", existente.id);
    } else {
      await supabase.from("capacidade_turno").insert({
        data: dataEvento,
        turno: "jantar_harmonizado",
        capacidade_bot: cotaVagas,
        reservado: 0,
        disponivel_atual: cotaVagas,
      });
    }
  }

  revalidatePath("/jantar-harmonizado");
  revalidatePath("/inicio");
  return { ok: true };
}

/**
 * Reserva manual do Jantar Harmonizado, pelo balcão — mesmo padrão de
 * `criarReservaManual` (reservas-actions.ts), mas contra a cota de
 * `capacidade_turno` do turno 'jantar_harmonizado' em vez do pool 'dia', e
 * com upload de comprovante opcional (mesmo padrão de `atualizarEdicaoJH`).
 */
export async function criarReservaManualJH(formData: FormData): Promise<ActionResult> {
  const supabase = createAdminClient();

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const data = String(formData.get("data") ?? "");
  const pessoas = Number(formData.get("pessoas") ?? 1);
  const statusPagamento = formData.get("statusPagamento") === "confirmado" ? "confirmado" : "pendente";
  const arquivo = formData.get("comprovante");

  if (!nome || !telefone || !data) return { ok: false, error: "Nome, telefone e data são obrigatórios." };

  const { data: capacidade, error: capErr } = await supabase
    .from("capacidade_turno")
    .select("id, disponivel_atual")
    .eq("data", data)
    .eq("turno", "jantar_harmonizado")
    .maybeSingle();
  if (capErr) return { ok: false, error: `Erro ao checar capacidade: ${capErr.message}` };
  if (!capacidade) return { ok: false, error: "Não há cota de Jantar Harmonizado cadastrada pra essa data." };
  if (capacidade.disponivel_atual < pessoas) {
    return { ok: false, error: `Só há ${capacidade.disponivel_atual} vaga(s) disponível(is) nessa edição.` };
  }

  const { error: rpcErr } = await supabase.rpc("reservar_lugares", {
    p_capacidade_id: capacidade.id,
    p_pessoas: pessoas,
  });
  if (rpcErr) return { ok: false, error: `Erro ao reservar vagas: ${rpcErr.message}` };

  let comprovanteUrl: string | null = null;
  if (arquivo instanceof File && arquivo.size > 0) {
    const extensao = arquivo.name.split(".").pop() || "jpg";
    const caminho = `jantar-harmonizado-comprovantes/${Date.now()}.${extensao}`;
    const { error: uploadErr } = await supabase.storage
      .from("painel-uploads")
      .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
    if (uploadErr) return { ok: false, error: `Vaga reservada, mas falhou o upload do comprovante: ${uploadErr.message}` };
    const { data: publicUrl } = supabase.storage.from("painel-uploads").getPublicUrl(caminho);
    comprovanteUrl = publicUrl.publicUrl;
  }

  // Só cria cliente novo se o telefone ainda não existir — não sobrescreve
  // o cadastro de quem já existe (ver mesma lógica/motivo em `criarReservaManual`).
  const { data: clienteExistente, error: buscaErr } = await supabase
    .from("clientes")
    .select("id")
    .eq("telefone", telefone)
    .maybeSingle();
  if (buscaErr) return { ok: false, error: `Erro ao checar cliente: ${buscaErr.message}` };

  let clienteId: number;
  if (clienteExistente) {
    clienteId = clienteExistente.id;
  } else {
    const { data: novoCliente, error: clienteErr } = await supabase
      .from("clientes")
      .insert({ telefone, nome, cpf: cpf || null, email: email || null })
      .select("id")
      .single();
    if (clienteErr) return { ok: false, error: `Erro ao gravar cliente: ${clienteErr.message}` };
    clienteId = novoCliente.id;
  }

  const { error: insertErr } = await supabase.from("reservas").insert({
    cliente_id: clienteId,
    nome,
    telefone,
    cpf: cpf || null,
    email: email || null,
    data,
    turno: "jantar",
    pessoas,
    objetivo: "Jantar Harmonizado",
    status: "confirmada",
    status_pagamento: statusPagamento,
    comprovante_url: comprovanteUrl,
    origem_alteracao: "painel",
    canal: "presencial",
  });

  if (insertErr) {
    await supabase
      .from("capacidade_turno")
      .update({ disponivel_atual: capacidade.disponivel_atual })
      .eq("id", capacidade.id);
    return { ok: false, error: `Vaga reservada mas falhou ao gravar a reserva: ${insertErr.message}. Avise o suporte.` };
  }

  revalidatePath("/jantar-harmonizado");
  revalidatePath("/inicio");
  return { ok: true };
}

/**
 * Edita uma reserva/pré-reserva do Jantar Harmonizado já existente — mesmo
 * padrão de `atualizarReserva` (reservas-actions.ts) pro ajuste de pessoas
 * (diferença aplicada em `capacidade_turno`), mas contra o pool
 * 'jantar_harmonizado'. Comprovante é opcional: só sobrescreve o que já
 * existe se um arquivo novo for enviado.
 */
export async function editarReservaManualJH(reservaId: number, formData: FormData): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: reserva, error: reservaErr } = await supabase
    .from("reservas")
    .select("id, data, pessoas, status")
    .eq("id", reservaId)
    .maybeSingle();
  if (reservaErr) return { ok: false, error: reservaErr.message };
  if (!reserva) return { ok: false, error: "Reserva não encontrada." };

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const pessoas = Number(formData.get("pessoas") ?? 1);
  const statusPagamento = formData.get("statusPagamento") === "confirmado" ? "confirmado" : "pendente";
  const arquivo = formData.get("comprovante");

  if (!nome || !telefone) return { ok: false, error: "Nome e telefone são obrigatórios." };

  const diffPessoas = pessoas - reserva.pessoas;
  if (diffPessoas !== 0 && reserva.status !== "cancelado") {
    const { data: capacidade, error: capErr } = await supabase
      .from("capacidade_turno")
      .select("id, reservado, disponivel_atual")
      .eq("data", reserva.data)
      .eq("turno", "jantar_harmonizado")
      .maybeSingle();
    if (capErr) return { ok: false, error: `Erro ao checar capacidade: ${capErr.message}` };
    if (!capacidade) return { ok: false, error: "Não há cota de Jantar Harmonizado cadastrada pra essa data." };
    if (diffPessoas > 0 && capacidade.disponivel_atual < diffPessoas) {
      return { ok: false, error: `Só há ${capacidade.disponivel_atual} vaga(s) sobrando nessa edição.` };
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

  const update: Record<string, unknown> = {
    nome,
    telefone,
    cpf: cpf || null,
    email: email || null,
    pessoas,
    status_pagamento: statusPagamento,
    origem_alteracao: "painel",
  };

  if (arquivo instanceof File && arquivo.size > 0) {
    const extensao = arquivo.name.split(".").pop() || "jpg";
    const caminho = `jantar-harmonizado-comprovantes/${Date.now()}.${extensao}`;
    const { error: uploadErr } = await supabase.storage
      .from("painel-uploads")
      .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
    if (uploadErr) return { ok: false, error: `Falha no upload do comprovante: ${uploadErr.message}` };
    const { data: publicUrl } = supabase.storage.from("painel-uploads").getPublicUrl(caminho);
    update.comprovante_url = publicUrl.publicUrl;
  }

  const { error: updateErr } = await supabase.from("reservas").update(update).eq("id", reservaId);
  if (updateErr) return { ok: false, error: updateErr.message };

  // Propositalmente NÃO atualiza `clientes` — mesmo motivo de `atualizarReserva`
  // (reservas-actions.ts): nome dado aqui vale só pra essa reserva.

  revalidatePath("/jantar-harmonizado");
  revalidatePath("/inicio");
  return { ok: true };
}

export type ReservaEdicaoJH = {
  id: number;
  nome: string;
  pessoas: number;
  canal: string;
  statusPagamento: string;
  comprovanteUrl: string | null;
  status: string;
};

/**
 * Reservas não têm FK pra eventos_especiais_historico (o schema atual não
 * amarra reserva a uma edição específica) — usa a data do evento como
 * correlação, já que o Jantar Harmonizado é sempre uma data única por edição.
 */
export async function listReservasEdicaoJH(dataEvento: string): Promise<ReservaEdicaoJH[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reservas")
    .select("id, nome, pessoas, canal, status_pagamento, comprovante_url, status")
    .ilike("objetivo", "%harmonizado%")
    .eq("data", dataEvento)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listReservasEdicaoJH: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id,
    nome: r.nome,
    pessoas: r.pessoas,
    canal: r.canal ?? "online",
    statusPagamento: r.status_pagamento ?? "pendente",
    comprovanteUrl: r.comprovante_url,
    status: r.status,
  }));
}

export async function confirmarPagamentoJH(reservaId: number): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reservas")
    .update({ status_pagamento: "confirmado" })
    .eq("id", reservaId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/jantar-harmonizado");
  revalidatePath("/inicio");
  return { ok: true };
}
