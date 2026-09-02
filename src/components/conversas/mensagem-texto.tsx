function renderNegrito(texto: string) {
  const partes = texto.split(/(\*[^*]+\*)/g);
  return partes.map((parte, i) =>
    parte.startsWith("*") && parte.endsWith("*") && parte.length > 2 ? (
      <strong key={i} className="font-semibold">
        {parte.slice(1, -1)}
      </strong>
    ) : (
      <span key={i}>{parte}</span>
    )
  );
}

/**
 * Reconhece o padrão `*Nome - Cargo*\n\ntexto` (mensagens assinadas pelo
 * Composer) e destaca a assinatura separada do corpo, além de interpretar
 * `*negrito*` no estilo WhatsApp em qualquer mensagem.
 */
export function MensagemTexto({ texto }: { texto: string }) {
  const match = texto.match(/^\*([^*]+)\*\n\n([\s\S]*)$/);

  if (match) {
    const [, assinatura, resto] = match;
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-semibold text-[#d8b4fe]">{assinatura}</span>
        <p className="whitespace-pre-wrap text-[15.5px] leading-[1.45] text-[var(--color-text-primary)]">
          {renderNegrito(resto)}
        </p>
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap text-[15.5px] leading-[1.45] text-[var(--color-text-primary)]">
      {renderNegrito(texto)}
    </p>
  );
}
