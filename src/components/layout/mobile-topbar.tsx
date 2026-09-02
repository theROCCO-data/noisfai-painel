import Image from "next/image";
import Link from "next/link";

export function MobileTopBar({
  logoUrl,
  userName,
  avatarUrl,
}: {
  logoUrl: string | null;
  userName: string;
  avatarUrl: string | null;
}) {
  const iniciais = userName
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className="relative z-30 flex shrink-0 items-center justify-between border-b border-[var(--color-border-soft)] bg-[var(--color-bg)]/90 px-4 pb-3 backdrop-blur lg:hidden"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[11px]"
          style={{ backgroundImage: "linear-gradient(135deg, #a855f7 14.286%, #7c3aed 85.714%)" }}
        >
          {logoUrl ? (
            <Image src={logoUrl} alt="" fill sizes="32px" className="object-cover" unoptimized />
          ) : (
            <span className="font-display text-[13px] font-semibold text-white">N</span>
          )}
        </div>
        <span className="font-display text-[14px] font-semibold text-[var(--color-text-primary)]">Painel NOI</span>
      </div>

      <Link
        href="/configuracoes"
        className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(168,85,247,0.32)] bg-[#1d1436]"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" fill sizes="32px" className="object-cover" unoptimized />
        ) : (
          <span className="text-[11px] font-semibold text-[#d8b4fe]">{iniciais}</span>
        )}
      </Link>
    </header>
  );
}
