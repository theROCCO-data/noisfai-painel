"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { AudioPlayer } from "@/components/conversas/audio-player";

export function MensagemMidia({
  url,
  tipo,
  nomeArquivo,
}: {
  url: string;
  tipo: "image" | "audio" | "video" | "document";
  nomeArquivo?: string | null;
}) {
  const [zoom, setZoom] = useState(false);

  if (tipo === "audio") {
    return <AudioPlayer url={url} />;
  }

  if (tipo === "video") {
    return <video controls src={url} className="max-h-[320px] max-w-[320px] rounded-[12px]" />;
  }

  if (tipo === "document") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2.5 hover:bg-white/[0.07]"
      >
        <FileText size={22} className="shrink-0 text-[var(--color-text-muted)]" />
        <span className="truncate text-[13px] text-[var(--color-text-primary)]">{nomeArquivo || "Documento"}</span>
      </a>
    );
  }

  return (
    <>
      <img
        src={url}
        alt="Imagem enviada"
        onClick={() => setZoom(true)}
        className="max-h-[320px] max-w-[320px] cursor-zoom-in rounded-[12px] object-cover"
      />
      {zoom && (
        <div
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-6"
        >
          <img src={url} alt="Imagem enviada (ampliada)" className="max-h-full max-w-full rounded-[8px]" />
        </div>
      )}
    </>
  );
}
