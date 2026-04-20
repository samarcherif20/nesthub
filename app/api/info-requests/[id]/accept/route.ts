import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const infoRequest = await prisma.infoRequest.findUnique({
      where: { id },
      include: {
        listing: true,
        tenant: true,
        owner: true,
      },
    });

    if (!infoRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 },
      );
    }

    // Vérifier que c'est bien le propriétaire
    if (infoRequest.ownerId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier que la demande est encore en attente
    if (infoRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette demande a déjà été traitée" },
        { status: 400 },
      );
    }

    // 1. Vérifier si une conversation existe déjà
    let conversation = await prisma.conversation.findUnique({
      where: {
        listingId_ownerId_tenantId: {
          listingId: infoRequest.listingId,
          ownerId: infoRequest.ownerId,
          tenantId: infoRequest.tenantId,
        },
      },
    });

    // 2. Si pas de conversation, en créer une nouvelle
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          listingId: infoRequest.listingId,
          ownerId: infoRequest.ownerId,
          tenantId: infoRequest.tenantId,
          infoRequestId: infoRequest.id,
          status: "OPEN",
          lastMessageAt: new Date(),
        },
      });
    }

    // 3. Mettre à jour la demande
    const updated = await prisma.infoRequest.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        respondedAt: new Date(),
        conversation: {
          connect: { id: conversation.id },
        },
      },
    });

    // 4. Vérifier si un message système existe déjà pour éviter les doublons
    const existingSystemMessage = await prisma.message.findFirst({
      where: {
        conversationId: conversation.id,
        isSystem: true,
        content: { contains: "accepté votre demande" },
      },
    });

    if (!existingSystemMessage) {
      // Créer un message système dans le chat
      const systemMessage = `💬 Le propriétaire a accepté votre demande. Vous pouvez maintenant discuter.`;

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: infoRequest.ownerId,
          receiverId: infoRequest.tenantId,
          content: systemMessage,
          isRead: false,
          isSystem: true,
        },
      });
    }

    // 5. Notifier le locataire
    await prisma.notification.create({
      data: {
        userId: infoRequest.tenantId,
        type: "INFO_REQUEST_ACCEPTED",
        title: "✅ Demande acceptée !",
        content: `Le propriétaire a accepté votre demande pour "${infoRequest.listing.title}". Vous pouvez maintenant discuter avec lui.`,
        data: {
          infoRequestId: infoRequest.id,
          conversationId: conversation.id,
          listingId: infoRequest.listingId,
        },
        channels: ["IN_APP", "EMAIL"],
      },
    });

    // 6. Mettre à jour les compteurs de messages non lus
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        unreadCountTenant: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      conversation,
      infoRequest: updated,
      message: "Demande acceptée, chat ouvert",
    });
  } catch (error) {
    console.error("Erreur acceptation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
