import { NyxLogo } from "@/components/ui/nyx-logo";

/** Hero compartilhado pelas telas de autenticação (login, nova senha). */
export function AuthHero() {
  return (
    <>
      <div
        className="relative hidden w-[45%] min-w-[520px] flex-col overflow-hidden px-16 py-16 lg:flex"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 60% at 82% 12%, rgba(139,92,246,0.35), rgba(139,92,246,0) 70%), linear-gradient(135deg, #05060A 0%, #150F2E 55%, #3A1981 100%)",
        }}
      >
        {/* Bloco logo+texto centraliza no espaço disponível; as features (#01-04) ficam fixas embaixo */}
        <div className="flex flex-1 flex-col justify-center">
          {/* Logo é um elemento SVG de verdade — nunca corta em telas menores, diferente de imagem de fundo */}
          <NyxLogo className="h-[58px] w-auto shrink-0 self-start text-white" />

          <div className="mt-10 flex flex-col" style={{ fontFamily: "var(--font-poppins)" }}>
            <p className="text-[22px] font-light leading-[1.3] text-white/90">Gerencie reservas,</p>
            <p className="text-[22px] font-light leading-[1.3] text-white/90">conversas e eventos com</p>
            <p className="mt-6 text-[92px] font-bold leading-[0.95] text-[#8b5cf6]">inteligência.</p>
            <p className="mt-8 whitespace-nowrap text-[13px] leading-[1.45] text-[#c9cfde]">
              O chatbot atende pelo WhatsApp; você acompanha tudo por aqui.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-8" style={{ fontFamily: "var(--font-poppins)" }}>
          <Feature n="#01" label="Reservas automatizadas" />
          <Feature n="#02" label="Atendimento por IA, 24h" />
          <Feature n="#03" label="Pagamentos organizados" />
          <Feature n="#04" label="Métricas em tempo real" />
        </div>
      </div>

      {/* Mobile: mesmo hero da tela grande, só que compacto e no topo da página em vez de painel lateral */}
      <div
        className="flex w-full flex-col items-center gap-3 px-6 pb-10 pt-12 text-center lg:hidden"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(168,85,247,0.65), rgba(139,92,246,0) 70%), linear-gradient(180deg, #05060A 0%, #1d1240 55%, #4c1d95 100%)",
        }}
      >
        <NyxLogo className="h-[40px] w-auto text-white" />
        <p className="mt-2 font-display text-[24px] font-semibold leading-[1.25] text-white">
          Gerencie reservas,
          <br />
          conversas e eventos
          <br />
          com <span className="text-[#a78bfa]">inteligência.</span>
        </p>
        <p className="max-w-[280px] text-[12.5px] leading-[1.5] text-[#c9cfde]">
          O chatbot atende pelo WhatsApp; você acompanha tudo por aqui.
        </p>
      </div>
    </>
  );
}

function Feature({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] text-[#8b5cf6]">{n}</span>
      <span className="w-[140px] text-[11.5px] leading-[1.4] text-[#d9dbe5]">{label}</span>
    </div>
  );
}
