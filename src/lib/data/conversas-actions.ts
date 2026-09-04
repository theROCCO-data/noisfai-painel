"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { iniciarAtendimentoHumano } from "@/lib/data/status-humano-actions";
import { enviarMensagem } from "@/lib/data/status-humano-actions";
import type { ActionResult } from "@/lib/data/reservas-actions";

export type IniciarNovaConversaInput = {
  telefone: string;
  nome: string;
  mensagemInicial: string;
};

export type IniciarNovaConversaResult = ActionResult & { conversationId?: string };

/**
 * `clientes.telefone` às vezes é salvo sem o DDI 55 (formato usado em
 * `criarReservaManual`/cadastro manual — 10 ou 11 dígitos, DDD+número),
 * mas a Evolution API só aceita o JID completo (`55` + DDD + número). Sem
 * isso, o envio falha com "exists: false" pro número errado (foi o que
 * aconteceu testando com um telefone salvo sem DDI). `chats.phone` e o
 * bot sempre usam o formato completo — aqui normaliza só pra esse lado
 * (WhatsApp), sem mexer no que já está salvo em `clientes.telefone`.
 */
function normalizarTelefoneWhatsapp(digits: string): string {
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/**
 * Abre uma conversa pelo Painel (não pelo bot) — pra falar primeiro com um
 * cliente em vez de só responder. A conversa nasce já em atendimento
 * humano (mesmo mecanismo de "Assumir atendimento", TTL de 1h já embutido
 * na automação de handoff — depois desse tempo sem novo "assumir", volta
 * sozinha pro bot).
 */
export async function iniciarNovaConversa(input: IniciarNovaConversaInput): Promise<IniciarNovaConversaResult> {
  const telefone = input.telefone.replace(/\D/g, "");
  if (!telefone) return { ok: false, error: "Telefone inválido." };
  if (!input.mensagemInicial.trim()) return { ok: false, error: "Escreva a primeira mensagem." };

  const telefoneWhatsapp = normalizarTelefoneWhatsapp(telefone);
  const supabase = createAdminClient();

  if (input.nome.trim()) {
    // Só cadastra cliente novo se esse telefone ainda não existir — não
    // sobrescreve o nome de quem já está cadastrado (mesmo motivo de
    // `criarReservaManual`: telefone é a chave de identidade, não o nome).
    // Telefone tal como digitado/pré-preenchido — não o normalizado — pra
    // casar com o que já está em `clientes` (que pode estar guardado sem o DDI).
    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("telefone", telefone)
      .maybeSingle();
    if (!clienteExistente) {
      await supabase.from("clientes").insert({ telefone, nome: input.nome.trim() });
    }
  }

  const { data: chatExistente, error: chatErr } = await supabase
    .from("chats")
    .select("conversation_id")
    .eq("phone", telefoneWhatsapp)
    .maybeSingle();
  if (chatErr) return { ok: false, error: chatErr.message };

  let conversationId = chatExistente?.conversation_id as string | undefined;
  if (!conversationId) {
    conversationId = randomUUID();
    const { error: insertErr } = await supabase.from("chats").insert({
      conversation_id: conversationId,
      phone: telefoneWhatsapp,
      app: "noi",
    });
    if (insertErr) return { ok: false, error: insertErr.message };
  }

  const humano = await iniciarAtendimentoHumano(telefoneWhatsapp, conversationId);
  if (!humano.ok) return humano;

  const envio = await enviarMensagem(telefoneWhatsapp, input.mensagemInicial, conversationId);
  if (!envio.ok) return envio;

  revalidatePath("/conversas");
  return { ok: true, conversationId };
}
