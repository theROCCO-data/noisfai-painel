import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com service_role: ignora RLS. Usar SÓ em Server Components,
 * Server Actions ou Route Handlers. O import "server-only" quebra o build
 * se algum Client Component tentar importar este arquivo.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
