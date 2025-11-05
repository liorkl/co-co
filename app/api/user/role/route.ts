import { prisma } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { role } = await req.json();
  if (role !== "CEO" && role !== "CTO") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  await prisma.user.update({ where: { id: (session as any).userId }, data: { role } });
  return NextResponse.json({ ok: true });
}


