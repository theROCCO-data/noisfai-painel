import { NextRequest, NextResponse } from "next/server";
import { getBase64FromMediaMessage } from "@/lib/evolution/client";

/**
 * Proxy pra mídia de mensagens do WhatsApp: o navegador não consegue
 * renderizar a URL bruta da Evolution/Meta direto (mídia mandada pelo
 * cliente vem criptografada, `.enc`), então essa rota decripta server-side
 * e devolve os bytes prontos. Chamada pelos componentes de mídia da tela de
 * Conversas (`<img src="/api/evolution/midia?...">`).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get("id");
  const remoteJid = params.get("remoteJid");
  const fromMe = params.get("fromMe");
  if (!id || !remoteJid || !fromMe) {
    return NextResponse.json({ error: "Parâmetros id/remoteJid/fromMe obrigatórios." }, { status: 400 });
  }

  try {
    const { base64, mimetype } = await getBase64FromMediaMessage({
      id,
      remoteJid,
      fromMe: fromMe === "true",
    });
    const bytes = Buffer.from(base64, "base64");
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": mimetype || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: `Não foi possível carregar essa mídia: ${(e as Error).message}` }, { status: 502 });
  }
}
