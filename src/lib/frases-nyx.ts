const FRASES_NYX = [
  "Cada conversa é uma mesa em potencial. Vamos transformar mais uma hoje.",
  "Reserva confirmada é confiança conquistada — continue assim.",
  "Todo cliente que volta começou com uma boa primeira resposta.",
  "Números sobem quando a atenção não cai. Fico de olho com vocês.",
  "Um lead bem atendido hoje é uma mesa cheia amanhã.",
  "A melhor propaganda do Noi é quem já reservou e voltou a reservar.",
  "Cuidar de cada mensagem é cuidar de cada experiência à mesa.",
  "Crescimento consistente vale mais que pico isolado. Sigam no ritmo.",
  "Por trás de cada gráfico, tem gente que escolheu o Noi de novo.",
  "Hoje é mais uma chance de transformar 'talvez' em reserva confirmada.",
];

function diaSaoPauloISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/** Frase motivacional da Nyx, trocando uma vez por dia (horário de Brasília) — mesma frase o dia inteiro pra todo mundo. */
export function fraseDoDia(): string {
  const [ano, mes, dia] = diaSaoPauloISO().split("-").map(Number);
  const diaDoAno = Math.floor((Date.UTC(ano, mes - 1, dia) - Date.UTC(ano, 0, 1)) / 86400000);
  return FRASES_NYX[diaDoAno % FRASES_NYX.length];
}
