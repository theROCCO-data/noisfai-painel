import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentStaffUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const nome = (user.user_metadata?.nome as string | undefined) ?? user.email?.split("@")[0] ?? "Equipe";
  // cargo mora em app_metadata (só o servidor, via service_role, consegue escrever nele) —
  // NUNCA em user_metadata, que o próprio usuário edita direto pela API do Supabase Auth.
  const cargo = (user.app_metadata?.cargo as string | undefined) ?? "Equipe";
  const avatarUrl = (user.user_metadata?.avatarUrl as string | undefined) ?? null;

  return { id: user.id, name: nome, role: cargo, email: user.email ?? "", avatarUrl };
}
