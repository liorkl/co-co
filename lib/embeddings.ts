import OpenAI from "openai";
import { prisma } from "./db";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embed(text: string): Promise<Uint8Array> {
  const res = await client.embeddings.create({ model: "text-embedding-3-small", input: text });
  const arr = res.data[0]?.embedding ?? [];
  // Store as bytes via Float32Array for Prisma Bytes fallback
  const floatArray = new Float32Array(arr);
  return new Uint8Array(floatArray.buffer);
}

export async function upsertEmbedding(
  userId: string,
  role: "CEO" | "CTO",
  text: string,
  source: string
) {
  const bytes = await embed(text);
  // Convert Uint8Array to Buffer for Prisma
  const buffer = Buffer.from(bytes);
  await prisma.embedding.create({
    data: { userId, role, source, vector: buffer },
  });
}


