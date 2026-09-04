"use client";

import { useState } from "react";

/**
 * Mostra bonito na tela ("(21) 99752-9056", sem o DDI 55 — é assim que a
 * maioria dos telefones já é digitada/salva no sistema), mas o valor de
 * verdade submetido no form (o input escondido, mesmo `name`) é só
 * dígitos. Diferente do CPF, que já é salvo com pontuação no banco — aqui
 * a pontuação é só visual. O "55" é completado sozinho na hora de mandar
 * pro WhatsApp (`normalizarTelefoneWhatsapp` em conversas-actions.ts).
 */
/** Tira o "55" de números que já vieram com DDI (ex: de `chats.phone`) — aqui é sempre só DDD + número. */
function semDDI(digits: string): string {
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
}

function mascarar(valor: string): string {
  const digits = semDDI(valor.replace(/\D/g, "")).slice(0, 11);
  const ddd = digits.slice(0, 2);
  const resto = digits.slice(2);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${ddd}`;
  if (resto.length === 0) return `(${ddd})`;
  if (resto.length <= 5) return `(${ddd}) ${resto}`;
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
}

export function MaskedPhoneInput({
  name,
  defaultValue,
  required,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [texto, setTexto] = useState(mascarar(defaultValue ?? ""));
  const digits = texto.replace(/\D/g, "");

  return (
    <>
      <input type="hidden" name={name} value={digits} />
      <input
        type="text"
        inputMode="numeric"
        placeholder="(21) 99999-9999"
        value={texto}
        onChange={(e) => setTexto(mascarar(e.target.value))}
        maxLength={15}
        required={required}
        className="dialog-input"
      />
    </>
  );
}
