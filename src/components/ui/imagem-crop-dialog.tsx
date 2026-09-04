"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { X, ZoomIn } from "lucide-react";
import { recortarImagem } from "@/lib/crop-imagem";
import { useEscapeClose } from "@/hooks/use-escape-close";

export function ImagemCropDialog({
  imageSrc,
  onCancel,
  onConfirm,
  salvando,
}: {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
  salvando?: boolean;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_area: Area, areaEmPixels: Area) => {
    setAreaPixels(areaEmPixels);
  }, []);

  async function confirmar() {
    if (!areaPixels) return;
    const blob = await recortarImagem(imageSrc, areaPixels);
    onConfirm(blob);
  }

  useEscapeClose(true, onCancel);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[380px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[16px] font-semibold text-[var(--color-text-primary)]">Ajustar imagem</h2>
          <button onClick={onCancel} aria-label="Fechar" className="text-[var(--color-text-muted)]">
            <X size={18} />
          </button>
        </div>

        <div className="relative h-[260px] w-full overflow-hidden rounded-[14px] bg-black/40">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <ZoomIn size={15} className="shrink-0 text-[var(--color-text-muted)]" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[#a855f7]"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-[999px] border border-white/[0.14] px-5 text-[13px] font-medium text-[var(--color-text-secondary)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={salvando}
            className="h-9 rounded-[999px] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
            style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
