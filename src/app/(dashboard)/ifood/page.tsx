import { Plus, Pencil, Search } from "lucide-react";
import { listIfood, listCategoriasIfood, countItensRagIfood } from "@/lib/data/ifood";
import { BloqueioMigracao } from "@/components/ui/bloqueio-migracao";
import { ItemIfoodDialog } from "@/components/ifood/item-dialog";
import { DeleteItemIfoodButton } from "@/components/ifood/delete-item-button";

export const dynamic = "force-dynamic";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function IfoodPage({ searchParams }: PageProps<"/ifood">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const { existe, itens } = await listIfood(q);
  const categorias = existe ? await listCategoriasIfood() : [];

  if (!existe) {
    const totalRag = await countItensRagIfood();
    return (
      <div className="flex w-full flex-col gap-6">
        <h1 className="font-display text-[28px] font-semibold text-[var(--color-text-primary)]">iFood</h1>
        <BloqueioMigracao tabela="ifood_itens" itensNoRag={totalRag} />
      </div>
    );
  }

  const porCategoria = new Map<string, typeof itens>();
  for (const item of itens) {
    if (!porCategoria.has(item.categoria)) porCategoria.set(item.categoria, []);
    porCategoria.get(item.categoria)!.push(item);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] font-semibold text-[var(--color-text-primary)]">iFood</h1>
          <p className="text-[11.5px] text-[var(--color-text-muted)]">{itens.length} itens cadastrados</p>
        </div>
        <ItemIfoodDialog
          categorias={categorias}
          trigger={
            <span
              className="flex h-[34px] items-center gap-2 rounded-[999px] px-5 text-[13px] font-semibold text-white"
              style={{ backgroundImage: "linear-gradient(163deg, #a855f7 14%, #6d28d9 86%)" }}
            >
              <Plus size={15} /> Novo item
            </span>
          }
        />
      </div>

      <form action="/ifood" className="flex h-[38px] w-full items-center gap-2 rounded-[10px] border border-[var(--color-border-soft)] bg-white/[0.03] px-3 sm:w-[320px]">
        <Search size={14} className="text-[var(--color-text-muted)]" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar item"
          className="w-full bg-transparent text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
        />
      </form>

      <div className="flex w-full flex-col gap-4">
        {itens.length === 0 ? (
          <p className="px-[18px] py-10 text-center text-[13px] text-[var(--color-text-muted)]">
            Nenhum item encontrado com esse filtro.
          </p>
        ) : (
          Array.from(porCategoria.entries()).map(([categoria, itensCategoria]) => (
            <div key={categoria} className="w-full overflow-hidden rounded-[26px] border border-[var(--color-border-soft)] bg-gradient-to-b from-[var(--color-card-from)] to-[var(--color-card-to)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-white/[0.02] px-[18px] py-[14px]">
                <h2 className="font-display text-[15px] font-semibold text-[var(--color-text-primary)]">{categoria}</h2>
                <span className="text-[12px] text-[var(--color-text-muted)]">
                  {itensCategoria.length} {itensCategoria.length === 1 ? "item" : "itens"}
                </span>
              </div>
              {itensCategoria.map((item) => (
                <div key={item.id} className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/5 px-[18px] py-3 text-[13px]">
                  <div className="min-w-[140px] flex-1">
                    <p className="text-[var(--color-text-primary)]">{item.nome}</p>
                    {item.descricao && (
                      <p className="truncate text-[11.5px] text-[var(--color-text-muted)]">{item.descricao}</p>
                    )}
                  </div>
                  <p className="w-[70px] shrink-0 font-display text-[var(--color-text-primary)]">{formatBRL(item.preco)}</p>
                  <span
                    className={`w-[100px] shrink-0 rounded-[999px] px-2 py-0.5 text-center text-[10.5px] font-medium ${
                      item.disponivel
                        ? "bg-[rgba(125,211,252,0.13)] text-[var(--color-status-sky)]"
                        : "bg-white/10 text-[var(--color-text-muted)]"
                    }`}
                  >
                    {item.disponivel ? "Disponível" : "Indisponível"}
                  </span>
                  <div className="ml-auto flex shrink-0 gap-1.5">
                    <ItemIfoodDialog
                      item={item}
                      categorias={categorias}
                      trigger={
                        <span className="flex size-[26px] items-center justify-center rounded-[8px] border border-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                          <Pencil size={13} />
                        </span>
                      }
                    />
                    <DeleteItemIfoodButton id={item.id} nome={item.nome} />
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
