import { NextRequest, NextResponse } from "next/server";
import { listClientesParaExport } from "@/lib/data/clientes";

function csvCampo(valor: string) {
  if (/[",\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

function paraCsv(clientes: Awaited<ReturnType<typeof listClientesParaExport>>) {
  const cabecalho = ["Nome", "Telefone", "CPF", "E-mail", "Cliente desde"];
  const linhas = clientes.map((c) =>
    [c.nome, c.telefone, c.cpf ?? "", c.email ?? "", new Date(c.createdAt).toLocaleDateString("pt-BR")]
      .map(csvCampo)
      .join(",")
  );
  return [cabecalho.join(","), ...linhas].join("\n");
}

function paraMarkdown(clientes: Awaited<ReturnType<typeof listClientesParaExport>>) {
  const cabecalho = "| Nome | Telefone | CPF | E-mail | Cliente desde |";
  const separador = "| --- | --- | --- | --- | --- |";
  const linhas = clientes.map(
    (c) =>
      `| ${c.nome} | ${c.telefone} | ${c.cpf ?? "—"} | ${c.email ?? "—"} | ${new Date(c.createdAt).toLocaleDateString("pt-BR")} |`
  );
  return [cabecalho, separador, ...linhas].join("\n");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const de = searchParams.get("de") ?? undefined;
  const ate = searchParams.get("ate") ?? undefined;
  const formato = searchParams.get("formato") ?? "csv";

  const clientes = await listClientesParaExport({ q, de, ate });

  const sufixoPeriodo = de && ate ? `_${de}_a_${ate}` : "";
  const nomeArquivo = `clientes${sufixoPeriodo}.${formato}`;

  if (formato === "json") {
    return new NextResponse(JSON.stringify(clientes, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  }

  if (formato === "md") {
    return new NextResponse(paraMarkdown(clientes), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  }

  return new NextResponse(paraCsv(clientes), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
