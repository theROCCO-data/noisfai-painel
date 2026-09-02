import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { buscarNomesPorTelefones } from "@/lib/data/clientes";

export type ConversaResumo = {
  conversationId: string;
  phone: string;
  nomeCliente: string | null;
  ultimaMensagem: string;
  ultimaAtualizacao: string;
  fotoUrl: string | null;
};

export async function getConversas(): Promise<ConversaResumo[]> {
  const supabase = createAdminClient();

  const { data: chats, error } = await supabase
    .from("chats")
    .select("conversation_id, phone, updated_at, foto_url")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`getConversas: ${error.message}`);
  if (!chats || chats.length === 0) return [];

  const ids = chats.map((c) => c.conversation_id);
  const { data: msgs, error: msgErr } = await supabase
    .from("chat_messages")
    .select("conversation_id, user_message, bot_message, created_at")
    .in("conversation_id", ids)
    .order("created_at", { ascending: false });

  if (msgErr) throw new Error(`getConversas (mensagens): ${msgErr.message}`);

  const ultimaPorConversa = new Map<string, string>();
  for (const m of msgs ?? []) {
    if (!ultimaPorConversa.has(m.conversation_id)) {
      ultimaPorConversa.set(m.conversation_id, m.user_message || m.bot_message || "");
    }
  }

  const nomesPorTelefone = await buscarNomesPorTelefones(chats.map((c) => c.phone));

  return chats.map((c) => ({
    conversationId: c.conversation_id,
    phone: c.phone,
    nomeCliente: nomesPorTelefone.get(c.phone) ?? null,
    ultimaMensagem: ultimaPorConversa.get(c.conversation_id) ?? "",
    ultimaAtualizacao: c.updated_at,
    fotoUrl: c.foto_url,
  }));
}

export type Mensagem = {
  id: number;
  createdAt: string;
  userMessage: string | null;
  botMessage: string | null;
};

export type ConversaDetalhe = {
  conversationId: string;
  phone: string;
  nomeCliente: string | null;
  mensagens: Mensagem[];
  fotoUrl: string | null;
};

const FOTO_CACHE_MS = 24 * 60 * 60 * 1000;

export async function getConversa(conversationId: string): Promise<ConversaDetalhe | null> {
  const supabase = createAdminClient();

  const { data: chat, error: chatErr } = await supabase
    .from("chats")
    .select("conversation_id, phone, foto_url, foto_atualizada_em")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (chatErr) throw new Error(`getConversa: ${chatErr.message}`);
  if (!chat) return null;

  const { data: msgs, error: msgErr } = await supabase
    .from("chat_messages")
    .select("id, created_at, user_message, bot_message")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgErr) throw new Error(`getConversa (mensagens): ${msgErr.message}`);

  const cacheVelho =
    !chat.foto_atualizada_em || Date.now() - new Date(chat.foto_atualizada_em).getTime() > FOTO_CACHE_MS;

  let fotoUrl = chat.foto_url;
  if (cacheVelho) {
    // busca ao vivo é rara (1x/dia por conversa aberta, não a cada refresh de
    // 4s) — o resultado (mesmo null, se o número não tiver foto) já fica em
    // cache pra não bater na Evolution API de novo antes do prazo.
    const { getPerfilWhatsapp } = await import("@/lib/data/perfil-whatsapp");
    const perfil = await getPerfilWhatsapp(chat.phone);
    fotoUrl = perfil.fotoUrl;
    await supabase
      .from("chats")
      .update({ foto_url: fotoUrl, foto_atualizada_em: new Date().toISOString() })
      .eq("conversation_id", conversationId);
  }

  const nomesPorTelefone = await buscarNomesPorTelefones([chat.phone]);

  return {
    conversationId: chat.conversation_id,
    phone: chat.phone,
    nomeCliente: nomesPorTelefone.get(chat.phone) ?? null,
    fotoUrl,
    mensagens: (msgs ?? []).map((m) => ({
      id: m.id,
      createdAt: m.created_at,
      userMessage: m.user_message,
      botMessage: m.bot_message,
    })),
  };
}

