"use client";

import { useState } from "react";

function mascarar(valor: string): string {
  const digits = valor.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function MaskedCpfInput({
  name,
  defaultValue,
  required,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [valor, setValor] = useState(mascarar(defaultValue ?? ""));

  return (
    <input
      type="text"
      inputMode="numeric"
      name={name}
      placeholder="000.000.000-00"
      value={valor}
      onChange={(e) => setValor(mascarar(e.target.value))}
      maxLength={14}
      required={required}
      className="dialog-input"
    />
  );
}
