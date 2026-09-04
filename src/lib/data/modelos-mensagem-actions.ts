"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaffUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/data/reservas-actions";

export async function criarModeloMensagem(formData: FormData): Promise<ActionResult> {
  const nome = String(formData.get("nome") ?? "").trim();
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!nome || !conteudo) return { ok: false, error: "Nome e texto do modelo são obrigatórios." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("modelos_mensagem").insert({ nome, tipo: "texto", conteudo });
  if (error) return { ok: false, error: error.message };

  revalidarModelos();
  return { ok: true };
}

export async function editarModeloMensagem(id: number, formData: FormData): Promise<ActionResult> {
  const nome = String(formData.get("nome") ?? "").trim();
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!nome || !conteudo) return { ok: false, error: "Nome e texto do modelo são obrigatórios." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("modelos_mensagem").update({ nome, conteudo }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidarModelos();
  return { ok: true };
}

export async function excluirModeloMensagem(id: number): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("modelos_mensagem").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidarModelos();
  return { ok: true };
}

/** Modelos aparecem em Conversas (lista + composer) e no dialog de Nova conversa (lá dentro de Clientes também). */
function revalidarModelos() {
  revalidatePath("/conversas");
  revalidatePath("/clientes");
}

/** Favorito é por usuário logado — marcar/desmarcar não afeta o que os outros atendentes veem. */
export async function alternarFavoritoModelo(modeloId: number, favoritar: boolean): Promise<ActionResult> {
  const staff = await getCurrentStaffUser();
  if (!staff) return { ok: false, error: "Não autenticado." };

  const supabase = createAdminClient();

  if (favoritar) {
    const { error } = await supabase
      .from("modelos_mensagem_favoritos")
      .upsert({ user_id: staff.id, modelo_id: modeloId }, { onConflict: "user_id,modelo_id" });
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("modelos_mensagem_favoritos")
      .delete()
      .eq("user_id", staff.id)
      .eq("modelo_id", modeloId);
    if (error) return { ok: false, error: error.message };
  }

  revalidarModelos();
  return { ok: true };
}
