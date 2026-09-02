"use client";

import { useState, useTransition } from "react";
import { atualizarPerfil } from "@/lib/auth-profile-actions";
import { AvatarUpload } from "@/components/configuracoes/avatar-upload";
import { CustomSelect } from "@/components/ui/custom-select";

const CARGOS_PODEM_MUDAR_CARGO = ["desenvolvedor", "proprietário", "proprietario", "gerente"];

export function PerfilForm({
  nome,
  cargo,
  email,
  avatarUrl,
}: {
  nome: string;
  cargo: string;
  email: string;
  avatarUrl: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();
  const podeMudarCargo = CARGOS_PODEM_MUDAR_CARGO.includes(cargo.toLowerCase());

  const [nomeAtual, setNomeAtual] = useState(nome);
  const [cargoAtual, setCargoAtual] = useState(cargo);
  const [baseline, setBaseline] = useState({ nome, cargo });
  const alterado = nomeAtual !== baseline.nome || cargoAtual !== baseline.cargo;

  const iniciais = nome
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleSubmit(formData: FormData) {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const result = await atualizarPerfil(formData);
      if (result.ok) {
        setOk(true);
        const nomeSalvo = String(formData.get("nome") ?? nomeAtual);
        const cargoSalvo = podeMudarCargo ? String(formData.get("cargo") ?? cargoAtual) : cargoAtual;
        setNomeAtual(nomeSalvo);
        setCargoAtual(cargoSalvo);
        setBaseline({ nome: nomeSalvo, cargo: cargoSalvo });
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
        <AvatarUpload avatarUrl={avatarUrl} iniciais={iniciais || "?"} />
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[12px] text-[var(--color-text-muted)]">Nome completo</span>
            <input
              name="nome"
              value={nomeAtual}
              onChange={(e) => {
                setNomeAtual(e.target.value);
                setOk(false);
              }}
              required
              className="dialog-input"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[12px] text-[var(--color-text-muted)]">Cargo</span>
            {podeMudarCargo ? (
              <CustomSelect
                name="cargo"
                defaultValue={cargoAtual}
                onChange={(v) => {
                  setCargoAtual(v);
                  setOk(false);
                }}
                options={[
                  { value: "Desenvolvedor", label: "Desenvolvedor" },
                  { value: "Gerente", label: "Gerente" },
                  { value: "Proprietário", label: "Proprietário" },
                  { value: "Atendente", label: "Atendente" },
                  { value: "Garçom", label: "Garçom" },
                ]}
              />
            ) : (
              <input
                defaultValue={cargo}
                disabled
                title="Só desenvolvedor, proprietário ou gerente pode mudar cargo — peça pra alguém com essa permissão"
                className="dialog-input opacity-60"
              />
            )}
          </label>
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[12px] text-[var(--color-text-muted)]">E-mail</span>
        <input
          defaultValue={email}
          disabled
          title="Não pode ser trocado por aqui — fale com quem administra o Supabase Auth do projeto"
          className="dialog-input opacity-60"
        />
      </label>

      {error && <p className="text-[12.5px] text-[var(--color-status-red)]">{error}</p>}
      {ok && <p className="text-[12.5px] text-[var(--color-status-green)]">Perfil atualizado.</p>}

      {alterado && (
        <button
          type="submit"
          disabled={pending}
          className="mt-1 h-9 w-fit rounded-[999px] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
          style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
        >
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
      )}
    </form>
  );
}
