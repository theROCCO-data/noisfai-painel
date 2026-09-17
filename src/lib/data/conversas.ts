import "server-only";
import { findChats, findMessages, fetchProfilePicUrl, type EvolutionChat, type EvolutionMessageRecord } from "@/lib/evolution/client";
import { agruparChatsPorTelefone, ehGrupo, extrairTextoOuMidia, inferirOrigem, telefoneParaRemoteJid } from "@/lib/evolution/mapper";
import { buscarNomesPorTelefones } from "@/lib/data/clientes";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUltimasLeituras, LANCAMENTO_NAO_LIDAS } from "@/lib/data/leitura";
import { registrarLidsConhecidos, getLidsConhecidos } from "@/lib/data/whatsapp-lids";

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

// nº de chamadas simultâneas à Evolution ao buscar fotos em lote -- não é
// grátis (uma requisição HTTP por telefone), então não dispara tudo de uma
// vez nem tenta cobrir a lista inteira (~1000 conversas), só quem está
// realmente visível (ver LIMITE_STATUS_NA_LISTA em conversas/layout.tsx).
const CONCORRENCIA_FOTO_PERFIL = 8;

/**
 * Mesmo cache de `getFotoPerfilComCache`, só que em lote — pra preencher a
 * FOTO NA LISTA de conversas, não só na conversa aberta. Achado 17/09/2026:
 * só ~8% dos chats vêm com `profilePicUrl` já embutido no retorno da
 * Evolution (`findChats`) — os outros 92% ficavam sempre com iniciais na
 * lista, mesmo tendo foto de perfil de verdade (a Evolution só devolve isso
 * de graça quando já tem em cache interno dela; senão precisa pedir
 * explicitamente via `fetchProfilePicUrl`, uma chamada por número).
 */
export async function getFotosPerfilEmLote(telefones: string[]): Promise<Map<string, string | null>> {
  if (telefones.length === 0) return new Map();
  const supabase = createAdminClient();
  const { data: cache } = await supabase
    .from("whatsapp_perfis")
    .select("telefone, foto_url, atualizada_em")
    .in("telefone", telefones);

  const cachePorTelefone = new Map((cache ?? []).map((c) => [c.telefone, c]));
  const resultado = new Map<string, string | null>();
  const paraBuscar: string[] = [];

  for (const telefone of telefones) {
    const c = cachePorTelefone.get(telefone);
    const cacheVelho = !c || Date.now() - new Date(c.atualizada_em).getTime() > FOTO_CACHE_MS;
    if (cacheVelho) paraBuscar.push(telefone);
    else resultado.set(telefone, c.foto_url);
  }

  for (let i = 0; i < paraBuscar.length; i += CONCORRENCIA_FOTO_PERFIL) {
    const lote = paraBuscar.slice(i, i + CONCORRENCIA_FOTO_PERFIL);
    const fotos = await Promise.all(lote.map((t) => fetchProfilePicUrl(t).catch(() => null)));
    lote.forEach((t, idx) => resultado.set(t, fotos[idx]));
  }

  if (paraBuscar.length > 0) {
    await supabase
      .from("whatsapp_perfis")
      .upsert(paraBuscar.map((t) => ({ telefone: t, foto_url: resultado.get(t) ?? null, atualizada_em: new Date().toISOString() })));
  }

  return resultado;
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
  /** remoteJids associados (telefone real + LID, se houver os dois) — usado
   * pra contar mensagens não lidas sem precisar reagrupar tudo de novo. */
  remoteJids: string[];
  /** true quando a última mensagem é do cliente e chegou depois de
   * `LANCAMENTO_NAO_LIDAS` E depois da última leitura registrada — ver
   * `src/lib/data/leitura.ts`. Calculado aqui (grátis, já temos o dado);
   * quem decide o valor exato do contador é `contarNaoLidas`, chamado à
   * parte só pras conversas visíveis (ver `ConversasLayout`). */
  naoLida: boolean;
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
  const [nomesPorTelefone, leituras] = await Promise.all([
    buscarNomesPorTelefones(telefones),
    getUltimasLeituras(telefones),
  ]);

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

    const timestampUltimaMsg = maisRecente ? maisRecente.messageTimestamp * 1000 : 0;
    const deCliente = !!maisRecente && !maisRecente.key.fromMe;
    const lidaEm = leituras.get(telefone)?.getTime() ?? 0;
    const naoLida = deCliente && timestampUltimaMsg > LANCAMENTO_NAO_LIDAS.getTime() && timestampUltimaMsg > lidaEm;

    // cadastro no `clientes` (nome que ele deu numa reserva) tem prioridade
    // por ser mais confiável, mas cai pro `pushName` do WhatsApp (nome que a
    // própria pessoa configurou lá) em vez de mostrar só o telefone puro --
    // cobre muito mais gente do que só quem já completou uma reserva. Só usa
    // quando a mensagem mais recente é DO CLIENTE: quando o bot responde por
    // último, `pushName` vem como "Você" (o dono da instância), não o
    // cliente -- achado 17/09/2026 testando ao vivo, quase virou bug.
    const nomePush = deCliente ? maisRecente!.pushName?.trim() || null : null;

    return {
      phone: telefone,
      nomeCliente: nomesPorTelefone.get(telefone) ?? nomePush,
      ultimaMensagem: ultima?.texto ?? rotuloDeMidia(ultima?.mediaType ?? null) ?? "",
      ultimaAtualizacao: new Date(atualizacaoMaisRecente).toISOString(),
      fotoUrl: chatsDoTelefone.find((c) => c.profilePicUrl)?.profilePicUrl ?? null,
      remoteJids: chatsDoTelefone.map((c) => c.remoteJid),
      naoLida,
    };
  });

  resumos.sort((a, b) => new Date(b.ultimaAtualizacao).getTime() - new Date(a.ultimaAtualizacao).getTime());
  return resumos;
}

