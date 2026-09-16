"use server";

import { getInstanceInfo, getQrCode, type EvolutionInstanceInfo, type EvolutionQrCode } from "@/lib/evolution/client";

/** Pro widget de status no rodapé do menu poder consultar via Server Action (Client Component não pode importar `evolution/client.ts`, que é `server-only`). */
export async function verificarStatusWhatsapp(): Promise<EvolutionInstanceInfo> {
  return getInstanceInfo();
}

/** Idem, pra buscar/renovar o QR code enquanto o popover de conexão está aberto. */
export async function obterQrCodeWhatsapp(): Promise<EvolutionQrCode> {
  return getQrCode();
}
