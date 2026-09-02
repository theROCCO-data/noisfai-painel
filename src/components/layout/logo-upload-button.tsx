"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Pencil, RefreshCw } from "lucide-react";
import { atualizarLogo } from "@/lib/data/configuracoes-actions";
import { ImagemCropDialog } from "@/components/ui/imagem-crop-dialog";

export function LogoUploadButton({ logoUrl }: { logoUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const [menuAberto, setMenuAberto] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    const localUrl = URL.createObjectURL(blob);
    setPreview(localUrl);
    setCropSrc(null);

    const file = new File([blob], "logo.png", { type: "image/png" });
    const formData = new FormData();
    formData.set("logoArquivo", file);
    startTransition(async () => {
      const result = await atualizarLogo(formData);
      if (!result.ok) {
        alert(`Não deu pra trocar a logo: ${result.error}`);
        setPreview(logoUrl);
      }
    });
  }

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        title="Clique para editar a logo"
        onClick={abrirMenuOuArquivo}
        disabled={pending}
        className="relative flex size-[30px] shrink-0 items-center justify-center overflow-hidden rounded-[13px] shadow-[0px_10px_24px_-8px_rgba(168,85,247,0.6)] disabled:opacity-60"
        style={!preview ? { backgroundImage: "linear-gradient(135deg, #a855f7 14.286%, #7c3aed 85.714%)" } : undefined}
      >
        {preview ? (
          <Image src={preview} alt="Logo" fill sizes="30px" className="object-cover" unoptimized />
        ) : (
          <span className="font-display text-[14.5px] font-semibold text-white">N</span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {menuAberto && (
        <div className="absolute left-0 top-[36px] z-20 w-[190px] overflow-hidden rounded-[12px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-1.5 shadow-xl">
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
            Substituir logo
          </button>
        </div>
      )}

      {cropSrc && (
        <ImagemCropDialog imageSrc={cropSrc} salvando={pending} onCancel={() => setCropSrc(null)} onConfirm={salvarRecorte} />
      )}
    </div>
  );
}
