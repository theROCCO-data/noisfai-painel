import { MapPin, Phone, Clock, Globe, ShoppingBag, BookOpen, Building2, Info } from "lucide-react";
import { listPerfilRestaurante } from "@/lib/data/perfil-restaurante";
import { getConfiguracoes } from "@/lib/data/configuracoes";
import { EditarPerfilDialog } from "@/components/perfil-restaurante/editar-perfil-dialog";
import { RegrasComandosDialog } from "@/components/perfil-restaurante/regras-comandos-dialog";
import { LogoUploadButton } from "@/components/layout/logo-upload-button";

export const dynamic = "force-dynamic";

function Campo({ icon: Icon, label, valor, link }: { icon: typeof MapPin; label: string; valor: string | null; link?: boolean }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
        {!valor ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Não preenchido</p>
        ) : link ? (
          <a
            href={valor}
            target="_blank"
            rel="noreferrer"
            className="max-w-full truncate text-[13px] text-[var(--color-accent)] hover:underline"
          >
            {valor}
          </a>
        ) : (
          <p className="max-w-full text-[13px] leading-[1.5] text-[var(--color-text-primary)]">{valor}</p>
        )}
      </div>
    </div>
  );
}

export default async function PerfilRestaurantePage() {
  const [fatos, perfil] = await Promise.all([listPerfilRestaurante(), getConfiguracoes()]);

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-semibold text-[var(--color-text-primary)]">Perfil do restaurante</h1>
        <p className="text-[11.5px] text-[var(--color-text-muted)]">
          As informações base do NOI — o que o bot e a equipe usam como referência.
        </p>
      </header>

      <div className="flex w-full flex-col gap-5 rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)] p-[22px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <LogoUploadButton logoUrl={perfil.logoUrl} size={64} glow={false} />
            <p className="font-display text-[21px] font-semibold text-[var(--color-text-primary)]">
              {perfil.nome ?? "Nome não preenchido"}
            </p>
          </div>
          <EditarPerfilDialog perfil={perfil} />
        </div>

        <div className="flex items-start gap-2.5 rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-4">
          <Info size={15} className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" />
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] text-[var(--color-text-muted)]">Sobre</p>
            {perfil.sobre ? (
              <p className="text-[13px] leading-[1.6] text-[var(--color-text-primary)]">{perfil.sobre}</p>
            ) : (
              <p className="text-[13px] text-[var(--color-text-muted)]">Não preenchido</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <Campo icon={MapPin} label="Endereço" valor={perfil.endereco} />
          <Campo icon={Phone} label="Telefone" valor={perfil.telefone} />
          <Campo icon={Clock} label="Horário de funcionamento" valor={perfil.horarioFuncionamento} />
          <Campo icon={Globe} label="Site" valor={perfil.siteUrl} link />
          <Campo icon={ShoppingBag} label="iFood" valor={perfil.ifoodUrl} link />
          <Campo icon={BookOpen} label="Cardápio digital" valor={perfil.cardapioDigitalUrl} link />
        </div>

        {perfil.outrasUnidades && (
          <div className="border-t border-white/[0.07] pt-4">
            <Campo icon={Building2} label="Outras unidades NOI" valor={perfil.outrasUnidades} />
          </div>
        )}
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--color-border-soft)] bg-white/[0.02] p-5">
        <div className="flex flex-col gap-0.5">
          <p className="text-[13.5px] font-medium text-[var(--color-text-primary)]">Regras e comandos</p>
          <p className="text-[11.5px] text-[var(--color-text-muted)]">
            Políticas e outras informações de referência (reservas, estrutura, cardápio) organizadas por assunto.
          </p>
        </div>
        <RegrasComandosDialog fatos={fatos} />
      </div>
    </div>
  );
}
