"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { subscribeToast, dismissToast, type ToastItem } from "@/lib/toast";

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToast(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex w-[300px] items-start gap-2.5 rounded-[14px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-3.5 shadow-xl"
        >
          {t.tipo === "sucesso" ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--color-status-green)]" />
          ) : (
            <XCircle size={16} className="mt-0.5 shrink-0 text-[var(--color-status-red)]" />
          )}
          <p className="flex-1 text-[13px] leading-[1.4] text-[var(--color-text-primary)]">{t.mensagem}</p>
          <button onClick={() => dismissToast(t.id)} aria-label="Fechar aviso" className="shrink-0 text-[var(--color-text-muted)]">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
