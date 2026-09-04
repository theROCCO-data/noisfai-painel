"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/data/reservas-actions";

export async function criarFatoRestaurante(formData: FormData): Promise<ActionResult> {
  const supabase = createAdminClient();

  const categoria = String(formData.get("categoria") ?? "").trim();
  const topico = String(formData.get("topico") ?? "").trim();
  const informacao = String(formData.get("informacao") ?? "").trim();

  if (!categoria || !topico || !informacao) {
    return { ok: false, error: "Preencha categoria, tópico e informação." };
  }

  const { error } = await supabase.from("perfil_restaurante").insert({ categoria, topico, informacao, ordem: 999 });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/perfil-restaurante");
  return { ok: true };
}

export async function editarFatoRestaurante(id: number, formData: FormData): Promise<ActionResult> {
  const supabase = createAdminClient();

  const categoria = String(formData.get("categoria") ?? "").trim();
  const topico = String(formData.get("topico") ?? "").trim();
  const informacao = String(formData.get("informacao") ?? "").trim();

  if (!categoria || !topico || !informacao) {
    return { ok: false, error: "Preencha categoria, tópico e informação." };
  }

  const { error } = await supabase.from("perfil_restaurante").update({ categoria, topico, informacao }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/perfil-restaurante");
  return { ok: true };
}

export async function excluirFatoRestaurante(id: number): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("perfil_restaurante").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/perfil-restaurante");
  return { ok: true };
}
