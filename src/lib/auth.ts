import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentStaffUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const nome = (user.user_metadata?.nome as string | undefined) ?? user.email?.split("@")[0] ?? "Equipe";
  const cargo = (user.user_metadata?.cargo as string | undefined) ?? "Equipe";
  const avatarUrl = (user.user_metadata?.avatarUrl as string | undefined) ?? null;

  return { id: user.id, name: nome, role: cargo, email: user.email ?? "", avatarUrl };
}
