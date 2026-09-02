import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  ativo: boolean;
};

export async function listUsuarios(): Promise<Usuario[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw new Error(`listUsuarios: ${error.message}`);

  return data.users
    .map((u) => ({
      id: u.id,
      nome: (u.user_metadata?.nome as string | undefined) ?? u.email?.split("@")[0] ?? "—",
      email: u.email ?? "",
      // app_metadata, não user_metadata — ver nota de segurança em src/lib/auth.ts
      cargo: (u.app_metadata?.cargo as string | undefined) ?? "Equipe",
      ativo: !!u.email_confirmed_at,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
