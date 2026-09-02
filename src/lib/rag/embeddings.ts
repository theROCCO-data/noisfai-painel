import "server-only";

export async function gerarEmbedding(texto: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: texto }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenAI embeddings falhou (${res.status}): ${errBody}`);
  }

  const json = await res.json();
  return json.data[0].embedding as number[];
}
