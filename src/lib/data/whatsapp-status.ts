import "server-only";
import { getInstanceInfo, type EvolutionInstanceInfo } from "@/lib/evolution/client";

export type WhatsappStatus = EvolutionInstanceInfo;

/** Estado da conexão do WhatsApp da instância, pro widget no rodapé do menu. */
export async function getWhatsappStatus(): Promise<WhatsappStatus> {
  return getInstanceInfo();
}
