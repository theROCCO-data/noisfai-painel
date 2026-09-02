import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ponto de retorno do link de "esqueceu sua senha" enviado por e-mail pelo
 * Supabase. Troca o `code` (PKCE) pela sessão e manda pra tela de nova senha.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/redefinir-senha";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=link_invalido`);
}
