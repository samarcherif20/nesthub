// app/api/conversations/group/[conversationId]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const { conversationId } = await params;
    const groupId = conversationId.replace("group_", "");

    const group = await prisma.groupConversation.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        status: true,
        isBlocked: true,
        dispute: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      isClosed: group.status !== "ACTIVE",
      isBlocked: group.isBlocked || false,
      blockReason: null,
      isChecking: false,
      isUserBlocked: false,
      hasBlockedUser: false,
    });
  } catch (error) {
    console.error("Error fetching group status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}