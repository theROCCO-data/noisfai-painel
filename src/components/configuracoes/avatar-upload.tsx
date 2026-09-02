"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Pencil, RefreshCw } from "lucide-react";
import { atualizarAvatar } from "@/lib/auth-profile-actions";
import { ImagemCropDialog } from "@/components/ui/imagem-crop-dialog";

export function AvatarUpload({ avatarUrl, iniciais }: { avatarUrl: string | null; iniciais: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [menuAberto, setMenuAberto] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!menuAberto) return;
    function handleClickFora(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setMenuAberto(false);
    }
    document.addEventListener("click", handleClickFora);
    return () => document.removeEventListener("click", handleClickFora);
  }, [menuAberto]);

  function abrirMenuOuArquivo() {
    if (preview) setMenuAberto((o) => !o);
    else inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMenuAberto(false);
    setCropSrc(URL.createObjectURL(file));
  }

  function editarAtual() {
    if (!preview) return;
    setMenuAberto(false);
    setCropSrc(preview);
  }

  function salvarRecorte(blob: Blob) {
    setError(null);
    const localUrl = URL.createObjectURL(blob);
    setPreview(localUrl);
    setCropSrc(null);

    const file = new File([blob], "avatar.png", { type: "image/png" });
    const formData = new FormData();
    formData.set("avatarArquivo", file);
    startTransition(async () => {
      const result = await atualizarAvatar(formData);
      if (!result.ok) {
        setError(result.error);
        setPreview(avatarUrl);
      }
    });
  }

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-1.5">
      <button
        type="button"
        onClick={abrirMenuOuArquivo}
        disabled={pending}
        className="relative flex size-[90px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] disabled:opacity-60"
        style={!preview ? { backgroundImage: "linear-gradient(135deg, #a855f7 14%, #6d28d9 86%)" } : undefined}
      >
        {preview ? (
          <Image src={preview} alt="" fill sizes="90px" className="object-cover" unoptimized />
        ) : (
          <span className="font-display text-[26px] font-semibold text-white">{iniciais}</span>
        )}
        <span className="absolute bottom-1.5 right-1.5 flex size-[26px] items-center justify-center rounded-[9px] border border-[var(--color-border)] bg-[#05060a]">
          <Camera size={14} className="text-[var(--color-text-secondary)]" />
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {menuAberto && (
        <div className="absolute left-0 top-[96px] z-20 w-[190px] overflow-hidden rounded-[12px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-1.5 shadow-xl">
          <button
            type="button"
            onClick={editarAtual}
            className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[13px] text-[var(--color-text-primary)] hover:bg-white/[0.06]"
          >
            <Pencil size={14} className="text-[var(--color-text-muted)]" />
            Editar imagem atual
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuAberto(false);
              inputRef.current?.click();
            }}
            className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[13px] text-[var(--color-text-primary)] hover:bg-white/[0.06]"
          >
            <RefreshCw size={14} className="text-[var(--color-text-muted)]" />
            Substituir foto
          </button>
        </div>
      )}

      {pending && <span className="text-[11px] text-[var(--color-text-muted)]">Salvando...</span>}
      {error && <span className="max-w-[110px] text-[11px] text-[var(--color-status-red)]">{error}</span>}

      {cropSrc && (
        <ImagemCropDialog imageSrc={cropSrc} salvando={pending} onCancel={() => setCropSrc(null)} onConfirm={salvarRecorte} />
      )}
    </div>
  );
}
