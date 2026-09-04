"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Info, X, Phone, ExternalLink, Loader2 } from "lucide-react";
import { buscarPerfilContato, type PerfilContato } from "@/lib/data/perfil-whatsapp-actions";
import { formatTelefoneBR } from "@/lib/format";
import { useEscapeClose } from "@/hooks/use-escape-close";

export function PerfilContatoDialog({ telefone }: { telefone: string }) {
  const [open, setOpen] = useState(false);
  const [perfil, setPerfil] = useState<PerfilContato | null>(null);
  const [pending, startTransition] = useTransition();

  function abrir() {
    setOpen(true);
    if (!perfil) {
      startTransition(async () => {
        const result = await buscarPerfilContato(telefone);
        setPerfil(result);
      });
    }
  }

  const iniciais = telefone.slice(-2);

  useEscapeClose(open, () => setOpen(false));

  return (
    <>
      <button
        onClick={abrir}
        title="Ver perfil do contato"
        aria-label="Ver perfil do contato"
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-white/[0.06] hover:text-[var(--color-text-primary)]"
      >
        <Info size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-[360px] flex-col items-center gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6"
          >
            <div className="flex w-full items-center justify-between">
              <p className="font-display text-[15px] font-semibold text-[var(--color-text-primary)]">Perfil do contato</p>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            {pending && !perfil ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <Loader2 size={22} className="animate-spin text-[var(--color-text-muted)]" />
                <p className="text-[12.5px] text-[var(--color-text-muted)]">Buscando no WhatsApp...</p>
              </div>
            ) : (
              <>
                <div className="relative flex size-[84px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(168,85,247,0.35)]" style={{ backgroundImage: "linear-gradient(135deg, rgba(168,85,247,0.35) 14%, rgba(124,58,237,0.18) 86%)" }}>
                  {perfil?.fotoUrl ? (
                    <Image src={perfil.fotoUrl} alt="" fill sizes="84px" className="object-cover" unoptimized />
                  ) : (
                    <span className="text-[22px] font-semibold text-[#e9d5ff]">{iniciais}</span>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1">
                  <p className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
                    {perfil?.nome || "Nome não disponível no WhatsApp"}
                  </p>
                  <span className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)]">
                    <Phone size={13} className="text-[var(--color-text-muted)]" />
                    {formatTelefoneBR(telefone)}
                  </span>
                </div>

                {perfil?.clienteId ? (
                  <Link
                    href={`/clientes/${perfil.clienteId}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-[999px] border border-[rgba(168,85,247,0.3)] bg-[rgba(168,85,247,0.1)] py-2 text-[13px] font-medium text-[#d8b4fe] hover:bg-[rgba(168,85,247,0.16)]"
                  >
                    Ver histórico de reservas
                    <ExternalLink size={13} />
                  </Link>
                ) : (
                  <p className="text-center text-[12px] text-[var(--color-text-muted)]">
                    Esse número ainda não tem cadastro de cliente no painel.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
