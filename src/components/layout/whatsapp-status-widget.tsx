"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, XCircle, CheckCircle2, Settings } from "lucide-react";
import { verificarStatusWhatsapp, obterQrCodeWhatsapp } from "@/lib/data/whatsapp-status-actions";
import type { WhatsappStatus } from "@/lib/data/whatsapp-status";
import { useEscapeClose } from "@/hooks/use-escape-close";

function formatarNumero(numero: string | null): string | null {
  if (!numero) return null;
  const digits = numero.replace(/\D/g, "").replace(/^55/, "");
  if (digits.length < 10) return numero;
  const ddd = digits.slice(0, 2);
  const resto = digits.slice(2);
  return resto.length === 9 ? `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}` : `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
}

/**
 * Status da conexão do WhatsApp, no rodapé do menu lateral, acima do bloco
 * do usuário logado — mesmo conceito do widget do Datanyx (lá em cima, no
 * topbar; aqui embaixo, por pedido do usuário), portado de WAHA pra
 * Evolution API. Abre um popover: conectado mostra quem tá conectado,
 * desconectado mostra o QR code na hora e fica de olho (poll a cada 3s) até
 * a conexão voltar sozinha.
 */
export function WhatsappStatusWidget({ statusInicial }: { statusInicial: WhatsappStatus }) {
  const [status, setStatus] = useState(statusInicial);
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [erroQr, setErroQr] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEscapeClose(open, () => setOpen(false));

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [open]);

  const conectado = status.estado === "open";

  useEffect(() => {
    if (!open || conectado) return;

    let cancelado = false;

    async function buscarQr() {
      try {
        const resultado = await obterQrCodeWhatsapp();
        if (cancelado) return;
        setErroQr(false);
        if (resultado.estado === "open") {
          const atualizado = await verificarStatusWhatsapp();
          if (!cancelado) {
            setStatus(atualizado);
            setQr(null);
          }
          return;
        }
        setQr(resultado.qrCodeBase64);
      } catch {
        if (!cancelado) setErroQr(true);
      }
    }

    buscarQr();
    intervalRef.current = setInterval(buscarQr, 3000);
    return () => {
      cancelado = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, conectado]);

  const numeroFormatado = formatarNumero(status.numero);

  return (
    <div ref={rootRef} className="relative w-full">
      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-[260px] overflow-hidden rounded-[16px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[#0a0613] shadow-[0_20px_50px_-16px_rgba(0,0,0,0.75)]">
          {conectado ? (
            <div className="flex flex-col items-center gap-2 px-4 py-5 text-center">
              <div className="relative flex size-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(74,222,128,0.4)] bg-[#0f1f16]">
                {status.fotoUrl ? (
                  <Image src={status.fotoUrl} alt="" fill sizes="52px" className="object-cover" unoptimized />
                ) : (
                  <CheckCircle2 size={24} className="text-emerald-400" />
                )}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{status.nomePerfil ?? "WhatsApp"}</p>
                {numeroFormatado && <p className="text-[12px] text-[var(--color-text-muted)]">{numeroFormatado}</p>}
              </div>
              <span className="text-[11.5px] font-medium text-emerald-400">WhatsApp conectado</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-4 py-5 text-center">
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">Conectar WhatsApp</p>
              <div className="flex size-[176px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white">
                {erroQr ? (
                  <XCircle size={28} className="text-red-500" />
                ) : qr ? (
                  <img
                    src={qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`}
                    alt="QR code de pareamento"
                    className="size-full object-contain"
                  />
                ) : (
                  <Loader2 size={24} className="animate-spin text-[#3a3350]" />
                )}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Escaneie com o WhatsApp do restaurante (Aparelhos conectados)
              </p>
            </div>
          )}

          <Link
            href="/configuracoes"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 border-t border-[var(--color-border)] py-[10px] text-[12px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <Settings size={13} />
            Gerenciar integração
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-[9px] rounded-[12px] px-[9px] py-[7px] hover:bg-white/[0.03]"
      >
        <span className={`flex size-[7px] shrink-0 rounded-full ${conectado ? "bg-emerald-400" : "bg-red-400"}`} />
        <span className="flex-1 truncate text-left text-[12px] font-medium text-[var(--color-text-muted)]">
          {conectado ? "WhatsApp conectado" : "WhatsApp desconectado"}
        </span>
      </button>
    </div>
  );
}
