import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  valueSuffix?: string;
  hint: string;
  highlighted?: boolean;
  progressPct?: number;
};

export function KpiCard({
  icon: Icon,
  label,
  value,
  valueSuffix,
  hint,
  highlighted,
  progressPct,
}: KpiCardProps) {
  return (
    <div
      className={
        "relative flex h-[138px] min-w-[200px] flex-1 flex-col gap-2 overflow-hidden rounded-[26px] border bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] px-[18px] py-4 " +
        (highlighted ? "border-[rgba(168,85,247,0.28)]" : "border-[var(--color-border-soft)]")
      }
    >
      {highlighted && (
        <div
          className="pointer-events-none absolute -left-20 -top-[90px] h-[200px] w-[420px] rounded-full opacity-60 blur-[60px]"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(168,85,247,0) 70%)",
          }}
        />
      )}
      <div className="relative flex items-center gap-[7px]">
        <Icon size={14} strokeWidth={2} className="text-[var(--color-text-muted)]" />
        <span className="text-[10.5px] font-medium tracking-[0.42px] text-[var(--color-text-muted)]">
          {label}
        </span>
      </div>
      <p className="relative font-display text-[36px] font-semibold leading-[1.2] text-[var(--color-text-primary)]">
        {value}
        {valueSuffix && (
          <span className="font-display text-[19px] font-normal text-[var(--color-text-muted)]"> {valueSuffix}</span>
        )}
      </p>
      <p className="relative text-[11.5px] text-[var(--color-text-muted)]">{hint}</p>
      {typeof progressPct === "number" && (
        <div className="relative mt-auto h-[5px] w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#a855f7] to-[#7c3aed]"
            style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
          />
        </div>
      )}
    </div>
  );
}
