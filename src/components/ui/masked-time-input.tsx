"use client";

import { useState } from "react";

function mascarar(valor: string): string {
  const digits = valor.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function MaskedTimeInput({
  name,
  defaultValue,
  required,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [valor, setValor] = useState(defaultValue?.slice(0, 5) ?? "");

  return (
    <input
      type="text"
      inputMode="numeric"
      name={name}
      placeholder="--:--"
      value={valor}
      onChange={(e) => setValor(mascarar(e.target.value))}
      maxLength={5}
      required={required}
      pattern="([01]\d|2[0-3]):[0-5]\d"
      title="Horário no formato hh:mm"
      className="dialog-input"
    />
  );
}
