"use client";

import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 40;

function formatTempo(segundos: number) {
  if (!Number.isFinite(segundos)) return "0:00";
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [picos, setPicos] = useState<number[] | null>(null);

  // gera a forma de onda de verdade a partir do áudio (decodifica só uma vez,
  // client-side) — se falhar (CORS, formato não suportado etc.), cai pra
  // barras genéricas em vez de quebrar o player.
  useEffect(() => {
    let cancelado = false;
    async function gerarWaveform() {
      try {
        const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextCtor();
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        const canal = audioBuffer.getChannelData(0);
        const tamanhoBloco = Math.floor(canal.length / BAR_COUNT);
        const novosPicos: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let soma = 0;
          const inicio = i * tamanhoBloco;
          for (let j = 0; j < tamanhoBloco; j++) soma += Math.abs(canal[inicio + j] ?? 0);
          novosPicos.push(soma / tamanhoBloco);
        }
        const max = Math.max(...novosPicos, 0.0001);
        if (!cancelado) setPicos(novosPicos.map((p) => Math.max(0.15, p / max)));
        ctx.close();
      } catch {
        if (!cancelado) setPicos(Array.from({ length: BAR_COUNT }, () => 0.25 + Math.random() * 0.75));
      }
    }
    gerarWaveform();
    return () => {
      cancelado = true;
    };
  }, [url]);

  function alternarPlay() {
    const el = audioRef.current;
    if (!el) return;
    if (tocando) el.pause();
    else el.play();
  }

  const progresso = duracao > 0 ? tempoAtual / duracao : 0;
  const barrasAtivas = picos ? Math.round(progresso * picos.length) : 0;

  return (
    <div className="flex w-[260px] items-center gap-2.5">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => setTocando(false)}
        onTimeUpdate={(e) => setTempoAtual(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuracao(e.currentTarget.duration)}
        className="hidden"
      />
      <button
        type="button"
        onClick={alternarPlay}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
      >
        {tocando ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="4" width="5" height="16" rx="1" />
            <rect x="14" y="4" width="5" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4.5v15l14-7.5-14-7.5z" />
          </svg>
        )}
      </button>

      <div className="flex flex-1 items-center gap-[2px]" onClick={(e) => e.stopPropagation()}>
        {(picos ?? Array.from({ length: BAR_COUNT }, () => 0.4)).map((altura, i) => (
          <div
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: `${Math.max(3, altura * 20)}px`,
              backgroundColor: i < barrasAtivas ? "#a855f7" : "rgba(255,255,255,0.18)",
            }}
          />
        ))}
      </div>

      <span className="w-9 shrink-0 text-right text-[10.5px] text-[var(--color-text-muted)]">
        {formatTempo(tocando || tempoAtual > 0 ? tempoAtual : duracao)}
      </span>
    </div>
  );
}
