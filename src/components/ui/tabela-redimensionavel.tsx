"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Save, RotateCcw } from "lucide-react";

type ColunasCtx = {
  larguras: Record<string, number>;
  setLargura: (id: string, largura: number) => void;
};
const Ctx = createContext<ColunasCtx | null>(null);

const LARGURA_MIN = 60;

/**
 * Envolve uma tabela em formato de colunas (linhas flex com `w-[Npx]` fixos)
 * pra deixar cada coluna redimensionável arrastando a borda direita do
 * cabeçalho. As larguras só ficam guardadas de verdade (localStorage, por
 * navegador/dispositivo — não sincroniza entre usuários) quando a pessoa
 * clica em "Salvar visualização"; até lá é só uma prévia.
 */
export function TabelaRedimensionavel({
  tableId,
  children,
}: {
  tableId: string;
  children: React.ReactNode;
}) {
  const storageKey = `painel:colunas:${tableId}`;
  const [larguras, setLarguras] = useState<Record<string, number>>({});
  const [salvas, setSalvas] = useState<Record<string, number>>({});
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega a preferência salva do navegador ao montar (localStorage não dá pra ler durante o render)
      setLarguras(parsed);
      setSalvas(parsed);
    } catch {
      // ignora — segue com as larguras padrão de cada Coluna
    }
    setCarregado(true);
  }, [storageKey]);

  function setLargura(id: string, largura: number) {
    setLarguras((prev) => ({ ...prev, [id]: Math.max(LARGURA_MIN, Math.round(largura)) }));
  }

  const alterado =
    carregado &&
    (Object.keys(larguras).length !== Object.keys(salvas).length ||
      Object.entries(larguras).some(([id, v]) => salvas[id] !== v));

  function salvar() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(larguras));
    } catch {}
    setSalvas(larguras);
  }

  function desfazer() {
    setLarguras(salvas);
  }

  return (
    <Ctx.Provider value={{ larguras, setLargura }}>
      <div className="flex w-full flex-col gap-2">
        {alterado && (
          <div className="flex w-full items-center justify-end gap-2">
            <span className="text-[11.5px] text-[var(--color-text-muted)]">Layout da tabela alterado</span>
            <button
              onClick={desfazer}
              className="flex h-[30px] items-center gap-1.5 rounded-[8px] border border-[var(--color-border-soft)] px-3 text-[12.5px] font-medium text-[var(--color-text-secondary)] hover:bg-white/[0.05]"
            >
              <RotateCcw size={13} />
              Desfazer
            </button>
            <button
              onClick={salvar}
              className="flex h-[30px] items-center gap-1.5 rounded-[8px] px-3 text-[12.5px] font-semibold text-white"
              style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
            >
              <Save size={13} />
              Salvar visualização
            </button>
          </div>
        )}
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function Coluna({
  id,
  defaultWidth,
  header,
  className,
  children,
}: {
  id: string;
  defaultWidth: number;
  header?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useContext(Ctx);
  const largura = ctx?.larguras[id] ?? defaultWidth;
  const arrastoRef = useRef<{ x: number; largura: number } | null>(null);
  const [arrastando, setArrastando] = useState(false);

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    arrastoRef.current = { x: e.clientX, largura };
    setArrastando(true);

    function onMove(ev: MouseEvent) {
      if (!arrastoRef.current || !ctx) return;
      ctx.setLargura(id, arrastoRef.current.largura + (ev.clientX - arrastoRef.current.x));
    }
    function onUp() {
      setArrastando(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div className={`group relative shrink-0 ${className ?? ""}`} style={{ width: largura }}>
      {children}
      {header && (
        <div
          onMouseDown={onMouseDown}
          className="absolute -right-[7px] top-1/2 z-10 flex h-full w-[14px] -translate-y-1/2 cursor-col-resize items-center justify-center select-none"
        >
          <div className={`h-full w-px ${arrastando ? "bg-[#a855f7]" : "bg-transparent group-hover:bg-[#a855f7]/50"}`} />
        </div>
      )}
    </div>
  );
}
