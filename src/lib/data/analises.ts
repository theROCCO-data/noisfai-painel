import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { listUsuarios } from "@/lib/data/usuarios";

function hojeISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}
function somarDias(iso: string, dias: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString("en-CA");
}
function ultimosDigitos(telefone: string, n = 11) {
  return telefone.replace(/\D/g, "").slice(-n);
}
function diaSaoPaulo(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export type FiltroAnalises = { de?: string; ate?: string };

export async function getAnalises(filtro: FiltroAnalises) {
  const supabase = createAdminClient();
  const de = filtro.de || somarDias(hojeISO(), -29);
  const ate = filtro.ate || hojeISO();
  const desdeTs = `${de}T00:00:00-03:00`;
  const ateTs = `${ate}T23:59:59-03:00`;

  const [reservasRes, chatsRes, clientesRes, usuarios] = await Promise.all([
    supabase
      .from("reservas")
      .select("id, data, created_at, status, origem_alteracao, canal, telefone, responsavel_user_id")
      .gte("created_at", desdeTs)
      .lte("created_at", ateTs),
    supabase.from("chats").select("id, phone, created_at").gte("created_at", desdeTs).lte("created_at", ateTs),
    supabase.from("clientes").select("id, created_at").gte("created_at", desdeTs).lte("created_at", ateTs),
    listUsuarios(),
  ]);

  if (reservasRes.error) throw new Error(`getAnalises (reservas): ${reservasRes.error.message}`);
  if (chatsRes.error) throw new Error(`getAnalises (chats): ${chatsRes.error.message}`);
  if (clientesRes.error) throw new Error(`getAnalises (clientes): ${clientesRes.error.message}`);

  const reservas = reservasRes.data ?? [];
  const chats = chatsRes.data ?? [];
  const conversasIniciadas = chats.length;
  const reservasConfirmadas = reservas.filter((r) => r.status === "confirmada").length;
  const novosClientes = clientesRes.data?.length ?? 0;
  const taxaConversao = conversasIniciadas > 0 ? (reservasConfirmadas / conversasIniciadas) * 100 : 0;

  // Leads convertidos: casa telefone da conversa com telefone da reserva por
  // sufixo (mesmo motivo de sempre — `chats.phone` grava com "55" na frente,
  // `reservas.telefone` não).
  const telefonesComReserva = new Set(reservas.map((r) => ultimosDigitos(r.telefone)));
  const leadsConvertidos = chats.filter((c) => telefonesComReserva.has(ultimosDigitos(c.phone))).length;
  const taxaLeadsConvertidos = conversasIniciadas > 0 ? (leadsConvertidos / conversasIniciadas) * 100 : 0;

  const origemMap = new Map<string, number>();
  for (const r of reservas) {
    const origem = r.origem_alteracao || "não informado";
    origemMap.set(origem, (origemMap.get(origem) ?? 0) + 1);
  }
  const origemReservas = Array.from(origemMap.entries()).map(([origem, total]) => ({ origem, total }));

  const canalMap = new Map<string, number>();
  for (const r of reservas) {
    const canal = r.canal || "online";
    canalMap.set(canal, (canalMap.get(canal) ?? 0) + 1);
  }
  const canalReservas = Array.from(canalMap.entries()).map(([canal, total]) => ({ canal, total }));

  const nomePorUsuarioId = new Map(usuarios.map((u) => [u.id, u.nome]));
  const responsavelMap = new Map<string, number>();
  for (const r of reservas) {
    const nome = r.responsavel_user_id ? nomePorUsuarioId.get(r.responsavel_user_id) ?? "Usuário removido" : "Chatbot IA";
    responsavelMap.set(nome, (responsavelMap.get(nome) ?? 0) + 1);
  }
  const performancePorResponsavel = Array.from(responsavelMap.entries())
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);

  const compareceram = reservas.filter((r) => r.status === "compareceu").length;
  const naoCompareceram = reservas.filter((r) => r.status === "nao_compareceu").length;

  // bucket diário, ou semanal se o período for muito longo (evita centenas
  // de barras finas ilegíveis num range de meses/ano)
  const diasNoPeriodo = Math.round((new Date(ate).getTime() - new Date(de).getTime()) / 86400000) + 1;
  const semanal = diasNoPeriodo > 120;

  function chaveBucket(dataStr: string) {
    if (!semanal) return dataStr;
    const d = new Date(dataStr + "T00:00:00");
    const diaSemana = d.getDay();
    d.setDate(d.getDate() - diaSemana);
    return d.toLocaleDateString("en-CA");
  }

  const porBucket = new Map<string, number>();
  if (semanal) {
    for (let i = 0; i < diasNoPeriodo; i += 7) porBucket.set(chaveBucket(somarDias(de, i)), 0);
  } else {
    for (let i = 0; i < diasNoPeriodo; i++) porBucket.set(somarDias(de, i), 0);
  }
  for (const r of reservas) {
    const dia = diaSaoPaulo(r.created_at);
    const chave = chaveBucket(dia);
    if (porBucket.has(chave)) porBucket.set(chave, (porBucket.get(chave) ?? 0) + 1);
  }
  const serieTemporal = Array.from(porBucket.entries()).map(([data, total]) => ({ data, total }));

  return {
    periodo: { de, ate },
    conversasIniciadas,
    reservasConfirmadas,
    novosClientes,
    taxaConversao,
    leadsConvertidos,
    taxaLeadsConvertidos,
    origemReservas,
    canalReservas,
    performancePorResponsavel,
    compareceram,
    naoCompareceram,
    serieTemporal,
  };
}
