"use server";

import { getInstanceInfo, getQrCode, logoutInstance, type EvolutionInstanceInfo, type EvolutionQrCode } from "@/lib/evolution/client";
import type { ActionResult } from "@/lib/data/reservas-actions";

/** Pro widget de status no rodapé do menu poder consultar via Server Action (Client Component não pode importar `evolution/client.ts`, que é `server-only`). */
export async function verificarStatusWhatsapp(): Promise<EvolutionInstanceInfo> {
  return getInstanceInfo();
}

/** Idem, pra buscar/renovar o QR code enquanto o modal de conexão está aberto. */
export async function obterQrCodeWhatsapp(): Promise<EvolutionQrCode> {
  return getQrCode();
}

export async function desconectarWhatsapp(): Promise<ActionResult> {
  try {
    await logoutInstance();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao desconectar." };
  }
}
