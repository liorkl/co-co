import OpenAI from "openai";
import { prisma } from "./db";

const openAIApiKey = process.env.OPENAI_API_KEY;
const client = openAIApiKey ? new OpenAI({ apiKey: openAIApiKey }) : null;
const useMockOpenAI = process.env.MOCK_OPENAI === "true";

// text-embedding-3-small produces 1536-dimensional vectors
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate a deterministic mock embedding based on text hash.
 * This ensures the same text always produces the same embedding,
 * which is important for consistent matching behavior in tests.
 */
function generateMockEmbedding(text: string): Uint8Array {
  // Create a simple hash from the text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate deterministic pseudo-random values based on hash
  const floatArray = new Float32Array(EMBEDDING_DIMENSIONS);
  let seed = Math.abs(hash);
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    // Simple LCG pseudo-random generator
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    // Normalize to [-1, 1] range typical for embeddings
    floatArray[i] = (seed / 0x7fffffff) * 2 - 1;
  }

  // Normalize the vector (embeddings are typically unit vectors)
  let magnitude = 0;
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    magnitude += floatArray[i] * floatArray[i];
  }
  magnitude = Math.sqrt(magnitude);
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    floatArray[i] /= magnitude;
  }

  return new Uint8Array(floatArray.buffer);
}

export async function embed(text: string): Promise<Uint8Array> {
  // Use mock mode for testing
  if (useMockOpenAI) {
    console.log("🧪 MOCK_OPENAI enabled; returning mock embedding.");
    return generateMockEmbedding(text);
  }

  if (!client) {
    console.warn("🧪 OPENAI_API_KEY not configured; returning mock embedding.");
    return generateMockEmbedding(text);
  }

  try {
    const res = await client.embeddings.create({ model: "text-embedding-3-small", input: text });
    const arr = res.data[0]?.embedding ?? [];
    // Store as bytes via Float32Array for Prisma Bytes fallback
    const floatArray = new Float32Array(arr);
    return new Uint8Array(floatArray.buffer);
  } catch (error) {
    console.warn("🧪 OpenAI API error; falling back to mock embedding.", error);
    return generateMockEmbedding(text);
  }
}

export async function upsertEmbedding(
  userId: string,
  role: "CEO" | "CTO",
  text: string,
  source: string
) {
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


