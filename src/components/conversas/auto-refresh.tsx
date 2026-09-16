"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Substitui o F5 manual: re-busca os Server Components da rota /conversas
 * (lista + thread aberta) pra mensagens novas do bot/cliente aparecerem
 * sozinhas. Não renderiza nada — só dispara router.refresh().
 *
 * Dois gatilhos, não só um:
 * 1) Realtime (Supabase Broadcast, canal "conversas", evento "nova_mensagem")
 *    -- o node "Notifica Painel (Realtime)" no workflow "Atendimento
 *    WhatsApp" publica nesse canal a cada mensagem (cliente ou bot),
 *    fazendo a tela reagir na hora, sem esperar o próximo tick.
 * 2) `intervalMs` continua existindo como rede de segurança -- se o
 *    WebSocket cair silenciosamente (acontece, é rede), a tela não fica
 *    presa esperando ele reconectar sozinho.
 */
export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("conversas")
      .on("broadcast", { event: "nova_mensagem" }, () => router.refresh())
      .subscribe();

    const id = setInterval(() => router.refresh(), intervalMs);
    return () => {
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, [router, intervalMs]);

  return null;
}
