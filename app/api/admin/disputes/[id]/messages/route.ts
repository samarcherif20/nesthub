import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// POST - Admin envoie un message dans un litige
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    const { content } = await request.json();

    if (!userId || !content) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 },
      );
    }

    // Vérifier que l'utilisateur est admin
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier que le litige existe
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            tenant: true,
            owner: true,
            listing: true,
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Litige non trouvé" }, { status: 404 });
    }

    // Créer le message
    const message = await prisma.disputeMessage.create({
      data: {
        disputeId: id,
        senderId: admin.id,
        content: content,
        attachments: [],
        isInternal: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            role: true,
          },
        },
      },
    });

    // Notifier les parties prenantes
    const parties = [
      dispute.openedBy,
      dispute.booking?.tenantId,
      dispute.booking?.ownerId,
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const partyId of parties) {
      if (partyId && partyId !== admin.id) {
        await prisma.notification.create({
          data: {
            userId: partyId,
            type: "DISPUTE_MESSAGE",
            title: "💬 Nouveau message dans votre litige",
            content: `Un administrateur a répondu à votre litige concernant "${dispute.booking?.listing?.title || "votre réservation"}"`,
            data: { disputeId: dispute.id, messageId: message.id },
          },
        });
      }
    }

    // Formater la réponse
    const formattedMessage = {
      id: message.id,
      senderId: message.senderId,
      senderName:
        `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || "Admin",
      senderRole: "ADMIN" as const,
      content: message.content,
      attachments: message.attachments,
      createdAt: message.createdAt.toISOString(),
    };

    return NextResponse.json(formattedMessage, { status: 201 });
  } catch (error) {
    console.error("Erreur envoi message admin:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET - Récupérer tous les messages d'un litige (admin version)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupérer tous les messages du litige
    const messages = await prisma.disputeMessage.findMany({
      where: { disputeId: id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Formater les messages pour le frontend
    const formattedMessages = messages.map((msg) => {
      let senderRole: "TENANT" | "OWNER" | "ADMIN" = "TENANT";
      if (msg.sender.role === "ADMIN") senderRole = "ADMIN";
      else if (msg.sender.role === "PROPERTY_OWNER") senderRole = "OWNER";

      return {
        id: msg.id,
        senderId: msg.senderId,
        senderName:
          `${msg.sender.firstName || ""} ${msg.sender.lastName || ""}`.trim(),
        senderRole: senderRole,
        content: msg.content,
        attachments: msg.attachments,
        createdAt: msg.createdAt.toISOString(),
      };
    });

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Erreur récupération messages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
