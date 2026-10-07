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

async function registrarHandoff(telefone: string, tipo: "iniciado" | "finalizado", status: "humano" | null) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const staff = await getCurrentStaffUser();
  const supabase = createAdminClient();
  // best-effort — não deve derrubar o fluxo de atendimento se o log falhar.
  await supabase.from("handoff_eventos").insert({
    telefone,
    tipo,
    status,
    origem: "painel",
    staff_user_id: staff?.id ?? null,
    staff_nome: staff?.name ?? null,
  });
}

// Só revalida a THREAD aberta, não a lista inteira nem a Início — essas
// duas rodam a checagem de status em lote (20 telefones, ~1s no n8n) mais
// tudo mais de `getConversas()`, e forçar isso a cada clique era boa parte
// do "demora pra iniciar atendimento" sentido pelo usuário. A lista/Início
// já se atualizam sozinhas no próprio auto-refresh (12s/8s) — o badge dessa
// conversa específica só demora um pouco mais pra refletir ali, sem
// bloquear a ação em si.
export async function iniciarAtendimentoHumano(telefone: string): Promise<ActionResult> {
  const result = await chamarWebhookControle(process.env.N8N_INICIAR_HUMANO_URL, telefone);
  if (result.ok) {
    await registrarHandoff(telefone, "iniciado", "humano");
    revalidatePath(`/conversas/${telefone}`);
  }
  return result;
}

export async function finalizarAtendimentoHumano(telefone: string): Promise<ActionResult> {
  const result = await chamarWebhookControle(process.env.N8N_FINALIZAR_HUMANO_URL, telefone);
  if (result.ok) {
    await registrarHandoff(telefone, "finalizado", null);
    revalidatePath(`/conversas/${telefone}`);
  }
  return result;
}

export async function enviarMensagem(telefone: string, mensagem: string): Promise<ActionResult> {
  const url = process.env.N8N_ENVIAR_MENSAGEM_URL;
  const token = process.env.N8N_STATUS_HUMANO_TOKEN;
  if (!url || !token) return { ok: false, error: "Integração com o n8n não configurada (.env.local)." };
  if (!mensagem.trim()) return { ok: false, error: "Mensagem vazia." };

  // reforço no servidor, não só na UI: só deixa enviar se a conversa
  // estiver mesmo com atendimento humano assumido — evita bot e atendente
  // falando ao mesmo tempo com o cliente.
  const status = await getStatusHumano(telefone);
  if (status !== "humano") {
    return {
      ok: false,
      error: 'Essa conversa não está com atendimento humano assumido. Clique em "Assumir atendimento" antes de enviar.',
    };
  }

  // assina a mensagem com o nome de quem está atendendo, pra o cliente saber
  // que passou a falar com uma pessoa. Só o nome: o cargo saiu da assinatura
  // a pedido do restaurante (07/10/2026).
  const staff = await getCurrentStaffUser();
  const mensagemAssinada = staff ? `*${staff.name}*\n\n${mensagem}` : mensagem;

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

  // Não grava mais em chat_messages aqui: a mensagem sai pelo WhatsApp e o
  // eco dela é registrado com o message_id real pelo gravador do n8n (e, se
  // escapar, pela rotina de recuperação). A linha que era gravada aqui não
  // tinha message_id e a tela de Conversas nunca a mostrava.
  revalidatePath(`/conversas/${telefone}`);
  return { ok: true };
}
