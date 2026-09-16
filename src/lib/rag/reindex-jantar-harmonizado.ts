import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { gerarEmbedding } from "@/lib/rag/embeddings";

/**
 * Mantém sincronizado com o RAG o campo `regras_reserva` do evento (onde
 * fica a chave PIX e outras regras de pagamento do Jantar Harmonizado) — é a
 * ÚNICA informação dessa tela que o bot busca via base_conhecimento (data e
 * valor vêm da legenda da imagem enviada automaticamente, nunca do RAG).
 *
 * Sem isso, editar essa regra no Painel nunca chegava ao bot — a tela
 * salvava certo em `eventos_especiais`, mas nada replicava pra `documents`.
 * Achado em auditoria 16/09/2026, motivado por um caso real: o bot informou
 * 2 chaves PIX diferentes e erradas (alucinadas, por falta de dado real pra
 * recuperar via busca semântica).
 */
export async function reindexarRegrasJantarHarmonizado(eventoId: number): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("documents")
    .delete()
    .eq("metadata->>source", "jantar_harmonizado")
    .eq("metadata->>evento_id", String(eventoId));

  const { data: evento } = await supabase
    .from("eventos_especiais")
    .select("regras_reserva")
    .eq("id", eventoId)
    .maybeSingle();

  if (!evento?.regras_reserva) return;

  const content = `Jantar Harmonizado — regras de pagamento e reserva: ${evento.regras_reserva}`;
  const embedding = await gerarEmbedding(content);

  await supabase.from("documents").insert({
    content,
    metadata: { source: "jantar_harmonizado", evento_id: eventoId, topico: "Regras de pagamento" },
    embedding,
  });
}
