"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/data/reservas-actions";

const CARGOS_PODEM_MUDAR_CARGO = ["desenvolvedor", "proprietário", "proprietario", "gerente"];

export async function atualizarPerfil(formData: FormData): Promise<ActionResult> {
  const nome = String(formData.get("nome") ?? "").trim();
  const cargoEnviado = String(formData.get("cargo") ?? "").trim();
  if (!nome) return { ok: false, error: "Nome não pode ficar vazio." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  // ninguém pode se auto-promover: só quem já é desenvolvedor/proprietário/
  // gerente pode mudar o próprio cargo por aqui — os demais mantêm o cargo
  // atual mesmo que enviem outro valor (mudança de cargo pra eles precisa
  // vir de alguém com permissão, editando via "Usuários e permissões").
  //
  // cargoAtual vem de app_metadata (nunca user_metadata): esse campo só o
  // servidor consegue escrever, via service_role — se estivesse em
  // user_metadata, qualquer usuário logado poderia se auto-promover
  // chamando supabase.auth.updateUser() direto pelo navegador, ignorando
  // completamente essa checagem.
  const cargoAtual = (user.app_metadata?.cargo as string | undefined) ?? "";
  const podeMudarCargo = CARGOS_PODEM_MUDAR_CARGO.includes(cargoAtual.toLowerCase());
  const cargo = podeMudarCargo ? cargoEnviado : cargoAtual;

  const { error } = await supabase.auth.updateUser({ data: { nome } });
  if (error) return { ok: false, error: error.message };

  if (podeMudarCargo && cargo !== cargoAtual) {
    const admin = createAdminClient();
    const { error: cargoErr } = await admin.auth.admin.updateUserById(user.id, { app_metadata: { cargo } });
    if (cargoErr) return { ok: false, error: cargoErr.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Salva a foto de perfil sozinha, assim que escolhida — mesmo padrão do
 * upload de logo da sidebar (LogoUploadButton), pra não depender do usuário
 * lembrar de clicar em "Salvar alterações" depois de trocar a foto.
 */
export async function atualizarAvatar(formData: FormData): Promise<ActionResult> {
  const arquivo = formData.get("avatarArquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, error: "Nenhum arquivo enviado." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const admin = createAdminClient();
  const extensao = arquivo.name.split(".").pop() || "jpg";
  const caminho = `avatares/${user.id}-${Date.now()}.${extensao}`;

  const { error: uploadErr } = await admin.storage
    .from("painel-uploads")
    .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });

  if (uploadErr) return { ok: false, error: `Falha no upload da foto: ${uploadErr.message}` };

  const { data: publicUrl } = admin.storage.from("painel-uploads").getPublicUrl(caminho);

  const { error } = await supabase.auth.updateUser({ data: { avatarUrl: publicUrl.publicUrl } });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
