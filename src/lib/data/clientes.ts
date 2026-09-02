import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type Cliente = {
  id: number;
  createdAt: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string;
};

export type ListaClientesFiltro = {
  q?: string;
  de?: string;
  ate?: string;
  page?: number;
};

function ultimosDigitos(telefone: string, n = 11) {
  return telefone.replace(/\D/g, "").slice(-n);
}

/**
 * Casa telefones por sufixo (últimos 11 dígitos) — reservas/clientes gravam
 * o telefone sem o "55" do país (ex.: "21999998888"), enquanto `chats.phone`
 * (formato do WhatsApp) grava com ele (ex.: "5521999998888"). Sem essa
 * normalização, o nome do cliente nunca bateria com a conversa.
 */
export async function buscarNomesPorTelefones(telefones: string[]): Promise<Map<string, string>> {
  const unicos = Array.from(new Set(telefones.map((t) => ultimosDigitos(t))));
  if (unicos.length === 0) return new Map();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("clientes")
    .select("nome, telefone")
    .or(unicos.map((d) => `telefone.ilike.%${d}`).join(","));

  const porSufixo = new Map<string, string>();
  for (const c of data ?? []) {
    porSufixo.set(ultimosDigitos(c.telefone), c.nome);
  }

  const resultado = new Map<string, string>();
  for (const t of telefones) {
    const nome = porSufixo.get(ultimosDigitos(t));
    if (nome) resultado.set(t, nome);
  }
  return resultado;
}

/** Mesmo casamento por sufixo de `buscarNomesPorTelefones`, mas devolve id+nome pra 1 telefone. */
export async function buscarClientePorTelefone(telefone: string): Promise<{ id: number; nome: string } | null> {
  const sufixo = ultimosDigitos(telefone);
  const supabase = createAdminClient();
  const { data } = await supabase.from("clientes").select("id, nome, telefone").ilike("telefone", `%${sufixo}`);

  const encontrado = (data ?? []).find((c) => ultimosDigitos(c.telefone) === sufixo);
  return encontrado ? { id: encontrado.id, nome: encontrado.nome } : null;
}

const PAGE_SIZE = 20;

