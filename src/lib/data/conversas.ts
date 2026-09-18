import "server-only";
import { findChats, findMessages, findContacts, findContatoPorRemoteJid, fetchProfilePicUrl, type EvolutionChat, type EvolutionMessageRecord } from "@/lib/evolution/client";
import { agruparChatsPorTelefone, ehGrupo, extrairTextoOuMidia, inferirOrigem, telefoneParaRemoteJid, urlProxyMidiaPorChave } from "@/lib/evolution/mapper";
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

  // registra (best-effort, fire-and-forget) todo LID visto agora → telefone.
  // Antes isso vivia em `getConversa`, que por isso precisava chamar
  // `findChats` a cada abertura de conversa (~1s de latência). Movido pra cá:
  // a lista já tem `findChats` carregado, e roda no load + a cada refresh
  // (20s/realtime), então os LIDs ficam registrados no `whatsapp_lids` sem
  // custo extra — e o detalhe da conversa passa a ler só do banco (rápido).
  const paresLid = telefones.flatMap((tel) =>
    grupos.get(tel)!
      .map((c) => c.remoteJid)
      .filter((jid) => jid.endsWith("@lid"))
      .map((lid) => ({ lid, telefone: tel }))
  );
  if (paresLid.length > 0) registrarLidsConhecidos(paresLid).catch(() => {});

  const [nomesPorTelefone, leituras, contatos] = await Promise.all([
    buscarNomesPorTelefones(telefones),
    getUltimasLeituras(telefones),
    findContacts(),
  ]);
  const pushNamePorRemoteJid = new Map(contatos.map((c) => [c.remoteJid, c.pushName?.trim() || null]));

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
    // por ser mais confiável, mas cai pro `pushName` do contato no WhatsApp
    // (`findContacts`, por remoteJid -- telefone OU lid) em vez de mostrar só
    // o telefone puro -- cobre muito mais gente do que só quem já completou
    // uma reserva.
    const nomePush = chatsDoTelefone.map((c) => pushNamePorRemoteJid.get(c.remoteJid)).find((n) => !!n) ?? null;

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

// nº máximo de mensagens carregadas do banco por conversa. As threads mais
// longas hoje têm ~60 mensagens; 500 dá folga larga sem trazer a tabela
// inteira. (UI de "carregar mais" antigas fica pra fase seguinte.)
const LIMITE_MENSAGENS_BANCO = 500;

type LinhaChatMessage = {
  message_id: string;
  remote_jid: string | null;
  from_me: boolean | null;
  user_message: string | null;
  bot_message: string | null;
  origem: string | null;
  media_type: string | null;
  media_url: string | null;
  created_at: string;
};

function linhaParaMensagem(r: LinhaChatMessage): Mensagem {
  const fromMe = !!r.from_me;
  const mediaType = (r.media_type as Mensagem["mediaType"]) ?? null;
  // remonta a URL de proxy de mídia a partir do remoteJid cru gravado no banco
  // (a mídia do cliente vem endereçada pelo LID; o proxy precisa do remoteJid
  // EXATO -- ver migration 025 e /api/evolution/midia). Se por algum motivo
  // faltar o remote_jid (linha antiga capturada antes do gravador incluir a
  // coluna), cai pra media_url gravada ou nulo.
  const mediaUrl = mediaType
    ? r.media_url ?? (r.remote_jid ? urlProxyMidiaPorChave({ id: r.message_id, remoteJid: r.remote_jid, fromMe }) : null)
    : null;

  return {
    id: r.message_id,
    createdAt: new Date(r.created_at).toISOString(),
    deCliente: !fromMe,
    userMessage: fromMe ? null : r.user_message,
    botMessage: fromMe ? r.bot_message : null,
    origem: (r.origem as Mensagem["origem"]) ?? "bot",
    mediaUrl,
    mediaType,
    nomeArquivo: null,
  };
}

/**
 * Histórico do banco (`chat_messages`, fonte de verdade a partir da Fase 3 —
 * modelo Datanyx). O n8n grava toda mensagem (entrada + eco de saída) com o
 * `message_id` real; aqui lemos só isso (`message_id is not null`), em ordem
 * cronológica. Uma única consulta indexada (`idx_chat_messages_phone_created`)
 * — troca os ~1-3s de latência do caminho antigo (findChats de ~1000 chats +
 * findMessages por remoteJid) por poucos ms. Devolve `null` quando não há
 * NENHUMA linha do telefone, pra `getConversa` cair no Evolution ao vivo.
 */
