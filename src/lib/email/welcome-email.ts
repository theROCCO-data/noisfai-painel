import "server-only";
import { Resend } from "resend";

/**
 * E-mail de boas-vindas com login/senha temporária pra um usuário novo do
 * Painel — best-effort: se falhar (sem RESEND_API_KEY configurada, domínio
 * não verificado, etc.), a conta já foi criada e a senha continua
 * aparecendo na tela do convite como fallback manual (ver `usuarios-actions.ts`).
 * Reaproveita a identidade visual real do Painel (cores/gradiente dos
 * botões e cartões), convertida pra valores hex fixos porque cliente de
 * e-mail não lê CSS vars.
 */
export async function enviarEmailBoasVindas(params: {
  nome: string;
  email: string;
  senhaTemporaria: string;
  cargo: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY/RESEND_FROM_EMAIL não configurados (.env.local).");
  }

  const resend = new Resend(apiKey);
  const linkAcesso = appUrl ? `${appUrl}/login` : "#";

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background-color:#08050f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#08050f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="max-width:440px;width:100%;background:linear-gradient(180deg,#161022 0%,#0e0a18 100%);border:1px solid rgba(168,85,247,0.18);border-radius:22px;overflow:hidden;">
          <tr>
            <td style="padding:36px 32px 8px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:16px;background:linear-gradient(163deg,#a855f7 14%,#6d28d9 86%);font-size:22px;line-height:52px;">🔑</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0;text-align:center;">
              <h1 style="margin:0;color:#f5f3fa;font-size:20px;font-weight:700;">Bem-vindo(a) ao Painel</h1>
              <p style="margin:8px 0 0;color:#a89fc0;font-size:13.5px;line-height:1.6;">
                ${params.nome}, sua conta foi criada como <strong style="color:#d8b4fe;">${params.cargo}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 4px;color:#7a7192;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Login</p>
                    <p style="margin:0 0 14px;color:#f5f3fa;font-size:14px;font-family:monospace;">${params.email}</p>
                    <p style="margin:0 0 4px;color:#7a7192;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Senha temporária</p>
                    <p style="margin:0;color:#f5f3fa;font-size:14px;font-family:monospace;">${params.senhaTemporaria}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;text-align:center;">
              <a href="${linkAcesso}" style="display:inline-block;background:linear-gradient(163deg,#a855f7 14%,#6d28d9 86%);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:999px;">
                Acessar o Painel
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 36px;text-align:center;">
              <p style="margin:0;color:#6b6280;font-size:11.5px;line-height:1.6;">
                Guarde essa senha num lugar seguro. Se não reconhece esse convite, ignore este e-mail.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from,
    to: params.email,
    subject: "Seu acesso ao Painel",
    html,
  });

  if (error) throw new Error(error.message);
}
