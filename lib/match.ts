import { prisma } from "./db";

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function bytesToFloat32(bytes: Buffer | Uint8Array): Float32Array {
  const buf = bytes instanceof Buffer ? new Uint8Array(bytes) : bytes;
  return new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
}

export async function findMatchesFor(userId: string, role: "CEO" | "CTO") {
  const me = await prisma.embedding.findFirst({ where: { userId, source: "summary" } });
  if (!me) return [];
  const counterpartRole = role === "CEO" ? "CTO" : "CEO";
  const others = await prisma.embedding.findMany({ where: { role: counterpartRole, source: "summary" } });

  const myVec = bytesToFloat32(me.vector as Buffer);
  const scored = others.map((o) => {
    const vec = bytesToFloat32(o.vector as Buffer);
    const sim = cosineSimilarity(myVec, vec);
    // Placeholder: apply simple filter penalties later
    return { userId: o.userId, score: sim };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 20);
}


