"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/data/reservas-actions";

export async function atualizarEdicaoJH(formData: FormData): Promise<ActionResult> {
  const supabase = createAdminClient();

  const id = Number(formData.get("id"));
  const titulo = String(formData.get("titulo") ?? "").trim();
  const dataEvento = String(formData.get("dataEvento") ?? "");
  const valorPessoa = Number(formData.get("valorPessoa") ?? 0);
  const cotaVagas = Number(formData.get("cotaVagas") ?? 0);
  const ativo = formData.get("ativo") === "on";
  const imagemUrlColada = String(formData.get("imagemUrl") ?? "");
  const arquivo = formData.get("imagemArquivo");

  // arquiva o estado ATUAL antes de sobrescrever — é isso que alimenta o
  // histórico de edições anteriores. Só existe uma linha ativa em
  // eventos_especiais (é o que o bot lê), então o histórico mora numa
  // tabela separada e não afeta essa leitura.
  const { data: antes } = await supabase
    .from("eventos_especiais")
    .select("id, nome, titulo, valor_pessoa, data_evento, ativo, imagem_url")
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
    .update({ titulo: titulo || null, data_evento: dataEvento, valor_pessoa: valorPessoa, ativo, imagem_url: imagemUrl })
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
