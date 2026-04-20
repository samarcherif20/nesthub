import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// À exécuter toutes les heures
export async function GET() {
  try {
    const expiredRequests = await prisma.infoRequest.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: new Date() },
      },
      include: {
        listing: true,
        tenant: true,
        owner: true,
      },
    });

    for (const request of expiredRequests) {
      // Mettre à jour le statut
      await prisma.infoRequest.update({
        where: { id: request.id },
        data: { status: "EXPIRED" },
      });

      // Notifier le locataire
      await prisma.notification.create({
        data: {
          userId: request.tenantId,
          type: "INFO_REQUEST_EXPIRED",
          title: "Demande expirée",
          content: `Le propriétaire n'a pas répondu à votre demande pour "${request.listing.title}" dans les 48h. Les dates sont maintenant libres.`,
          data: {
            infoRequestId: request.id,
            listingId: request.listingId,
          },
          channels: ["IN_APP", "EMAIL"],
        },
      });

      // Notifier le propriétaire
      await prisma.notification.create({
        data: {
          userId: request.ownerId,
          type: "INFO_REQUEST_EXPIRED",
          title: "Demande expirée",
          content: `Vous n'avez pas répondu à la demande de ${request.tenant.username || "un locataire"} pour "${request.listing.title}" dans les 48h. La demande a expiré.`,
          data: {
            infoRequestId: request.id,
            listingId: request.listingId,
          },
          channels: ["IN_APP", "EMAIL"],
        },
      });
    }

    return NextResponse.json({
      success: true,
      expiredCount: expiredRequests.length,
    });
  } catch (error) {
    console.error("Erreur cron expiration:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}