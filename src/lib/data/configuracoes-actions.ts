"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/data/reservas-actions";

export async function atualizarLogo(formData: FormData): Promise<ActionResult> {
  const supabase = createAdminClient();
  const arquivo = formData.get("logoArquivo");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, error: "Selecione uma imagem." };
  }

  const extensao = arquivo.name.split(".").pop() || "png";
  const caminho = `logo-painel/${Date.now()}.${extensao}`;

  const { error: uploadErr } = await supabase.storage
    .from("painel-uploads")
    .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });

  if (uploadErr) return { ok: false, error: `Falha no upload: ${uploadErr.message}` };

  const { data: publicUrl } = supabase.storage.from("painel-uploads").getPublicUrl(caminho);

  const { error } = await supabase
    .from("configuracoes_painel")
    .update({ logo_url: publicUrl.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
