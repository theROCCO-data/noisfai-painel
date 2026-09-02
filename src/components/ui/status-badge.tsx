const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  confirmada: { bg: "rgba(74,222,128,0.13)", border: "rgba(74,222,128,0.24)", text: "#4ade80", label: "CONFIRMADO" },
  confirmado: { bg: "rgba(74,222,128,0.13)", border: "rgba(74,222,128,0.24)", text: "#4ade80", label: "CONFIRMADO" },
  pendente: { bg: "rgba(251,191,36,0.13)", border: "rgba(251,191,36,0.24)", text: "#fbbf24", label: "PENDENTE" },
  cancelado: { bg: "rgba(248,113,113,0.13)", border: "rgba(248,113,113,0.24)", text: "#f87171", label: "CANCELADO" },
  compareceu: { bg: "rgba(125,211,252,0.13)", border: "rgba(125,211,252,0.24)", text: "#7dd3fc", label: "COMPARECEU" },
  nao_compareceu: { bg: "rgba(251,146,60,0.13)", border: "rgba(251,146,60,0.24)", text: "#fb923c", label: "NÃO COMPARECEU" },
  humano: { bg: "rgba(168,85,247,0.16)", border: "rgba(168,85,247,0.3)", text: "#d8b4fe", label: "HUMANO" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? {
    bg: "rgba(135,128,159,0.13)",
    border: "rgba(135,128,159,0.24)",
    text: "#87809f",
    label: status.toUpperCase(),
  };

  return (
    <span
      className="flex h-[22px] shrink-0 items-center justify-center rounded-[11px] border px-[9px] text-[11px] font-semibold tracking-[0.11px]"
      style={{ backgroundColor: style.bg, borderColor: style.border, color: style.text }}
    >
      {style.label}
    </span>
  );
}
