import "server-only";
import { fetchProfilePicUrl, findMessages } from "@/lib/evolution/client";
import { telefoneParaRemoteJid } from "@/lib/evolution/mapper";

export type PerfilWhatsapp = {
  nome: string | null;
  fotoUrl: string | null;
};

/**
 * Busca, ao vivo, nome e foto de perfil salvos no WhatsApp — direto na
 * Evolution API (antes passava por um workflow-ponte no n8n; não precisa
 * mais, o Painel já fala com a Evolution direto pra ler Conversas). Só é
 * chamado sob demanda (clique no popup de perfil), nunca como parte do
 * polling da tela de Conversas.
 */
export async function getPerfilWhatsapp(telefone: string): Promise<PerfilWhatsapp> {
  try {
    const [fotoUrl, pagina] = await Promise.all([
      fetchProfilePicUrl(telefone),
      findMessages(telefoneParaRemoteJid(telefone), { tamanhoPagina: 10 }).catch(() => null),
    ]);
    const doCliente = pagina?.records.find((r) => !r.key.fromMe);
    return { nome: doCliente?.pushName ?? null, fotoUrl };
  } catch {
    return { nome: null, fotoUrl: null };
  }
}
