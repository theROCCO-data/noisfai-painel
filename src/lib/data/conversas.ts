import "server-only";
import { findChats, findMessages, fetchProfilePicUrl, type EvolutionChat, type EvolutionMessageRecord } from "@/lib/evolution/client";
import { agruparChatsPorTelefone, ehGrupo, extrairTextoOuMidia, inferirOrigem, telefoneParaRemoteJid } from "@/lib/evolution/mapper";
import { buscarNomesPorTelefones } from "@/lib/data/clientes";
import { createAdminClient } from "@/lib/supabase/admin";

const FOTO_CACHE_MS = 24 * 60 * 60 * 1000;

/**
 * Cache de 24h da foto de perfil, em `whatsapp_perfis` — evita bater na
 * Evolution a cada refresh de 5s enquanto a thread está aberta (substitui o
 * cache que antes vivia em `chats.foto_url`).
 */
async function getFotoPerfilComCache(telefone: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: cache } = await supabase
    .from("whatsapp_perfis")
    .select("foto_url, atualizada_em")
    .eq("telefone", telefone)
    .maybeSingle();

  const cacheVelho = !cache || Date.now() - new Date(cache.atualizada_em).getTime() > FOTO_CACHE_MS;
  if (!cacheVelho) return cache.foto_url;

  const fotoUrl = await fetchProfilePicUrl(telefone).catch(() => null);
  await supabase.from("whatsapp_perfis").upsert({ telefone, foto_url: fotoUrl, atualizada_em: new Date().toISOString() });
  return fotoUrl;
}

async function getGruposDeChatsPorTelefone(): Promise<Map<string, EvolutionChat[]>> {
  const chats = await findChats();
  const individuais = chats.filter((c) => !ehGrupo(c.remoteJid));
  return agruparChatsPorTelefone(individuais);
}

export type ConversaResumo = {
  phone: string;
  nomeCliente: string | null;
  ultimaMensagem: string;
  ultimaAtualizacao: string;
  fotoUrl: string | null;
};

function rotuloDeMidia(mediaType: "image" | "audio" | "video" | "document" | null): string | null {
  if (mediaType === "image") return "📷 Imagem";
  if (mediaType === "audio") return "🎤 Áudio";
  if (mediaType === "video") return "🎥 Vídeo";
  if (mediaType === "document") return "📄 Documento";
  return null;
}

/**
 * Lista de conversas — lê direto da Evolution API (`findChats`), não mais
 * do Supabase. Elimina a dependência de o n8n replicar cada conversa/
 * mensagem manualmente em `chats`/`chat_messages` (fonte de bugs recorrentes:
 * ver histórico de correções de conversation_id nulo, mensagens perdidas).
 *
 * O WhatsApp endereça parte dos contatos por um ID de privacidade ("LID")
 * em vez do telefone — a mesma pessoa pode aparecer em DUAS entradas
 * separadas de `findChats` (uma pelo telefone, outra pelo LID). Agrupadas
 * aqui por telefone real antes de montar a lista, senão a mesma conversa
 * apareceria duplicada.
 */
export async function getConversas(): Promise<ConversaResumo[]> {
  const grupos = await getGruposDeChatsPorTelefone();
  const telefones = [...grupos.keys()];
  const nomesPorTelefone = await buscarNomesPorTelefones(telefones);

  const resumos = telefones.map((telefone) => {
    const chatsDoTelefone = grupos.get(telefone)!;
    // entre as (até 2) entradas desse telefone, pega a mensagem mais recente de fato.
    const maisRecente = chatsDoTelefone
      .map((c) => c.lastMessage)
      .filter((m): m is EvolutionMessageRecord => !!m)
      .sort((a, b) => b.messageTimestamp - a.messageTimestamp)[0];
    const ultima = maisRecente ? extrairTextoOuMidia(maisRecente) : null;
    const atualizacaoMaisRecente = chatsDoTelefone
      .map((c) => new Date(c.updatedAt).getTime())
      .sort((a, b) => b - a)[0];

    return {
      phone: telefone,
      nomeCliente: nomesPorTelefone.get(telefone) ?? null,
      ultimaMensagem: ultima?.texto ?? rotuloDeMidia(ultima?.mediaType ?? null) ?? "",
      ultimaAtualizacao: new Date(atualizacaoMaisRecente).toISOString(),
      fotoUrl: chatsDoTelefone.find((c) => c.profilePicUrl)?.profilePicUrl ?? null,
    };
  });

  resumos.sort((a, b) => new Date(b.ultimaAtualizacao).getTime() - new Date(a.ultimaAtualizacao).getTime());
  return resumos;
}

