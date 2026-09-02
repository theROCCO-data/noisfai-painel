"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Substitui o F5 manual: re-busca os Server Components da rota /conversas
 * (lista + thread aberta) periodicamente, pra mensagens novas do bot/cliente
 * aparecerem sozinhas. Não renderiza nada — só dispara router.refresh().
 */
export function AutoRefresh({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
