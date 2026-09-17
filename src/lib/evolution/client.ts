import "server-only";

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE;

export type EvolutionMessageRecord = {
  key: { fromMe: boolean; remoteJid: string; id: string; remoteJidAlt?: string };
  pushName: string | null;
  messageType: string;
  message: Record<string, unknown>;
  messageTimestamp: number;
  source?: string;
};

export type EvolutionChat = {
  id: string;
  remoteJid: string;
  pushName: string | null;
  profilePicUrl: string | null;
  updatedAt: string;
  lastMessage: EvolutionMessageRecord | null;
};

export type EvolutionMessagesPage = {
  records: EvolutionMessageRecord[];
  total: number;
  currentPage: number;
  pages: number;
};

function credenciaisFaltando(): boolean {
  return !BASE_URL || !API_KEY || !INSTANCE;
}

async function chamarEvolution<T>(caminho: string, body: unknown): Promise<T> {
  if (credenciaisFaltando()) {
    throw new Error("Evolution API não configurada (.env.local: EVOLUTION_API_URL/EVOLUTION_API_KEY/EVOLUTION_INSTANCE).");
  }
  const res = await fetch(`${BASE_URL}${caminho}/${INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: API_KEY! },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Evolution API respondeu ${res.status} em ${caminho}`);
  }
  return res.json();
}

/**
 * Lista todos os chats (conversas + grupos) da instância, cada um já com a
 * última mensagem e a foto de perfil embutidas — é a fonte real da lista de
 * Conversas do Painel, sem precisar duplicar nada no Supabase. Não tem
 * paginação (a Evolution sempre devolve tudo, ~1000 chats hoje, 700ms-1s de
 * resposta) — sem jeito de pedir menos dado por chamada.
 *
 * SEM cache (`chamarEvolution` já manda `cache: "no-store"`) — chegou a usar
 * `unstable_cache` com 5s de revalidação, mas isso travou de verdade em
 * produção (achado 16/09/2026): a lista ficou mostrando a última mensagem
 * de ~10h da manhã até as 15h30, horas depois de ter atividade nova de
 * verdade na Evolution — o Data Cache do Vercel parou de revalidar em
 * segundo plano e ninguém percebeu (sem erro visível, só dado velho). Pra
 * uma tela operacional que a equipe usa pra atender cliente em tempo real,
 * o risco de ficar presa em cache velho é bem pior do que perder ~700ms-1s
 * de performance por request.
 */
export async function findChats(): Promise<EvolutionChat[]> {
  return chamarEvolution<EvolutionChat[]>("/chat/findChats", {});
}

export type EvolutionContact = { remoteJid: string; pushName: string | null };

/**
 * Nome que a própria pessoa configurou no WhatsApp, por `remoteJid` (telefone
 * OU lid) — mais confiável que tirar de `findChats`/`lastMessage`: o
 * `pushName` no nível do chat quase nunca vem preenchido (13 de 1083 chats,
 * medido ao vivo 17/09/2026), e o da ÚLTIMA mensagem vem "Você" (o dono da
 * instância) sempre que o BOT respondeu por último. `findContacts` devolve
 * o pushName de cada contato de verdade, sem essa armadilha — usado como
 * fallback de nome na lista/conversa quando não tem cadastro em `clientes`.
 */
export async function findContacts(): Promise<EvolutionContact[]> {
  return chamarEvolution<EvolutionContact[]>("/chat/findContacts", {});
}

/**
 * Histórico de mensagens de uma conversa, paginado. `offset` é o TAMANHO da
 * página (nome confuso da própria API — confirmado testando ao vivo: com
 * offset=N cada página tem N registros, `page` escolhe qual página). Vem
 * sempre em ordem DESCENDENTE por `messageTimestamp` (mais recente primeiro).
 */
export async function findMessages(
  remoteJid: string,
  opts: { page?: number; tamanhoPagina?: number } = {}
): Promise<EvolutionMessagesPage> {
  const { page = 1, tamanhoPagina = 50 } = opts;
  const data = await chamarEvolution<{ messages: EvolutionMessagesPage }>("/chat/findMessages", {
    where: { key: { remoteJid } },
    page,
    offset: tamanhoPagina,
  });
  return data.messages;
}

