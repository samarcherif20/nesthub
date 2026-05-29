import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }  // ← conversationId
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //  Extraire conversationId 
    const { conversationId } = await params;

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        isBlocked: true,
        status: true,
        messages: {
          where: { isSystem: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isClosed = conversation.isBlocked || conversation.status === "CLOSED_BY_ADMIN";
    const lastSystemMessage = conversation.messages[0];

    return NextResponse.json({
      isClosed,
      status: conversation.status,
      isBlocked: conversation.isBlocked,
      blockReason: lastSystemMessage?.content || null,
      blockedAt: lastSystemMessage?.createdAt || null
    });
  } catch (error) {
    console.error("Error checking conversation status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}