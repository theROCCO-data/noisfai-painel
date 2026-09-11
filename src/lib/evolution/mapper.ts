import type { EvolutionChat, EvolutionMessageRecord } from "@/lib/evolution/client";

/**
 * Mesma assinatura que `enviarMensagem` (status-humano-actions.ts) usa pra
 * marcar quem mandou a mensagem pelo Painel — reconhecida aqui pra
 * distinguir "painel" de "bot" dentro do que a Evolution só vê como
 * `fromMe: true, source: "web"` (as duas passam pela mesma API).
 */
const ASSINATURA_PAINEL = /^\*([^*]+)\*\n\n([\s\S]*)$/;

export function ehGrupo(remoteJid: string): boolean {
  return remoteJid.endsWith("@g.us");
}

export function remoteJidParaTelefone(remoteJid: string): string {
  return remoteJid.replace(/@.*$/, "");
}

export function telefoneParaRemoteJid(telefone: string): string {
  return `${telefone}@s.whatsapp.net`;
}

function ehLid(remoteJid: string): boolean {
  return remoteJid.endsWith("@lid");
}

/**
 * O WhatsApp passou a endereçar contatos por um ID de privacidade ("LID")
 * em vez do telefone direto — confirmado ao vivo: 881 dos 969 chats de hoje
 * usam `@lid`, a maioria vindo de anúncio (clique-para-WhatsApp). O telefone
 * real só aparece dentro de `key.remoteJidAlt` de alguma mensagem daquele
 * chat (normalmente numa mensagem que o bot mandou, endereçada de volta pro
 * telefone). Se não achar nenhuma pista, a conversa fica "órfã" — usa o
 * próprio número do LID como identificador (não bate com `clientes`/Redis,
 * mas pelo menos não desaparece da lista).
 */
export function telefoneRealDoChat(chat: EvolutionChat): string {
  if (!ehLid(chat.remoteJid)) return remoteJidParaTelefone(chat.remoteJid);
  const alt = chat.lastMessage?.key.remoteJidAlt;
  if (alt) return remoteJidParaTelefone(alt);
  return remoteJidParaTelefone(chat.remoteJid);
}

/**
 * Uma mesma pessoa pode ter DUAS entradas separadas em `findChats` — uma
 * pelo telefone real (mensagens que o bot/Painel mandou) e outra pelo LID
 * (mensagens que o cliente mandou) — confirmado ao vivo: a mesma conversa
 * dividida em duas, com contagens de mensagem diferentes em cada uma.
 * Agrupa por telefone real pra tratar como uma conversa só.
 */
export function agruparChatsPorTelefone(chats: EvolutionChat[]): Map<string, EvolutionChat[]> {
  const grupos = new Map<string, EvolutionChat[]>();
  for (const chat of chats) {
    const telefone = telefoneRealDoChat(chat);
    const lista = grupos.get(telefone) ?? [];
    lista.push(chat);
    grupos.set(telefone, lista);
  }
  return grupos;
}

/**
 * `fromMe: false` é sempre o cliente. `fromMe: true` com `source: "web"` foi
 * mandado pela API (bot ou Painel — só dá pra separar pelo texto assinado);
 * qualquer outro `source` (`"android"`, `"ios"`) foi digitado direto no
 * celular do restaurante — "manual". Confirmado ao vivo hoje contra
 * conversas reais (busca por `source` nos registros da Evolution).
 */
export function inferirOrigem(msg: EvolutionMessageRecord): "bot" | "painel" | "manual" {
  if (msg.source && msg.source !== "web") return "manual";
  const texto = textoBrutoDaMensagem(msg);
  if (texto && ASSINATURA_PAINEL.test(texto)) return "painel";
  return "bot";
}

function textoBrutoDaMensagem(msg: EvolutionMessageRecord): string | null {
  const m = msg.message as Record<string, unknown> | null;
  if (!m) return null;
  if (typeof m.conversation === "string") return m.conversation;
  const extended = m.extendedTextMessage as { text?: string } | undefined;
  if (extended?.text) return extended.text;
  // mensagem de anúncio (clique-para-WhatsApp do Facebook/Instagram) — o
  // texto de abertura fica dentro de `interactiveMessage.body.text`.
  const interactive = m.interactiveMessage as { body?: { text?: string } } | undefined;
  if (interactive?.body?.text) return interactive.body.text;
  // reação com emoji a uma mensagem anterior — não tem texto próprio, só o emoji.
  const reaction = m.reactionMessage as { text?: string } | undefined;
  if (typeof reaction?.text === "string") return reaction.text ? `reagiu ${reaction.text}` : "removeu a reação";
  return null;
}

export type MidiaExtraida = {
  texto: string | null;
  mediaUrl: string | null;
  mediaType: "image" | "audio" | "video" | "document" | null;
  nomeArquivo: string | null;
};

/**
 * Extrai o texto/mídia de um record da Evolution pro formato que o Painel já
 * usa (`Mensagem.userMessage`/`botMessage`/`mediaUrl`/`mediaType`). Mídia
 * mandada pelo bot/Painel (imagem do Jantar Harmonizado, por ex.) já vem com
 * `url` utilizável direto; mídia mandada pelo CLIENTE vem com `url` de um
 * arquivo `.enc` (criptografado ponta-a-ponta) — não renderiza direto num
 * `<img>`, precisa passar pela rota `/api/evolution/midia` que decripta via
 * `getBase64FromMediaMessage` (best-effort: só funciona enquanto o link do
 * WhatsApp não tiver expirado).
 */
function urlProxyMidia(msg: EvolutionMessageRecord): string {
  const params = new URLSearchParams({
    id: msg.key.id,
    remoteJid: msg.key.remoteJid,
    fromMe: String(msg.key.fromMe),
  });
  return `/api/evolution/midia?${params.toString()}`;
}

export function extrairTextoOuMidia(msg: EvolutionMessageRecord): MidiaExtraida {
  const m = (msg.message ?? {}) as Record<string, unknown>;

  if (msg.messageType === "imageMessage") {
    const img = m.imageMessage as { caption?: string } | undefined;
    return { texto: img?.caption ?? null, mediaUrl: urlProxyMidia(msg), mediaType: "image", nomeArquivo: null };
  }
  if (msg.messageType === "audioMessage") {
    return { texto: null, mediaUrl: urlProxyMidia(msg), mediaType: "audio", nomeArquivo: null };
  }
  if (msg.messageType === "videoMessage") {
    const video = m.videoMessage as { caption?: string } | undefined;
    return { texto: video?.caption ?? null, mediaUrl: urlProxyMidia(msg), mediaType: "video", nomeArquivo: null };
  }
  if (msg.messageType === "documentMessage") {
    const doc = m.documentMessage as { caption?: string; fileName?: string } | undefined;
    return { texto: doc?.caption ?? null, mediaUrl: urlProxyMidia(msg), mediaType: "document", nomeArquivo: doc?.fileName ?? null };
  }

  return { texto: textoBrutoDaMensagem(msg), mediaUrl: null, mediaType: null, nomeArquivo: null };
}
