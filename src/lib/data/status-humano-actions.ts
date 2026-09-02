"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/data/reservas-actions";
import { getStatusHumano } from "@/lib/data/status-humano";
import { getCurrentStaffUser } from "@/lib/auth";

async function chamarWebhookControle(url: string | undefined, telefone: string): Promise<ActionResult> {
  const token = process.env.N8N_STATUS_HUMANO_TOKEN;
  if (!url || !token) return { ok: false, error: "Integração com o n8n não configurada (.env.local)." };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-painel-token": token },
      body: JSON.stringify({ telefone }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { ok: false, error: `n8n respondeu ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Falha ao falar com o n8n: ${(e as Error).message}` };
  }
}

export async function iniciarAtendimentoHumano(telefone: string, conversationId: string): Promise<ActionResult> {
  const result = await chamarWebhookControle(process.env.N8N_INICIAR_HUMANO_URL, telefone);
  if (result.ok) {
    revalidatePath(`/conversas/${conversationId}`);
    revalidatePath("/conversas");
    revalidatePath("/inicio");
  }
  return result;
}

export async function finalizarAtendimentoHumano(telefone: string, conversationId: string): Promise<ActionResult> {
  const result = await chamarWebhookControle(process.env.N8N_FINALIZAR_HUMANO_URL, telefone);
  if (result.ok) {
    revalidatePath(`/conversas/${conversationId}`);
    revalidatePath("/conversas");
    revalidatePath("/inicio");
  }
  return result;
}

export async function enviarMensagem(
  telefone: string,
  mensagem: string,
  conversationId: string
): Promise<ActionResult> {
  const url = process.env.N8N_ENVIAR_MENSAGEM_URL;
  const token = process.env.N8N_STATUS_HUMANO_TOKEN;
  if (!url || !token) return { ok: false, error: "Integração com o n8n não configurada (.env.local)." };
  if (!mensagem.trim()) return { ok: false, error: "Mensagem vazia." };

  // reforço no servidor, não só na UI: só deixa enviar se a conversa
  // estiver mesmo com atendimento humano assumido — evita bot e atendente
  // falando ao mesmo tempo com o cliente.
  const humano = await getStatusHumano(telefone);
  if (!humano) {
    return {
      ok: false,
      error: 'Essa conversa está com a IA no momento. Clique em "Iniciar Atendimento Humano" antes de enviar.',
    };
  }

  // assina a mensagem com quem está atendendo (nome + cargo cadastrados na
  // conta), pra o cliente saber que passou a falar com uma pessoa e qual é
  // o papel dela — não só "confia em mim" anônimo.
  const staff = await getCurrentStaffUser();
  const mensagemAssinada = staff ? `*${staff.name} - ${staff.role}*\n\n${mensagem}` : mensagem;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-painel-token": token },
      body: JSON.stringify({ telefone, mensagem: mensagemAssinada }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, error: `n8n respondeu ${res.status}` };
  } catch (e) {
    return { ok: false, error: `Falha ao falar com o n8n: ${(e as Error).message}` };
  }

  // registra no histórico da conversa pra aparecer no painel — best-effort:
  // a mensagem já foi enviada de verdade nesse ponto, então uma falha aqui
  // não desfaz o envio, só não fica visível na thread até recarregar.
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    bot_message: mensagemAssinada,
  });

  revalidatePath(`/conversas/${conversationId}`);
  revalidatePath("/conversas");
  return { ok: true };
}
