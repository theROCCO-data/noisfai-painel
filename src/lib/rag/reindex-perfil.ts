import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { gerarEmbedding } from "@/lib/rag/embeddings";

/**
 * Mantém o RAG (`documents`, source = 'perfil_restaurante') sincronizado com
 * o que o painel grava em `configuracoes_painel` (campos fixos) e
 * `perfil_restaurante` (regras e comandos por categoria) — o bot sempre fala
 * a versão atual do que está no Painel.
 *
 * Reindexação é sempre um replace total dos documentos dessa source: mais
 * simples que rastrear diffs por campo, e o volume é pequeno o bastante
 * (poucas dezenas de linhas) pra não pesar.
 */
export async function reindexarPerfilRestaurante() {
  const supabase = createAdminClient();

  await supabase.from("documents").delete().eq("metadata->>source", "perfil_restaurante");

  const { data: config } = await supabase
    .from("configuracoes_painel")
    .select(
      "nome, endereco, telefone, horario_funcionamento, sobre, site_url, ifood_url, cardapio_digital_url, outras_unidades, espaco_eventos_info"
    )
    .eq("id", 1)
    .maybeSingle();

  const { data: fatos } = await supabase
    .from("perfil_restaurante")
    .select("categoria, topico, informacao");

  const textos: { texto: string; categoria: string; topico: string }[] = [];

  if (config) {
    if (config.endereco) textos.push({ texto: `Endereço: ${config.endereco}`, categoria: "Perfil", topico: "Endereço" });
    if (config.telefone) textos.push({ texto: `Telefone: ${config.telefone}`, categoria: "Perfil", topico: "Telefone" });
    if (config.horario_funcionamento)
      textos.push({ texto: `Horário de funcionamento: ${config.horario_funcionamento}`, categoria: "Perfil", topico: "Horário" });
    if (config.sobre) textos.push({ texto: `Sobre o restaurante: ${config.sobre}`, categoria: "Perfil", topico: "Sobre" });
    if (config.site_url) textos.push({ texto: `Site: ${config.site_url}`, categoria: "Perfil", topico: "Site" });
    if (config.ifood_url) textos.push({ texto: `iFood (delivery): ${config.ifood_url}`, categoria: "Perfil", topico: "iFood" });
    if (config.cardapio_digital_url)
      textos.push({ texto: `Cardápio digital: ${config.cardapio_digital_url}`, categoria: "Perfil", topico: "Cardápio digital" });
    if (config.outras_unidades)
      textos.push({ texto: `Outras unidades: ${config.outras_unidades}`, categoria: "Perfil", topico: "Outras unidades" });
    if (config.espaco_eventos_info)
      textos.push({ texto: `Espaço de eventos: ${config.espaco_eventos_info}`, categoria: "Eventos", topico: "Espaço de eventos" });
  }

  for (const f of fatos ?? []) {
    textos.push({ texto: `${f.topico}: ${f.informacao}`, categoria: f.categoria, topico: f.topico });
  }

  for (const t of textos) {
    const embedding = await gerarEmbedding(t.texto);
    await supabase.from("documents").insert({
      content: t.texto,
      metadata: { source: "perfil_restaurante", categoria: t.categoria, topico: t.topico },
      embedding,
    });
  }
}
