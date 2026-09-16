/**
 * Formato canônico usado pelo bot/Evolution/WhatsApp: DDI 55 + DDD + número
 * (12 ou 13 dígitos). Toda conversa, reserva e confirmação que passa pelo
 * n8n usa esse formato — é o que liga um telefone à conversa de WhatsApp
 * de verdade.
 */
export function normalizarTelefoneWhatsapp(telefoneBruto: string): string {
  const digits = telefoneBruto.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function semDDI(digits: string): string {
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits.slice(2);
  return digits;
}

/**
 * Os diálogos manuais do Painel (Nova Reserva, Novo Evento, Nova Conversa)
 * historicamente salvavam `clientes.telefone` SEM o DDI 55 (`MaskedPhoneInput`
 * manda só DDD+número no campo escondido do form), enquanto todo cadastro
 * que passa pelo bot/n8n usa COM o DDI -- como a busca de cliente existente
 * comparava telefone como texto puro, isso criava um cliente DUPLICADO toda
 * vez que alguém criava manualmente uma reserva/evento pra um telefone que
 * já existia via WhatsApp (achado e corrigido 16/09/2026, caso da Gabriela
 * Santos Barbosa -- o evento dela foi parar num cliente novo em vez do
 * cadastro real, que já tinha todo o histórico).
 *
 * Retorna os dois formatos possíveis pra buscar o cadastro real independente
 * de qual foi usado quando ele foi criado primeiro.
 */
export function formatosPossiveisDeTelefone(telefoneBruto: string): string[] {
  const digits = telefoneBruto.replace(/\D/g, "");
  return Array.from(new Set([normalizarTelefoneWhatsapp(digits), semDDI(digits)]));
}
