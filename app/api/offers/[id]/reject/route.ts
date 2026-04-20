import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // ✅ CORRECTION: await params
    const { id: offerId } = await params;
    const body = await req.json();
    const { reason } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        listing: true,
        infoRequest: {
          include: {
            conversation: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (offer.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Seul le propriétaire peut refuser l'offre" },
        { status: 403 },
      );
    }

    // Vérifier que l'offre est encore en attente
    if (offer.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette offre n'est plus disponible" },
        { status: 400 },
      );
    }

    // Mettre à jour l'offre
    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
      },
    });

    // Créer un message système dans le chat
    const conversation = offer.infoRequest?.conversation;
    if (conversation) {
      const reasonText = reason ? ` Raison: ${reason}` : "";
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: offer.ownerId,
          receiverId: offer.tenantId,
          content: `❌ **Offre refusée**\n\nLe propriétaire a refusé votre offre.${reasonText}\n\nVous pouvez continuer à discuter pour trouver un accord.`,
          isRead: false,
          isSystem: true,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: `Offre refusée`,
          lastMessageAt: new Date(),
        },
      });
    }

    // Notification au locataire
    await prisma.notification.create({
      data: {
        userId: offer.tenantId,
        type: "OFFER_REJECTED",
        title: "Offre refusée",
        content: `Le propriétaire a refusé votre offre pour "${offer.listing.title}".${reason ? ` Motif: ${reason}` : ""}`,
        data: {
          offerId: offer.id,
          listingId: offer.listingId,
        },
        channels: ["IN_APP", "EMAIL"],
      },
    });

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
    });
  } catch (error) {
    console.error("Erreur refus offre:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
