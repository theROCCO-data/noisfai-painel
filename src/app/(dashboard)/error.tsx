"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] px-6 py-16 text-center">
      <span className="flex size-[52px] items-center justify-center rounded-full border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] text-[var(--color-status-red)]">
        <AlertTriangle size={22} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">Algo deu errado</h2>
        <p className="max-w-[380px] text-[13.5px] leading-[1.6] text-[var(--color-text-secondary)]">
          Não deu pra carregar essa tela. Pode ter sido uma instabilidade rápida — tenta de novo.
        </p>
      </div>
      <button
        onClick={reset}
        className="mt-1 flex h-9 items-center gap-2 rounded-[999px] px-5 text-[13px] font-semibold text-white"
        style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
      >
        <RotateCw size={14} />
        Tentar novamente
      </button>
    </div>
  );
}
