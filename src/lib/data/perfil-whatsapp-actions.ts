"use server";

import { getPerfilWhatsapp, type PerfilWhatsapp } from "@/lib/data/perfil-whatsapp";
import { buscarClientePorTelefone } from "@/lib/data/clientes";

export type PerfilContato = PerfilWhatsapp & {
  clienteId: number | null;
};

export async function buscarPerfilContato(telefone: string): Promise<PerfilContato> {
  const [perfil, cliente] = await Promise.all([getPerfilWhatsapp(telefone), buscarClientePorTelefone(telefone)]);

  // se o WhatsApp não tiver o pushName salvo, usa o nome cadastrado no
  // painel como fallback — mais confiável que deixar "não disponível"
  // quando a gente já sabe quem é o cliente.
  return {
    nome: perfil.nome ?? cliente?.nome ?? null,
    fotoUrl: perfil.fotoUrl,
    clienteId: cliente?.id ?? null,
  };
}
