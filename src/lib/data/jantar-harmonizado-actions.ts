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