export type MidiaDecodificada = { base64: string; mimetype: string };

/**
 * Decripta uma mensagem de mídia (imagem/áudio/vídeo) via a Evolution API —
 * necessário pra mídia mandada pelo CLIENTE (criptografada ponta-a-ponta,
 * a `url` bruta é um arquivo `.enc` que nenhum navegador renderiza direto).
 * Só funciona enquanto o link original do WhatsApp não tiver expirado —
 * melhor esforço, não uma garantia (mesma limitação que o WhatsApp Web tem
 * pra mídia antiga).
 */
export async function getBase64FromMediaMessage(key: {
  id: string;
  remoteJid: string;
  fromMe: boolean;
}): Promise<MidiaDecodificada> {
  const data = await chamarEvolution<{ base64: string; mimetype: string }>("/chat/getBase64FromMediaMessage", {
    message: { key },
  });
  return { base64: data.base64, mimetype: data.mimetype };
}

export async function fetchProfilePicUrl(telefone: string): Promise<string | null> {
  try {
    const data = await chamarEvolution<{ profilePictureUrl?: string }>("/chat/fetchProfilePictureUrl", {
      number: telefone,
    });
    return data.profilePictureUrl ?? null;
  } catch {
    return null;
  }
}

export type EvolutionInstanceInfo = {
  estado: "open" | "connecting" | "close";
  numero: string | null;
  nomePerfil: string | null;
  fotoUrl: string | null;
};

/**
 * Estado da conexão do WhatsApp + dados do perfil conectado — pra mostrar
 * no widget do menu lateral (nome/número/foto + "conectado"/"desconectado").
 * `fetchInstances` é a única chamada que devolve nome/número/foto; `state`
 * ali é menos confiável em tempo real que `connectionState` dedicado, então
 * usa os dois juntos.
 */
export async function getInstanceInfo(): Promise<EvolutionInstanceInfo> {
  if (credenciaisFaltando()) {
    return { estado: "close", numero: null, nomePerfil: null, fotoUrl: null };
  }
  const [stateRes, instanceRes] = await Promise.all([
    fetch(`${BASE_URL}/instance/connectionState/${INSTANCE}`, { headers: { apikey: API_KEY! }, cache: "no-store" }),
    fetch(`${BASE_URL}/instance/fetchInstances?instanceName=${INSTANCE}`, {
      headers: { apikey: API_KEY! },
      cache: "no-store",
    }),
  ]);

  const stateData = stateRes.ok ? await stateRes.json() : null;
  const instancias = instanceRes.ok ? await instanceRes.json() : [];
  const instancia = Array.isArray(instancias) ? instancias[0] : null;

  return {
    estado: stateData?.instance?.state ?? instancia?.connectionStatus ?? "close",
    numero: instancia?.ownerJid ? String(instancia.ownerJid).split("@")[0] : null,
    nomePerfil: instancia?.profileName ?? null,
    fotoUrl: instancia?.profilePicUrl ?? null,
  };
}

export type EvolutionQrCode = { estado: "open" | "connecting" | "close"; qrCodeBase64: string | null };

/**
 * Pede o QR code de pareamento. Chamar isso com a instância já conectada é
 * seguro (confirmado ao vivo, 16/09/2026) — a Evolution só devolve
 * `{state:"open"}` sem QR nenhum, não derruba a sessão. Só gera QR de
 * verdade quando o estado real é "close"/"connecting".
 */
export async function getQrCode(): Promise<EvolutionQrCode> {
  if (credenciaisFaltando()) return { estado: "close", qrCodeBase64: null };
  const res = await fetch(`${BASE_URL}/instance/connect/${INSTANCE}`, { headers: { apikey: API_KEY! }, cache: "no-store" });
  if (!res.ok) throw new Error(`Evolution API respondeu ${res.status} em /instance/connect`);
  const data = await res.json();
  const estado: EvolutionQrCode["estado"] = data?.instance?.state ?? (data?.base64 ? "connecting" : "close");
  return { estado, qrCodeBase64: data?.base64 ?? null };
}
