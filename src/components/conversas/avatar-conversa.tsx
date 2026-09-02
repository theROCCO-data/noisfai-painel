import Image from "next/image";

export function AvatarConversa({
  phone,
  fotoUrl,
  size = 50,
  radius = 16,
  className = "",
}: {
  phone: string;
  fotoUrl: string | null;
  size?: number;
  radius?: number;
  className?: string;
}) {
  const iniciais = phone.slice(-2);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-[rgba(168,85,247,0.35)] ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundImage: "linear-gradient(135deg, rgba(168,85,247,0.35) 14%, rgba(124,58,237,0.18) 86%)",
      }}
    >
      {fotoUrl ? (
        <Image src={fotoUrl} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized />
      ) : (
        <span className="text-[14px] font-semibold text-[#e9d5ff]">{iniciais}</span>
      )}
    </div>
  );
}
