// app/api/cron/expire-info-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    // ✅ Ajoute cette vérification d'auth
    const authHeader = req.headers.get("authorization");
    const isValidAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isDev = process.env.NODE_ENV === "development";

    if (!isValidAuth && !isDev) {
      console.error("❌ Cron: Authentification échouée");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log("🕐 Cron: Expiration des demandes d'information");

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

    console.log(`📊 ${expiredRequests.length} demande(s) expirée(s)`);

    for (const request of expiredRequests) {
      await prisma.infoRequest.update({
        where: { id: request.id },
        data: { status: "EXPIRED" },
      });

      const tenantName = request.tenant?.username || "un locataire";

      await prisma.notification.create({
        data: {
          userId: request.tenantId,
          type: "INFO_REQUEST_EXPIRED",
          title: "Demande expirée",
          content: `Le propriétaire n'a pas répondu à votre demande pour "${request.listing.title}" dans les 48h.`,
          data: { infoRequestId: request.id, listingId: request.listingId },
          channels: ["IN_APP", "EMAIL"],
        },
      });

      await prisma.notification.create({
        data: {
          userId: request.ownerId,
          type: "INFO_REQUEST_EXPIRED",
          title: "Demande expirée",
          content: `Vous n'avez pas répondu à la demande de ${tenantName} pour "${request.listing.title}" dans les 48h.`,
          data: { infoRequestId: request.id, listingId: request.listingId },
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
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
