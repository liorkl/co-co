import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { limit } from "@/lib/rateLimit";
import { z } from "zod";

const IntroRequestSchema = z.object({
  targetId: z.string().min(1, "targetId is required").max(100),
  feedback: z.string().max(2000).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
});

const IntroUpdateSchema = z.object({
  targetId: z.string().min(1, "targetId is required").max(100),
  feedback: z.string().max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

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
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = IntroRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { targetId, feedback, rating } = parsed.data;
    
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
    
    return NextResponse.json({ 
      requests,
      currentUserId: userId, // Include current user ID for client-side filtering
    });
  } catch (error: any) {
    console.error("Error fetching intro requests:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch intro requests" },
      { status: 500 }
    );
  }
}

// Update feedback/rating on an existing intro request
export async function PATCH(req: Request) {
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
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = IntroUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { targetId, feedback, rating } = parsed.data;

    // Find existing request where user is requester
    const existingRequest = await prisma.introRequest.findUnique({
      where: {
        requesterId_targetId: {
          requesterId: userId,
          targetId: targetId,
        },
      },
    });
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: "Intro request not found. Please request an intro first." },
        { status: 404 }
      );
    }
    
    // Update feedback and/or rating
    const updatedRequest = await prisma.introRequest.update({
      where: {
        id: existingRequest.id,
      },
      data: {
        ...(feedback !== undefined && { feedback }),
        ...(rating !== undefined && { rating }),
      },
    });
    
    return NextResponse.json({
      success: true,
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        feedback: updatedRequest.feedback,
        rating: updatedRequest.rating,
        updatedAt: updatedRequest.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error updating intro request feedback:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update feedback" },
      { status: 500 }
    );
  }
}

