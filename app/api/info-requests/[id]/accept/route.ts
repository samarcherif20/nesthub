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

    // Vérifier si une notification a déjà été envoyée
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: infoRequest.tenantId,
        type: "INFO_REQUEST_ACCEPTED",
        data: { path: ["infoRequestId"], equals: infoRequest.id }
      }
    });

    // 1. Vérifier si une conversation existe déjà
    let conversation = await prisma.conversation.findFirst({
      where: {
        listingId: infoRequest.listingId,
        ownerId: infoRequest.ownerId,
        tenantId: infoRequest.tenantId,
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
      console.log(" Nouvelle conversation créée:", conversation.id);
    } else {
      console.log(" Conversation existante trouvée:", conversation.id);
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

    // 4. SUPPRIMER l'ancien message système (s'il existe)
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        conversationId: conversation.id,
        isSystem: true,
        content: { contains: "accepté votre demande" },
      },
    });

    if (deletedMessages.count > 0) {
      console.log(
        ` ${deletedMessages.count} ancien(s) message(s) système supprimé(s)`,
      );
    }

    // 5. CRÉER le nouveau message système
    const checkInDate = new Date(infoRequest.checkIn).toLocaleDateString(
      "fr-FR",
    );
    const checkOutDate = new Date(infoRequest.checkOut).toLocaleDateString(
      "fr-FR",
    );

    const systemMessage = ` Le propriétaire a accepté votre demande pour les dates du ${checkInDate} au ${checkOutDate}. Vous pouvez maintenant discuter.`;

    const newMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: infoRequest.ownerId,
        receiverId: infoRequest.tenantId,
        content: systemMessage,
        isRead: false,
        isSystem: true,
      },
    });

    console.log(" Nouveau message système créé:", newMessage.id);

    // 6. Mettre à jour le dernier message de la conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: systemMessage,
        lastMessageAt: new Date(),
        unreadCountTenant: {
          increment: 1,
        },
      },
    });

    // 7. Envoyer une notification au locataire (si pas déjà envoyée)
    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: infoRequest.tenantId,
          type: "INFO_REQUEST_ACCEPTED",
          title: "Demande acceptée ",
          content: `Votre demande d'information pour "${infoRequest.listing.title}" a été acceptée par le propriétaire`,
          data: {
            infoRequestId: infoRequest.id,
            listingId: infoRequest.listingId,
            listingTitle: infoRequest.listing.title,
            tenantId: infoRequest.tenantId,
            tenantUsername: infoRequest.tenant?.username,
            checkIn: infoRequest.checkIn,
            checkOut: infoRequest.checkOut,
            guests: infoRequest.guests,
            status: "ACCEPTED",
          },
          channels: ["IN_APP"],
        },
      });
      console.log("Notification envoyée au locataire");
    }

    return NextResponse.json({
      success: true,
      conversation,
      infoRequest: updated,
      message: "Demande acceptée, chat ouvert",
    });
  } catch (error) {
    console.error(" Erreur acceptation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}