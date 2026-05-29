// app/api/cron/expire-offers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    //  Ajoute cette vérification d'auth
    const authHeader = req.headers.get("authorization");
    const isValidAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isDev = process.env.NODE_ENV === "development";

    if (!isValidAuth && !isDev) {
      console.error(" Cron: Authentification échouée");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log(" Cron: Expiration des offres");
    const now = new Date();

    const expiredOffers = await prisma.offer.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      include: {
        listing: true,
        infoRequest: {
          include: { conversation: true },
        },
      },
    });

    console.log(` ${expiredOffers.length} offre(s) expirée(s)`);

    for (const offer of expiredOffers) {
      await prisma.offer.update({
        where: { id: offer.id },
        data: { status: "EXPIRED" },
      });

      const conversation = offer.infoRequest?.conversation;
      if (conversation) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: offer.ownerId,
            receiverId: offer.tenantId,
            content: ` **Offre expirée**\n\nL'offre n'a pas été acceptée dans les 24h.\n\nVous pouvez faire une nouvelle demande si vous êtes toujours intéressé.`,
            isRead: false,
            isSystem: true,
          },
        });
      }

      await prisma.notification.createMany({
        data: [
          {
            userId: offer.tenantId,
            type: "OFFER_EXPIRED",
            title: "Offre expirée",
            content: `Votre offre pour "${offer.listing.title}" a expiré.`,
            data: { offerId: offer.id },
            channels: ["IN_APP", "EMAIL"],
          },
          {
            userId: offer.ownerId,
            type: "OFFER_EXPIRED",
            title: "Offre expirée",
            content: `L'offre pour "${offer.listing.title}" a expiré.`,
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
