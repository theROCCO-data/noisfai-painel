import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type EventoReserva = {
  id: number;
  clienteId: number;
  clienteNome: string;
  clienteTelefone: string;
  nomeEvento: string;
  tipo: string | null;
  data: string;
  horario: string | null;
  pessoas: number;
  espaco: string;
  observacao: string | null;
  valor: number | null;
  status: "pendente" | "confirmado" | "cancelado";
  createdAt: string;
};

type ListaEventosParams = {
  q?: string;
  status?: string;
  de?: string;
  ate?: string;
};

export async function listEventos({ q, status, de, ate }: ListaEventosParams = {}): Promise<EventoReserva[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("eventos_reservas")
    .select("id, cliente_id, nome_evento, tipo, data, horario, pessoas, espaco, observacao, valor, status, created_at, clientes(nome, telefone)")
    .order("data", { ascending: true });

  if (status) query = query.eq("status", status);
  if (de) query = query.gte("data", de);
  if (ate) query = query.lte("data", ate);

  const { data, error } = await query;
  if (error) throw new Error(`listEventos: ${error.message}`);

  let eventos = (data ?? []).map((e) => {
    const cliente = Array.isArray(e.clientes) ? e.clientes[0] : e.clientes;
    return {
      id: e.id,
      clienteId: e.cliente_id,
      clienteNome: cliente?.nome ?? "—",
      clienteTelefone: cliente?.telefone ?? "",
      nomeEvento: e.nome_evento,
      tipo: e.tipo,
      data: e.data,
      horario: e.horario ? String(e.horario).slice(0, 5) : null,
      pessoas: e.pessoas,
      espaco: e.espaco,
      valor: e.valor,
      observacao: e.observacao,
      status: e.status as EventoReserva["status"],
      createdAt: e.created_at,
    };
  });

  if (q) {
    const termo = q.toLowerCase();
    eventos = eventos.filter(
      (e) => e.clienteNome.toLowerCase().includes(termo) || e.clienteTelefone.includes(termo) || e.nomeEvento.toLowerCase().includes(termo)
    );
  }

  return eventos;
}

export async function listEventosPorCliente(clienteId: number): Promise<EventoReserva[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("eventos_reservas")
    .select("id, cliente_id, nome_evento, tipo, data, horario, pessoas, espaco, observacao, valor, status, created_at, clientes(nome, telefone)")
    .eq("cliente_id", clienteId)
    .order("data", { ascending: false });

  if (error) throw new Error(`listEventosPorCliente: ${error.message}`);

  return (data ?? []).map((e) => {
    const cliente = Array.isArray(e.clientes) ? e.clientes[0] : e.clientes;
    return {
      id: e.id,
      clienteId: e.cliente_id,
      clienteNome: cliente?.nome ?? "—",
      clienteTelefone: cliente?.telefone ?? "",
      nomeEvento: e.nome_evento,
      tipo: e.tipo,
      data: e.data,
      horario: e.horario ? String(e.horario).slice(0, 5) : null,
      pessoas: e.pessoas,
      espaco: e.espaco,
      valor: e.valor,
      observacao: e.observacao,
      status: e.status as EventoReserva["status"],
      createdAt: e.created_at,
    };
  });
}
