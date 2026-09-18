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
 * 1) Realtime (Supabase Broadcast, canal "conversas", evento "nova_mensagem").
 *    Fase 4: a origem desse broadcast passou a ser um TRIGGER no banco
 *    (`trg_broadcast_nova_mensagem` em `chat_messages`, migration 027), que
 *    publica no instante em que a mensagem é GRAVADA. Como a thread agora lê
 *    do banco (Fase 3), o dado já está lá quando o aviso chega — some a
 *    corrida "aviso antes do dado" que existia com o broadcast antigo (que o
 *    node n8n disparava na chegada do webhook, antes da gravação). Por isso um
 *    único refresh por aviso basta (antes eram dois, o segundo ~1,5s depois).
 * 2) `intervalMs` continua existindo como rede de segurança -- se o
 *    WebSocket cair silenciosamente (acontece, é rede), a tela não fica
 *    presa esperando ele reconectar sozinho.
 */
export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("conversas")
      .on("broadcast", { event: "nova_mensagem" }, () => {
        router.refresh();
      })
      .subscribe();

    const id = setInterval(() => router.refresh(), intervalMs);
    return () => {
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, [router, intervalMs]);

  return null;
}
