"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { X, Camera } from "lucide-react";
import { atualizarEdicaoJH } from "@/lib/data/jantar-harmonizado-actions";
import { toast } from "@/lib/toast";
import { Toggle } from "@/components/ui/toggle";
import { DatePicker } from "@/components/ui/date-picker";
import { MaskedTimeInput } from "@/components/ui/masked-time-input";
import { CardapioJHFields } from "@/components/jantar-harmonizado/cardapio-jh-fields";
import { useEscapeClose } from "@/hooks/use-escape-close";
import type { EdicaoJH } from "@/lib/data/jantar-harmonizado";

export function EditarEdicaoDialog({
  edicao,
  trigger,
  modo = "editar",
}: {
  edicao: EdicaoJH;
  trigger: string;
  modo?: "editar" | "nova";
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(modo === "nova" ? null : edicao.imagemUrl);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("id", String(edicao.id));
    startTransition(async () => {
      const result = await atualizarEdicaoJH(formData);
      if (result.ok) {
        setOpen(false);
        toast("Edição salva.");
      } else {
        setError(result.error);
      }
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  const defaults =
    modo === "nova"
      ? { titulo: "", dataEvento: "", horaEvento: "", valorPessoa: edicao.valorPessoa, cotaVagas: edicao.cotaVagas ?? 40, imagemUrl: "", ativo: true }
      : {
          titulo: edicao.titulo,
          dataEvento: edicao.dataEvento,
          horaEvento: edicao.horaEvento ?? "",
          valorPessoa: edicao.valorPessoa,
          cotaVagas: edicao.cotaVagas ?? 40,
          imagemUrl: edicao.imagemUrl ?? "",
          ativo: edicao.ativo,
        };
  // "Nova edição" começa em branco/limpa (mesma linha reaproveitada, ver
  // comentário acima); "Editar edição" mantém o cardápio que já existe.
  const cardapioDefaults =
    modo === "nova"
      ? { intro: null, palestrante: null, etapas: [], regrasReserva: null }
      : { intro: edicao.cardapioIntro, palestrante: edicao.cardapioPalestrante, etapas: edicao.cardapioEtapas, regrasReserva: edicao.regrasReserva };

  useEscapeClose(open, () => setOpen(false));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          modo === "nova"
            ? "flex h-[34px] w-[166px] items-center justify-center rounded-[999px] text-[13px] font-semibold text-white"
            : "flex h-[34px] w-[166px] items-center justify-center rounded-[999px] border border-[var(--color-border-soft)] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-white/[0.03]"
        }
        style={modo === "nova" ? { backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" } : undefined}
      >
        {trigger}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-[440px] flex-col gap-5 overflow-y-auto rounded-[22px] border border-[rgba(255,255,255,0.07)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] px-[26px] py-[22px]"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                {modo === "nova" ? "Nova edição" : "Editar edição"}
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            {modo === "nova" && (
              <p className="-mt-3 text-[11.5px] leading-[1.5] text-[var(--color-text-muted)]">
                Como só existe uma edição de Jantar Harmonizado cadastrada, começar uma nova atualiza os dados
                dessa mesma edição em vez de criar um registro separado.
              </p>
            )}

            <form action={handleSubmit} className="flex flex-col gap-5">
              <div className="flex items-center gap-3.5">
                <div className="relative flex size-[66px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#241f3d]">
                  {preview ? (
                    <Image src={preview} alt="" fill sizes="88px" className="object-cover" unoptimized />
                  ) : (
                    <span className="text-[24px]">🍷</span>
                  )}
                  <label className="absolute bottom-1 right-1 flex size-[22px] cursor-pointer items-center justify-center rounded-[11px] border border-[#363050] bg-[#05060a]">
                    <Camera size={13} className="text-[var(--color-text-secondary)]" />
                    <input name="imagemArquivo" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] text-[var(--color-text-secondary)]">Imagem do evento</span>
                  <span className="text-[11.5px] text-[var(--color-text-secondary)]">Clique no ícone de câmera para trocar</span>
                </div>
              </div>
              <input type="hidden" name="imagemUrl" value={defaults.imagemUrl} />

              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[var(--color-text-secondary)]">Nome da edição</span>
                <input name="titulo" defaultValue={defaults.titulo} placeholder="Edição de setembro" required className="dialog-input" />
              </label>

              <div className="flex gap-3.5">
                <label className="flex flex-1 flex-col gap-1.5">
                  <span className="text-[13px] text-[var(--color-text-secondary)]">Data</span>
                  <DatePicker name="dataEvento" defaultValue={defaults.dataEvento} required />
                </label>
                <label className="flex flex-1 flex-col gap-1.5">
                  <span className="text-[13px] text-[var(--color-text-secondary)]">Hora (opcional)</span>
                  <MaskedTimeInput name="horaEvento" defaultValue={defaults.horaEvento} />
                </label>
              </div>

              <div className="flex gap-3.5">
                <label className="flex flex-1 flex-col gap-1.5">
                  <span className="text-[13px] text-[var(--color-text-secondary)]">Valor por pessoa</span>
                  <input
                    name="valorPessoa"
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={defaults.valorPessoa}
                    required
                    className="dialog-input"
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1.5">
                  <span className="text-[13px] text-[var(--color-text-secondary)]">Cota de vagas</span>
                  <input name="cotaVagas" type="number" min={0} defaultValue={defaults.cotaVagas} required className="dialog-input" />
                </label>
              </div>

              <Toggle name="ativo" defaultChecked={defaults.ativo} label="Edição ativa (visível para o bot)" />

              <div className="flex flex-col gap-1.5 border-t border-white/[0.07] pt-4">
                <span className="text-[13px] font-medium text-[var(--color-text-primary)]">Cardápio do jantar</span>
                <CardapioJHFields
                  defaultIntro={cardapioDefaults.intro}
                  defaultPalestrante={cardapioDefaults.palestrante}
                  defaultEtapas={cardapioDefaults.etapas}
                  defaultRegrasReserva={cardapioDefaults.regrasReserva}
                />
              </div>

              {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}

              <div className="flex justify-end gap-2.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 rounded-[999px] border border-[rgba(255,255,255,0.14)] px-4 text-[13px] text-[var(--color-text-secondary)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="h-9 rounded-[999px] px-4 text-[13px] font-semibold text-white shadow-[0px_4px_12px_0px_rgba(168,85,247,0.35)] disabled:opacity-60"
                  style={{ backgroundImage: "linear-gradient(90deg, #a855f7, #6d28d9)" }}
                >
                  {pending ? "Salvando..." : modo === "nova" ? "Criar edição" : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
