"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, XCircle, MessageCircle, X } from "lucide-react";
import { verificarStatusWhatsapp, obterQrCodeWhatsapp, desconectarWhatsapp } from "@/lib/data/whatsapp-status-actions";
import type { WhatsappStatus } from "@/lib/data/whatsapp-status";
import { useEscapeClose } from "@/hooks/use-escape-close";
import { toast } from "@/lib/toast";

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
 * do usuário logado — mesmo conceito do widget do Datanyx (portado de WAHA
 * pra Evolution API): mostra se está conectado (nome/número/foto do
 * perfil) ou desconectado, e nesse caso abre o QR code na hora pra
 * escanear, com polling a cada 3s até a conexão voltar sozinha.
 *
 * Trigger é só a pill compacta; o gerenciamento de verdade acontece num
 * modal centralizado (mesmo padrão dos outros diálogos do Painel) em vez
 * de um popover pequeno — cabe mais informação com proporção decente.
 */
export function WhatsappStatusWidget({ statusInicial }: { statusInicial: WhatsappStatus }) {
  const [status, setStatus] = useState(statusInicial);
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [erroQr, setErroQr] = useState(false);
  const [confirmandoDesconexao, setConfirmandoDesconexao] = useState(false);
  const [pending, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEscapeClose(open, () => setOpen(false));

  const conectado = status.estado === "open";

  useEffect(() => {
    if (!open) {
      setConfirmandoDesconexao(false);
      return;
    }
    if (conectado) return;

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
            toast("WhatsApp conectado.");
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

  function desconectar() {
    startTransition(async () => {
      const resultado = await desconectarWhatsapp();
      if (!resultado.ok) {
        toast(`Erro ao desconectar: ${resultado.error}`);
        return;
      }
      setConfirmandoDesconexao(false);
      setStatus((s) => ({ ...s, estado: "close" }));
      toast("WhatsApp desconectado.");
    });
  }

  const numeroFormatado = formatarNumero(status.numero);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-[9px] rounded-[12px] px-[9px] py-[7px] hover:bg-white/[0.03]"
      >
        <span className={`flex size-[7px] shrink-0 rounded-full ${conectado ? "bg-emerald-400" : "bg-red-400"}`} />
        <span className="flex-1 truncate text-left text-[12px] font-medium text-[var(--color-text-muted)]">
          {conectado ? "WhatsApp conectado" : "WhatsApp desconectado"}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex w-[380px] flex-col gap-4 rounded-[22px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">Conexões e Integrações</h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-[var(--color-text-muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 rounded-[16px] border border-[var(--color-border-soft)] bg-black/20 px-5 py-6 text-center">
              {conectado ? (
                <>
                  <div className="relative flex size-[64px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(74,222,128,0.4)] bg-[#0f1f16]">
                    {status.fotoUrl ? (
                      <Image src={status.fotoUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />
                    ) : (
                      <MessageCircle size={26} className="text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Nome no WhatsApp</p>
                    <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">{status.nomePerfil ?? "—"}</p>
                  </div>
                  <span className="mt-1 rounded-[999px] bg-[rgba(74,222,128,0.12)] px-3 py-1 text-[11.5px] font-medium text-emerald-400">
                    ✓ WhatsApp Conectado
                  </span>
                  {numeroFormatado && (
                    <div className="mt-3 w-full border-t border-[var(--color-border)] pt-3">
                      <p className="text-[11px] text-[var(--color-text-muted)]">WhatsApp de atendimento</p>
                      <p className="text-[13.5px] font-medium text-[var(--color-text-primary)]">{numeroFormatado}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            {conectado &&
              (confirmandoDesconexao ? (
                <div className="flex flex-col gap-2 rounded-[14px] border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.06)] p-3">
                  <p className="text-[12.5px] text-[var(--color-text-secondary)]">
                    Tem certeza? O bot para de responder no WhatsApp até reconectar.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmandoDesconexao(false)}
                      className="h-8 rounded-[999px] border border-white/[0.14] px-4 text-[12px] font-medium text-[var(--color-text-secondary)]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={desconectar}
                      disabled={pending}
                      className="h-8 rounded-[999px] bg-[var(--color-status-red)] px-4 text-[12px] font-semibold text-[#2a0a0a] disabled:opacity-60"
                    >
                      {pending ? "Desconectando…" : "Desconectar"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmandoDesconexao(true)}
                  className="h-9 w-full rounded-[999px] border border-[rgba(248,113,113,0.4)] text-[13px] font-medium text-[var(--color-status-red)] hover:bg-[rgba(248,113,113,0.06)]"
                >
                  Desconectar WhatsApp
                </button>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
