import { PrismaClient } from "@prisma/client";

export async function resetPrismaForE2E(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.session.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.account.deleteMany(),
    prisma.match.deleteMany(),
    prisma.embedding.deleteMany(),
    prisma.profileSummary.deleteMany(),
    prisma.interviewResponse.deleteMany(),
    prisma.techBackground.deleteMany(),
    prisma.startup.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export function toVectorBuffer(values: number[]) {
  return Buffer.from(new Float32Array(values).buffer);
}