async function getMensagensDoBanco(telefone: string): Promise<Mensagem[] | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("message_id, remote_jid, from_me, user_message, bot_message, origem, media_type, media_url, created_at")
    .eq("phone", telefone)
    .not("message_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(LIMITE_MENSAGENS_BANCO);

  if (error || !data || data.length === 0) return null;
  return (data as LinhaChatMessage[]).map(linhaParaMensagem);
}

/**
 * Caminho antigo: detalhe lido direto da Evolution API (`findMessages`), em
 * TODOS os `remoteJid` do telefone (telefone real + LIDs), mesclado e
 * deduplicado por id. A partir da Fase 3 vira só FALLBACK — usado quando o
 * banco ainda não tem nenhuma linha desse telefone (ex.: conversa anterior à
 * janela do backfill, ou telefone que escapou da captura).
 */
async function getConversaDoEvolution(
  telefone: string,
  ctx: { fotoUrl: string | null; nomesPorTelefone: Map<string, string>; remoteJids: string[] }
): Promise<ConversaDetalhe | null> {
  const paginas = await Promise.all(ctx.remoteJids.map((jid) => findMessages(jid, { tamanhoPagina: TAMANHO_HISTORICO })));

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
  registrosUnicos.sort((a, b) => a.messageTimestamp - b.messageTimestamp);

  const mensagens: Mensagem[] = registrosUnicos.map((r) => {
    const { texto, mediaUrl, mediaType, nomeArquivo } = extrairTextoOuMidia(r);
    const dataIso = new Date(r.messageTimestamp * 1000).toISOString();
    if (!r.key.fromMe) {
      return { id: r.key.id, createdAt: dataIso, deCliente: true, userMessage: texto, botMessage: null, origem: "bot", mediaUrl, mediaType, nomeArquivo };
    }
    return { id: r.key.id, createdAt: dataIso, deCliente: false, userMessage: null, botMessage: texto, origem: inferirOrigem(r), mediaUrl, mediaType, nomeArquivo };
  });

  const nomePush = [...registrosUnicos].reverse().find((r) => !r.key.fromMe)?.pushName?.trim() || null;

  return {
    phone: telefone,
    nomeCliente: ctx.nomesPorTelefone.get(telefone) ?? nomePush,
    fotoUrl: ctx.fotoUrl,
    mensagens,
  };
}

/**
 * Detalhe de uma conversa (thread). Fase 3: lê do banco (`chat_messages`,
 * fonte de verdade) — rápido. Só cai no Evolution ao vivo quando o banco não
 * tem nenhuma linha desse telefone. foto + nome (clientes) + LIDs + mensagens
 * disparam todos em paralelo desde o início.
 */
export async function getConversa(telefone: string): Promise<ConversaDetalhe | null> {
  const telefoneJid = telefoneParaRemoteJid(telefone);
  // o pushName de fallback (contato do telefone na Evolution) é buscado JUNTO
  // no batch, não em série depois -- assim não soma ~400ms a cada abertura de
  // conversa de quem não é cliente cadastrado (que é a maioria). Como roda em
  // paralelo com as leituras do banco, não custa tempo de parede a mais; só é
  // de fato usado se o cadastro em `clientes` não tiver o nome.
  const [fotoUrl, nomesPorTelefone, lidsHistoricos, mensagensBanco, contatoTelefone] = await Promise.all([
    getFotoPerfilComCache(telefone).catch(() => null),
    buscarNomesPorTelefones([telefone]),
    getLidsConhecidos(telefone).catch(() => []),
    getMensagensDoBanco(telefone).catch(() => null),
    findContatoPorRemoteJid(telefoneJid).catch(() => null),
  ]);

  const remoteJids = Array.from(new Set([telefoneJid, ...lidsHistoricos]));

  // banco vazio pra esse telefone -> fallback pro comportamento antigo (ao vivo).
  if (!mensagensBanco || mensagensBanco.length === 0) {
    return getConversaDoEvolution(telefone, { fotoUrl, nomesPorTelefone, remoteJids });
  }

  // prioridade: cadastro em `clientes` > pushName do contato do telefone.
  let nomeCliente = nomesPorTelefone.get(telefone) ?? contatoTelefone?.pushName?.trim() ?? null;
  // só se ainda não achou E existem LIDs históricos (contato pode estar sob o
  // LID, não sob o telefone) -- caso raro, aí sim uma busca extra.
  if (!nomeCliente && lidsHistoricos.length > 0) {
    const contatos = await Promise.all(lidsHistoricos.map((jid) => findContatoPorRemoteJid(jid).catch(() => null)));
    nomeCliente = contatos.map((c) => c?.pushName?.trim()).find((n) => !!n) ?? null;
  }

  return { phone: telefone, nomeCliente, fotoUrl, mensagens: mensagensBanco };
}
