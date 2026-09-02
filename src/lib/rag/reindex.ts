import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { gerarEmbedding } from "@/lib/rag/embeddings";

/**
 * Mantém o RAG (`documents`) sincronizado com o que o painel grava em
 * `cardapio_itens`/`ifood_itens`. O bot responde sobre cardápio buscando
 * nesse `documents` via `match_documents` — sem isso, editar prato no painel
 * não mudava o que o bot fala pro cliente.
 *
 * Como não há FK entre `documents` e as tabelas novas, o vínculo é guardado
 * em `metadata.item_id` (+ `metadata.tabela`). Pra pegar também as linhas
 * migradas antes desse vínculo existir (sem item_id), o delete também casa
 * por `metadata.prato` = nome atual. Limitação conhecida: se o prato for
 * RENOMEADO, a linha antiga (por nome antigo) pode ficar órfã até a próxima
 * edição pegar o nome antigo por acaso — não há solução sem um backfill
 * único ligando os IDs, que não foi feito.
 */

type ItemCardapioReindex = {
  id: number;
  categoria: string;
  nome: string;
  descricao: string | null;
  preco: number;
  disponivelPresencial: boolean;
  disponivelIfood: boolean;
};

export async function reindexarItemCardapio(item: ItemCardapioReindex, nomeAntigo?: string) {
  const supabase = createAdminClient();

  await supabase
    .from("documents")
    .delete()
    .eq("metadata->>source", "cardapio")
    .or(`metadata->>item_id.eq.${item.id},metadata->>prato.eq.${nomeAntigo ?? item.nome}`);

  if (!item.disponivelPresencial) return; // não indexa prato que não está no cardápio presencial

  const content = `Categoria: ${item.categoria} | Prato: ${item.nome} | Descrição: ${item.descricao ?? "—"} | Preço: ${item.preco}`;
  const embedding = await gerarEmbedding(content);

  await supabase.from("documents").insert({
    content,
    metadata: { source: "cardapio", categoria: item.categoria, prato: item.nome, item_id: item.id },
    embedding,
  });
}

export async function removerReindexCardapio(id: number, nome: string) {
  const supabase = createAdminClient();
  await supabase
    .from("documents")
    .delete()
    .eq("metadata->>source", "cardapio")
    .or(`metadata->>item_id.eq.${id},metadata->>prato.eq.${nome}`);
}

type ItemIfoodReindex = {
  id: number;
  categoria: string;
  nome: string;
  descricao: string | null;
  preco: number;
  disponivel: boolean;
};

export async function reindexarItemIfood(item: ItemIfoodReindex, nomeAntigo?: string) {
  const supabase = createAdminClient();

  await supabase
    .from("documents")
    .delete()
    .eq("metadata->>source", "ifood")
    .or(`metadata->>item_id.eq.${item.id},metadata->>prato.eq.${nomeAntigo ?? item.nome}`);

  if (!item.disponivel) return;

  const content = `Categoria: ${item.categoria} | Prato: ${item.nome} | Descrição: ${item.descricao ?? "—"} | Preço no delivery iFood: R$ ${item.preco.toFixed(2).replace(".", ",")} | Disponível para pedido via delivery pelo iFood.`;
  const embedding = await gerarEmbedding(content);

  await supabase.from("documents").insert({
    content,
    metadata: { source: "ifood", categoria: item.categoria, prato: item.nome, item_id: item.id },
    embedding,
  });
}

export async function removerReindexIfood(id: number, nome: string) {
  const supabase = createAdminClient();
  await supabase
    .from("documents")
    .delete()
    .eq("metadata->>source", "ifood")
    .or(`metadata->>item_id.eq.${id},metadata->>prato.eq.${nome}`);
}
