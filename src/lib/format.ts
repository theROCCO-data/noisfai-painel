// Helpers de formatação puros — sem "server-only", seguros pra importar
// em Client Components (ex.: componentes de lista que destacam item ativo).

export function formatTelefoneBR(phone: string) {
  // formato E.164-ish do WhatsApp: 55DDXXXXXXXXX
  const digits = phone.replace(/\D/g, "");
  const semPais = digits.startsWith("55") ? digits.slice(2) : digits;
  if (semPais.length === 11) {
    return `(${semPais.slice(0, 2)}) ${semPais.slice(2, 7)}-${semPais.slice(7)}`;
  }
  if (semPais.length === 10) {
    return `(${semPais.slice(0, 2)}) ${semPais.slice(2, 6)}-${semPais.slice(6)}`;
  }
  return phone;
}

export function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TZ = "America/Sao_Paulo";

function diaISO(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Chave de dia (America/Sao_Paulo) pra comparar se duas mensagens caíram no mesmo dia. */
export function diaChave(iso: string) {
  return diaISO(new Date(iso));
}

/** Rótulo tipo WhatsApp pro separador de data: "Hoje", "Ontem" ou "23 de setembro de 2026". */
export function formatSeparadorData(iso: string) {
  const data = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  if (diaISO(data) === diaISO(hoje)) return "Hoje";
  if (diaISO(data) === diaISO(ontem)) return "Ontem";

  return data.toLocaleDateString("pt-BR", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