/**
 * Conta quantas mensagens do CLIENTE chegaram depois de `desde` — usado só
 * pro número do badge de não lidas (não pro boolean `naoLida`, que já vem
 * de graça em `getConversas`). Chamado só pras conversas visíveis no topo
 * da lista (ver `LIMITE_STATUS_NA_LISTA` em `conversas/layout.tsx`) — fazer
 * isso pras ~1000 conversas de uma vez seria caro demais (1 chamada à
 * Evolution por conversa). Conta até `tamanhoPagina` (50) mensagens mais
 * recentes de cada remoteJid; se estourar isso, mostra só o limite (a UI
 * exibe como "50+").
 */
export async function contarNaoLidas(remoteJids: string[], desde: Date): Promise<number> {
  const paginas = await Promise.all(remoteJids.map((jid) => findMessages(jid, { tamanhoPagina: 50 })));
  const vistos = new Set<string>();
  let total = 0;
  for (const pagina of paginas) {
    for (const r of pagina.records) {
      if (vistos.has(r.key.id)) continue;
      vistos.add(r.key.id);
      if (!r.key.fromMe && r.messageTimestamp * 1000 > desde.getTime()) total++;
    }
  }
  return total;
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
  const remoteJidsAtuais = chatsDoTelefone?.map((c) => c.remoteJid) ?? [telefoneParaRemoteJid(telefone)];

  // registra (best-effort) os LIDs vistos AGORA pra esse telefone — a
  // Evolution pode "esquecer" essa entrada da lista de chats mais tarde
  // (achado em auditoria 16/09/2026), então guardamos assim que a vemos.
  const lidsAtuais = remoteJidsAtuais.filter((jid) => jid.endsWith("@lid")).map((lid) => ({ lid, telefone }));
  if (lidsAtuais.length > 0) registrarLidsConhecidos(lidsAtuais).catch(() => {});

  // mescla com qualquer LID histórico já visto pra esse telefone, mesmo que
  // a Evolution não mostre mais aquela entrada na lista atual — sem isso,
  // mensagens antigas enviadas sob um LID que "sumiu" ficavam inacessíveis
  // pra sempre, mesmo a Evolution ainda tendo o dado.
  const lidsHistoricos = await getLidsConhecidos(telefone).catch(() => []);
  const remoteJids = Array.from(new Set([...remoteJidsAtuais, ...lidsHistoricos]));

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

  // mesmo fallback de `getConversas` -- pushName da mensagem mais recente DO
  // CLIENTE (nunca a última mensagem no geral, que pode ser do bot e vir com
  // pushName "Você", o dono da instância).
  const ultimaDoCliente = [...registrosUnicos].reverse().find((r) => !r.key.fromMe);
  const nomePush = ultimaDoCliente?.pushName?.trim() || null;

  return {
    phone: telefone,
    nomeCliente: nomesPorTelefone.get(telefone) ?? nomePush,
    fotoUrl,
    mensagens,
  };
}
