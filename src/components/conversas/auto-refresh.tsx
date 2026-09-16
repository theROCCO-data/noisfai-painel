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
 *    WhatsApp" publica nesse canal assim que o webhook da Evolution chega,
 *    fazendo a tela reagir quase na hora.
 * 2) `intervalMs` continua existindo como rede de segurança -- se o
 *    WebSocket cair silenciosamente (acontece, é rede), a tela não fica
 *    presa esperando ele reconectar sozinho.
 *
 * O broadcast dispara no exato instante em que o webhook chega no n8n --
 * mas a Evolution pode levar uma fração de segundo a mais pra a mensagem
 * ficar de fato disponível no próprio histórico dela (findMessages). Sem
 * isso, dava pra ver a tela "reagir" na hora só que ainda com o conteúdo
 * velho (corrida entre o aviso e o dado ficando pronto) -- daí precisava de
 * F5 pra aparecer. Por isso o refresh acontece duas vezes por aviso: uma
 * na hora, outra ~1,5s depois, pra pegar o caso em que a primeira foi cedo
 * demais.
 */
export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("conversas")
      .on("broadcast", { event: "nova_mensagem" }, () => {
        router.refresh();
        setTimeout(() => router.refresh(), 1500);
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