export async function listClientes(filtro: ListaClientesFiltro) {
  const supabase = createAdminClient();
  const page = filtro.page && filtro.page > 0 ? filtro.page : 1;

  let query = supabase
    .from("clientes")
    .select("id, created_at, nome, cpf, email, telefone", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filtro.q) {
    query = query.or(`nome.ilike.%${filtro.q}%,telefone.ilike.%${filtro.q}%,cpf.ilike.%${filtro.q}%,email.ilike.%${filtro.q}%`);
  }
  if (filtro.de) query = query.gte("created_at", `${filtro.de}T00:00:00-03:00`);
  if (filtro.ate) query = query.lte("created_at", `${filtro.ate}T23:59:59-03:00`);

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  if (error) throw new Error(`listClientes: ${error.message}`);

  return {
    clientes: (data ?? []).map((c) => ({
      id: c.id,
      createdAt: c.created_at,
      nome: c.nome,
      cpf: c.cpf,
      email: c.email,
      telefone: c.telefone,
    })) as Cliente[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

/** Mesmo filtro de `listClientes`, mas sem paginação — usado só na exportação. */
export async function listClientesParaExport(filtro: ListaClientesFiltro): Promise<Cliente[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("clientes")
    .select("id, created_at, nome, cpf, email, telefone")
    .order("created_at", { ascending: false });

  if (filtro.q) {
    query = query.or(`nome.ilike.%${filtro.q}%,telefone.ilike.%${filtro.q}%,cpf.ilike.%${filtro.q}%,email.ilike.%${filtro.q}%`);
  }
  if (filtro.de) query = query.gte("created_at", `${filtro.de}T00:00:00-03:00`);
  if (filtro.ate) query = query.lte("created_at", `${filtro.ate}T23:59:59-03:00`);

  const { data, error } = await query;
  if (error) throw new Error(`listClientesParaExport: ${error.message}`);

  return (data ?? []).map((c) => ({
    id: c.id,
    createdAt: c.created_at,
    nome: c.nome,
    cpf: c.cpf,
    email: c.email,
    telefone: c.telefone,
  }));
}

export type ClientesStats = {
  total: number;
  novosNoPeriodo: number;
  recorrentes: number;
};

export async function getClientesStats(filtro: { de?: string; ate?: string }): Promise<ClientesStats> {
  const supabase = createAdminClient();

  let queryPeriodo = supabase.from("clientes").select("id", { count: "exact", head: true });
  if (filtro.de) queryPeriodo = queryPeriodo.gte("created_at", `${filtro.de}T00:00:00-03:00`);
  if (filtro.ate) queryPeriodo = queryPeriodo.lte("created_at", `${filtro.ate}T23:59:59-03:00`);

  const [{ count: total }, { count: novosNoPeriodo }, { data: reservasClienteId }] = await Promise.all([
    supabase.from("clientes").select("id", { count: "exact", head: true }),
    queryPeriodo,
    supabase.from("reservas").select("cliente_id").not("cliente_id", "is", null).neq("status", "cancelada"),
  ]);

  const contagem = new Map<number, number>();
  for (const r of reservasClienteId ?? []) {
    if (r.cliente_id) contagem.set(r.cliente_id, (contagem.get(r.cliente_id) ?? 0) + 1);
  }
  const recorrentes = Array.from(contagem.values()).filter((n) => n >= 2).length;

  return { total: total ?? 0, novosNoPeriodo: novosNoPeriodo ?? 0, recorrentes };
}

export type ReservaCliente = {
  id: number;
  data: string;
  horario: string;
  pessoas: number;
  status: string;
  statusPagamento: string | null;
  canal: string;
  objetivo: string | null;
  tipo: "harmonizado" | "normal";
  valorEstimado: number | null;
};

export type ClienteDetalhe = Cliente & {
  reservas: ReservaCliente[];
  totalReservas: number;
  totalPessoasAtendidas: number;
};

export async function getClienteDetalhe(id: number): Promise<ClienteDetalhe | null> {
  const supabase = createAdminClient();

  const { data: cliente, error: clienteErr } = await supabase
    .from("clientes")
    .select("id, created_at, nome, cpf, email, telefone")
    .eq("id", id)
    .maybeSingle();

  if (clienteErr) throw new Error(`getClienteDetalhe: ${clienteErr.message}`);
  if (!cliente) return null;

  const { data: reservasData, error: reservasErr } = await supabase
    .from("reservas")
    .select("id, data, horario, pessoas, status, status_pagamento, canal, objetivo, cliente_id, telefone")
    .or(`cliente_id.eq.${cliente.id},telefone.eq.${cliente.telefone}`)
    .order("data", { ascending: false });

  if (reservasErr) throw new Error(`getClienteDetalhe: ${reservasErr.message}`);

  // valor do Jantar Harmonizado não tem FK direta pra `eventos_especiais` no
  // schema atual — usa o valor_pessoa vigente como estimativa (mesma
  // heurística já usada na tela de Jantar Harmonizado), não é histórico exato
  // se o preço mudou entre a reserva e hoje.
  const { data: edicao } = await supabase
    .from("eventos_especiais")
    .select("valor_pessoa")
    .eq("nome", "Jantar Harmonizado")
    .maybeSingle();
  const valorPessoaJH = edicao?.valor_pessoa ?? null;

  const reservas: ReservaCliente[] = (reservasData ?? []).map((r) => {
    const harmonizado = (r.objetivo ?? "").toLowerCase().includes("harmonizado");
    return {
      id: r.id,
      data: r.data,
      horario: r.horario,
      pessoas: r.pessoas,
      status: r.status,
      statusPagamento: r.status_pagamento,
      canal: r.canal ?? "online",
      objetivo: r.objetivo,
      tipo: harmonizado ? "harmonizado" : "normal",
      valorEstimado: harmonizado && valorPessoaJH ? valorPessoaJH * r.pessoas : null,
    };
  });

  return {
    id: cliente.id,
    createdAt: cliente.created_at,
    nome: cliente.nome,
    cpf: cliente.cpf,
    email: cliente.email,
    telefone: cliente.telefone,
    reservas,
    totalReservas: reservas.filter((r) => r.status !== "cancelada").length,
    totalPessoasAtendidas: reservas
      .filter((r) => r.status !== "cancelada")
      .reduce((acc, r) => acc + r.pessoas, 0),
  };
}
