"use client";

import { useEffect, useState } from "react";

function horaAtual() {
  return new Date().toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Relógio ao vivo (horário de Brasília) — atualiza sozinho, sem precisar recarregar a página. */
export function Relogio() {
  const [hora, setHora] = useState<string | null>(null);

  useEffect(() => {
    setHora(horaAtual());
    const id = setInterval(() => setHora(horaAtual()), 1000);
    return () => clearInterval(id);
  }, []);

  // evita mismatch de hidratação: só mostra depois de montar no client
  if (!hora) return null;

  return <span>{hora}</span>;
}