export type Mensagem = {
  id: string;
  createdAt: string;
  // qual lado renderiza a bolha — não basta checar userMessage/botMessage
  // pra decidir isso: uma mídia sem legenda deixa os dois nulos, e sem esse
  // campo explícito os dois lados achavam que a mídia era deles (mesma
  // imagem aparecia duplicada, uma vez de cada lado).
  deCliente: boolean;
  userMessage: string | null;
  botMessage: string | null;
  origem: "bot" | "painel" | "manual";
  mediaUrl: string | null;
  mediaType: "image" | "audio" | "video" | "document" | null;
  nomeArquivo: string | null;
};

export type ConversaDetalhe = {
  phone: string;
  nomeCliente: string | null;
  mensagens: Mensagem[];
  fotoUrl: string | null;
};

const TAMANHO_HISTORICO = 200;

/**
 * Detalhe de uma conversa (thread) — lê direto da Evolution API
 * (`findMessages`). Busca em TODOS os `remoteJid` associados a esse telefone
 * (telefone real + LID, se houver os dois — ver `getConversas`), mescla e
 * deduplica por id de mensagem, e ordena cronologicamente. Só busca a página
 * mais recente (as `TAMANHO_HISTORICO` mensagens mais novas de cada
 * remoteJid); carregar mensagens mais antigas que isso ainda não está
 * implementado (fica pra uma fase seguinte, com UI de "carregar mais").
 */
export async function getConversa(telefone: string): Promise<ConversaDetalhe | null> {
  // foto não depende do agrupamento LID/telefone nem das mensagens — dispara
  // já, em paralelo com tudo o resto, em vez de esperar até o fim (era uma
  // rodada inteira de espera em série a cada troca de conversa).
  const fotoPromise = getFotoPerfilComCache(telefone);

  const grupos = await getGruposDeChatsPorTelefone();
  const chatsDoTelefone = grupos.get(telefone);
  // fallback: telefone não apareceu em nenhum chat agrupado (ex.: link direto
  // pra um telefone que nunca conversou) — ainda tenta buscar pelo JID normal.
  const remoteJids = chatsDoTelefone?.map((c) => c.remoteJid) ?? [telefoneParaRemoteJid(telefone)];

  const [paginas, nomesPorTelefone] = await Promise.all([
    Promise.all(remoteJids.map((jid) => findMessages(jid, { tamanhoPagina: TAMANHO_HISTORICO }))),
    buscarNomesPorTelefones([telefone]),
  ]);

  const totalMensagens = paginas.reduce((soma, p) => soma + p.total, 0);
  if (totalMensagens === 0) return null;

  const vistos = new Set<string>();
  const registrosUnicos: EvolutionMessageRecord[] = [];
  for (const pagina of paginas) {
    for (const r of pagina.records) {
      if (vistos.has(r.key.id)) continue;
      vistos.add(r.key.id);
      registrosUnicos.push(r);
    }
  }
  // mescla os remoteJids e ordena cronológica (cada página individual já vem
  // mais recente -> mais antiga; juntas, a ordem original não vale mais).
  registrosUnicos.sort((a, b) => a.messageTimestamp - b.messageTimestamp);

  const mensagens: Mensagem[] = registrosUnicos.map((r) => {
    const { texto, mediaUrl, mediaType, nomeArquivo } = extrairTextoOuMidia(r);
    const dataIso = new Date(r.messageTimestamp * 1000).toISOString();

    if (!r.key.fromMe) {
      return { id: r.key.id, createdAt: dataIso, deCliente: true, userMessage: texto, botMessage: null, origem: "bot", mediaUrl, mediaType, nomeArquivo };
    }
    return { id: r.key.id, createdAt: dataIso, deCliente: false, userMessage: null, botMessage: texto, origem: inferirOrigem(r), mediaUrl, mediaType, nomeArquivo };
  });

  const fotoUrl = await fotoPromise;

  return {
    phone: telefone,
    nomeCliente: nomesPorTelefone.get(telefone) ?? null,
    fotoUrl,
    mensagens,
  };
}
