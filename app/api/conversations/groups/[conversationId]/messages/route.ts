// app/api/conversations/group/[conversationId]/messages/route.ts
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

    // Vérifier que l'utilisateur fait partie du groupe
    const participant = await prisma.groupConversationParticipant.findFirst({
      where: {
        groupId: groupId,
        userId: currentUser.id,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Récupérer les messages du groupe
    const messages = await prisma.groupConversationMessage.findMany({
      where: { groupId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Marquer les messages comme lus
    await prisma.groupConversationParticipant.update({
      where: { id: participant.id },
      data: { unreadCount: 0 },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.sender.username || "Utilisateur",
      senderImage: msg.sender.profilePictureUrl,
      createdAt: msg.createdAt.toISOString(),
      isBlocked: false,
      isRead: true,
      isSystem: msg.isSystem,
      type: "text",
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Envoyer un message dans un groupe
export async function POST(
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
      select: { id: true, username: true, profilePictureUrl: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const { conversationId } = await params;
    const groupId = conversationId.replace("group_", "");
    const { content, isSystem } = await req.json();

    // Vérifier que l'utilisateur fait partie du groupe
    const participant = await prisma.groupConversationParticipant.findFirst({
      where: {
        groupId: groupId,
        userId: currentUser.id,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Créer le message
    const message = await prisma.groupConversationMessage.create({
      data: {
        groupId,
        senderId: currentUser.id,
        content,
        isSystem: isSystem || false,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    // Mettre à jour le dernier message du groupe
    await prisma.groupConversation.update({
      where: { id: groupId },
      data: {
        lastMessage: content.substring(0, 100),
        lastMessageAt: new Date(),
      },
    });

    // Incrémenter les compteurs de non-lus pour les autres participants
    await prisma.groupConversationParticipant.updateMany({
      where: {
        groupId,
        userId: { not: currentUser.id },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender.username,
      senderImage: message.sender.profilePictureUrl,
      createdAt: message.createdAt.toISOString(),
      isSystem: message.isSystem,
    });
  } catch (error) {
    console.error("Error sending group message:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}