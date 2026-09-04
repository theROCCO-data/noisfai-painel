# Atendimento Presencial — arquivado em 2026-09-03

Removido da navegação e do código ativo a pedido do usuário ("vamos trabalhar
com foco em reservas nesse primeiro momento"). Nada foi perdido — os 4
arquivos completos estão aqui, nos mesmos caminhos relativos que tinham
dentro de `src/`. As tabelas do banco (`pedidos_presenciais`,
`pedidos_presenciais_itens`, migration `013_atendimento_presencial.sql`)
**não foram removidas** — continuam existindo, vazias, prontas pra uso.

## Como restaurar

1. Copiar os 4 arquivos de volta pros mesmos caminhos dentro de `src/`:
   - `src/lib/data/atendimento-presencial.ts`
   - `src/lib/data/atendimento-presencial-actions.ts`
   - `src/components/atendimento-presencial/novo-atendimento-dialog.tsx`
   - `src/app/(dashboard)/atendimento-presencial/page.tsx`

1b. Em `src/lib/data/clientes-actions.ts`: recolocar a função de autocomplete
   por nome (usada só por esse dialog), removida junto na limpeza:
   ```ts
   export type ClienteBusca = { id: number; nome: string; telefone: string; email: string | null };

   /** Autocomplete por nome — usado no dialog de Atendimento Presencial. */
   export async function buscarClientesPorNome(q: string): Promise<ClienteBusca[]> {
     if (!q || q.trim().length < 2) return [];
     const supabase = createAdminClient();
     const { data, error } = await supabase
       .from("clientes")
       .select("id, nome, telefone, email")
       .ilike("nome", `%${q.trim()}%`)
       .order("nome", { ascending: true })
       .limit(8);
     if (error) return [];
     return data ?? [];
   }
   ```

2. Em `src/components/layout/sidebar.tsx`: reindicar `UtensilsCrossed` do
   `lucide-react` e recolocar no array `NAV_ITEMS`:
   ```ts
   { href: "/atendimento-presencial", label: "Atendimento Presencial", icon: UtensilsCrossed },
   ```
   (ficava logo depois do item `/clientes`.)

3. Em `src/app/(dashboard)/mais/page.tsx`: mesma coisa, no array `ITENS`
   (ficava logo depois do item `/clientes`).

4. Em `src/lib/data/clientes.ts`: reimportar
   `listAtendimentosPresenciaisPorCliente` e `AtendimentoPresencial` de
   `@/lib/data/atendimento-presencial`, adicionar de volta o campo
   `atendimentosPresenciais: AtendimentoPresencial[]` no tipo
   `ClienteDetalhe`, e em `getClienteDetalhe` buscar
   `const atendimentosPresenciais = await listAtendimentosPresenciaisPorCliente(cliente.id);`
   e incluir no objeto retornado.

5. Em `src/app/(dashboard)/clientes/[id]/page.tsx`: reimportar o ícone
   `UtensilsCrossed` e recolocar o bloco "Atendimentos presenciais" (mesmo
   padrão visual do bloco "Histórico de reservas" logo acima dele),
   listando `cliente.atendimentosPresenciais`.

Tudo isso é reconstrução de memória de sessão — o conteúdo exato dos passos
2-5 está registrado na conversa em que essa feature foi construída, caso
precise conferir palavra por palavra.
