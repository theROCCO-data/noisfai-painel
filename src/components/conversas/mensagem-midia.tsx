"use client";

import { useState } from "react";
import { AudioPlayer } from "@/components/conversas/audio-player";

export function MensagemMidia({ url, tipo }: { url: string; tipo: "image" | "audio" | "video" }) {
  const [zoom, setZoom] = useState(false);

  if (tipo === "audio") {
    return <AudioPlayer url={url} />;
  }

  if (tipo === "video") {
    return <video controls src={url} className="max-h-[320px] max-w-[320px] rounded-[12px]" />;
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
