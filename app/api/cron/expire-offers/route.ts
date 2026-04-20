import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Ce endpoint doit être appelé par un CRON toutes les heures
// Sur Vercel: utiliser vercel.json ou le dashboard
export async function GET() {
  try {
    const now = new Date();

    // Trouver les offres expirées
    const expiredOffers = await prisma.offer.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      include: {
        listing: true,
        infoRequest: {
          include: {
            conversation: true,
          },
        },
      },
    });

    console.log(`🔍 ${expiredOffers.length} offres expirées trouvées`);

    for (const offer of expiredOffers) {
      // Mettre à jour le statut
      await prisma.offer.update({
        where: { id: offer.id },
        data: { status: "EXPIRED" },
      });

      // Message système dans le chat
      const conversation = offer.infoRequest?.conversation;
      if (conversation) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: offer.ownerId,
            receiverId: offer.tenantId,
            content: `⏰ **Offre expirée**\n\nL'offre n'a pas été acceptée dans les 24h.\n\nVous pouvez faire une nouvelle demande si vous êtes toujours intéressé.`,
            isRead: false,
            isSystem: true,
          },
        });
      }

      // Notifier les deux parties
      await prisma.notification.createMany({
        data: [
          {
            userId: offer.tenantId,
            type: "OFFER_EXPIRED",
            title: "Offre expirée",
            content: `Votre offre pour "${offer.listing.title}" a expiré faute de réponse.`,
            data: { offerId: offer.id },
            channels: ["IN_APP", "EMAIL"],
          },
          {
            userId: offer.ownerId,
            type: "OFFER_EXPIRED",
            title: "Offre expirée",
            content: `L'offre de ${offer.tenantId} pour "${offer.listing.title}" a expiré.`,
            data: { offerId: offer.id },
            channels: ["IN_APP", "EMAIL"],
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      expired: expiredOffers.length,
    });
  } catch (error) {
    console.error("Erreur expiration offres:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}