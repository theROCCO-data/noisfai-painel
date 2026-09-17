import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * `cache()` (React, por request) — chamada em quase toda página/layout do
 * Painel; sem isso, uma navegação que renderiza layout+page (ex.: abrir uma
 * conversa) bate 2x no `supabase.auth.getUser()` pra buscar exatamente o
 * mesmo usuário.
 */
export const getCurrentStaffUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // cargo mora em app_metadata (só o servidor, via service_role, consegue
  // escrever nele) — NUNCA em user_metadata, que o próprio usuário edita
  // direto pela API do Supabase Auth. Só quem foi convidado pela tela de
  // Configurações (`convidarUsuario`) tem esse campo gravado. Uma conta
  // criada direto contra `/auth/v1/signup` (a chave anon é pública, e o
  // cadastro por e-mail está habilitado no projeto) nunca passa por ali,
  // então `app_metadata` vem vazio -- tratar isso como "cargo padrão Equipe"
  // era uma brecha real: qualquer cadastro externo virava um usuário válido
  // com acesso ao Painel inteiro. Achado em auditoria de segurança 17/09/2026.
  const cargo = user.app_metadata?.cargo as string | undefined;
  if (!cargo) return null;

  const nome = (user.user_metadata?.nome as string | undefined) ?? user.email?.split("@")[0] ?? "Equipe";
  const avatarUrl = (user.user_metadata?.avatarUrl as string | undefined) ?? null;

  return { id: user.id, name: nome, role: cargo, email: user.email ?? "", avatarUrl };
});
