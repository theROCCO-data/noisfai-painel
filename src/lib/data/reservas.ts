import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type Reserva = {
  id: number;
  nome: string;
  telefone: string;
  data: string;
  horario: string;
  pessoas: number;
  objetivo: string | null;
  status: string;
  turno: string;
  canal: string;
  observacao: string | null;
  responsavelUserId: string | null;
  cpf: string | null;
  email: string | null;
  motivoCancelamento: string | null;
};

export type ListaReservasFiltro = {
  q?: string;
  status?: string;
  canal?: string;
  dataDe?: string;
  dataAte?: string;
  page?: number;
};

const PAGE_SIZE = 15;

export async function listReservas(filtro: ListaReservasFiltro) {
  const supabase = createAdminClient();
  const page = filtro.page && filtro.page > 0 ? filtro.page : 1;

  let query = supabase
    .from("reservas")
    .select(
      "id, nome, telefone, data, horario, pessoas, objetivo, status, turno, canal, observacao, responsavel_user_id, cpf, email, motivo_cancelamento",
      { count: "exact" }
    )
    .order("data", { ascending: true })
    .order("horario", { ascending: true });

  if (filtro.q) {
    query = query.or(`nome.ilike.%${filtro.q}%,telefone.ilike.%${filtro.q}%`);
  }
  if (filtro.status && filtro.status !== "todos") {
    query = query.eq("status", filtro.status);
  }
  if (filtro.canal && filtro.canal !== "todos") {
    query = query.eq("canal", filtro.canal);
  }
  if (filtro.dataDe) query = query.gte("data", filtro.dataDe);
  if (filtro.dataAte) query = query.lte("data", filtro.dataAte);

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  if (error) throw new Error(`listReservas: ${error.message}`);

  return {
    reservas: (data ?? []).map((r) => ({
      id: r.id,
      nome: r.nome,
      telefone: r.telefone,
      data: r.data,
      horario: r.horario,
      pessoas: r.pessoas,
      objetivo: r.objetivo,
      status: r.status,
      turno: r.turno,
      canal: r.canal,
      observacao: r.observacao,
      responsavelUserId: r.responsavel_user_id,
      cpf: r.cpf,
      email: r.email,
      motivoCancelamento: r.motivo_cancelamento,
    })) as Reserva[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function countReservasMesAtual() {
  const supabase = createAdminClient();
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toLocaleDateString("en-CA");
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toLocaleDateString("en-CA");

  const { count, error } = await supabase
    .from("reservas")
    .select("id", { count: "exact", head: true })
    .gte("data", inicio)
    .lte("data", fim);

  if (error) throw new Error(`countReservasMesAtual: ${error.message}`);
  return count ?? 0;
}
