export type AreaPixels = { x: number; y: number; width: number; height: number };

function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = url;
  });
}

/** Recorta `area` da imagem em `imageSrc` e devolve um PNG quadrado de `saida`px, pronto pra upload. */
export async function recortarImagem(imageSrc: string, area: AreaPixels, saida = 512): Promise<Blob> {
  const imagem = await carregarImagem(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = saida;
  canvas.height = saida;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D não suportado.");

  ctx.drawImage(imagem, area.x, area.y, area.width, area.height, 0, 0, saida, saida);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar imagem."))), "image/png", 0.92);
  });
}
