export function BackgroundGlow() {
  return (
    <>
      {/* sem blur() de propósito: o filtro de blur em elementos grandes cria uma
          borda dura em vez de esmaecer, dependendo do zoom/DPI da tela — o
          próprio radial-gradient (com o stop final em 0% de opacidade) já dá
          o esmaecimento suave sozinho, sem esse problema. */}
      <div
        className="pointer-events-none absolute -left-[260px] -top-[260px] size-[600px] opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.55) 0%, rgba(124,58,237,0.28) 35%, rgba(124,58,237,0) 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute left-[700px] -top-[500px] size-[840px] opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.45) 0%, rgba(168,85,247,0.22) 35%, rgba(168,85,247,0) 70%)",
        }}
      />
    </>
  );
}
