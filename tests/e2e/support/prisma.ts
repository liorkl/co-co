import { PrismaClient } from "@prisma/client";

export async function resetPrismaForE2E(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany();
    await tx.verificationToken.deleteMany();
    await tx.account.deleteMany();
    await tx.match.deleteMany();
    await tx.embedding.deleteMany();
    await tx.profileSummary.deleteMany();
    await tx.interviewResponse.deleteMany();
    await tx.techBackground.deleteMany();
    await tx.startup.deleteMany();
    await tx.profile.deleteMany();
    await tx.user.deleteMany();
  });
}

export function toVectorBuffer(values: number[]) {
  return Buffer.from(new Float32Array(values).buffer);
}


