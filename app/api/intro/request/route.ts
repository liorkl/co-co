import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { limit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userId = (session as any).userId as string;
  
  // Rate limit by user ID
  const res = await limit(`intro:${userId}`, "api");
  if (!res.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  
  try {
    const { targetId, feedback, rating } = await req.json();
    
    if (!targetId) {
      return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    }
    
    // Validate that target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }
    
    // Prevent self-requests
    if (targetId === userId) {
      return NextResponse.json({ error: "Cannot request intro to yourself" }, { status: 400 });
    }
    
    // Check if request already exists
    const existingRequest = await prisma.introRequest.findUnique({
      where: {
        requesterId_targetId: {
          requesterId: userId,
          targetId: targetId,
        },
      },
    });
    
    if (existingRequest) {
      return NextResponse.json(
        { 
          error: "Request already exists",
          request: {
            id: existingRequest.id,
            status: existingRequest.status,
            createdAt: existingRequest.createdAt,
          }
        },
        { status: 409 }
      );
    }
    
    // Create intro request
    const introRequest = await prisma.introRequest.create({
      data: {
        requesterId: userId,
        targetId: targetId,
        status: "PENDING",
        feedback: feedback || null,
        rating: rating || null,
      },
    });
    
    // TODO: Send admin notification (email/Slack)
    // For now, log it
    console.log(`[INTRO REQUEST] New request from ${userId} to ${targetId}`, {
      requestId: introRequest.id,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json({
      success: true,
      request: {
        id: introRequest.id,
        status: introRequest.status,
        createdAt: introRequest.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error creating intro request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create intro request" },
      { status: 500 }
    );
  }
}

// Get intro requests for the current user
export async function GET() {
  const session = await auth();
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userId = (session as any).userId as string;
  
  try {
    // Get requests where user is requester or target
    const requests = await prisma.introRequest.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { targetId: userId },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        target: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("Error fetching intro requests:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch intro requests" },
      { status: 500 }
    );
  }
}

