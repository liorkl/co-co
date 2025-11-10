import OpenAI from "openai";
import { prisma } from "./db";

const openAIApiKey = process.env.OPENAI_API_KEY;
const client = openAIApiKey ? new OpenAI({ apiKey: openAIApiKey }) : null;

export async function embed(text: string): Promise<Uint8Array> {
  if (!client) {
    console.warn("🧪 OPENAI_API_KEY not configured; skipping embedding generation.");
    return new Uint8Array();
  }
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
  if (!client) {
    console.warn("🧪 OPENAI_API_KEY not configured; skipping embedding upsert.");
    return;
  }
  const bytes = await embed(text);
  if (!bytes.length) {
    console.warn("🧪 Embedding generation returned empty result; skipping upsert.");
    return;
  }
  // Convert Uint8Array to Buffer for Prisma
  const buffer = Buffer.from(bytes);
  await prisma.embedding.create({
    data: { userId, role, source, vector: buffer },
  });
}


