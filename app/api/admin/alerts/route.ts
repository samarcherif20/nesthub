// app/api/admin/alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = [];

    // 1. ALERTES HAUTE PRIORITÉ - Litiges ouverts (DISPUTE)
    const openDisputes = await prisma.dispute.findMany({
      where: {
        status: { in: ["OPEN", "PENDING"] },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            listing: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    for (const dispute of openDisputes) {
      alerts.push({
        id: `dispute-${dispute.id}`,
        type: "DISPUTE",
        title: "⚖️ Litige en cours",
        description: `Litige "${dispute.type}" pour "${
          dispute.booking?.listing?.title || "une propriété"
        }"`,
        priority: dispute.priority === "HIGH" ? "HIGH" : "MEDIUM",
        createdAt: dispute.createdAt.toISOString(),
        status: "PENDING",
        listingId: dispute.booking?.listingId,
        listingTitle: dispute.booking?.listing?.title,
      });
    }

    // 2. ALERTES HAUTE PRIORITÉ - Propriétés en attente de validation (PENDING_REVIEW)
    const pendingListings = await prisma.listing.findMany({
      where: {
        status: "PENDING_REVIEW",
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    for (const listing of pendingListings) {
      const ownerName = listing.owner?.firstName
        ? `${listing.owner.firstName} ${listing.owner.lastName || ""}`
        : "Un propriétaire";

      alerts.push({
        id: `validation-pending-${listing.id}`,
        type: "VALIDATION",
        title: "✅ Nouvelle propriété à valider",
        description: `"${listing.title}" par ${ownerName}`,
        priority: "HIGH",
        createdAt: listing.createdAt.toISOString(),
        status: "PENDING",
        listingId: listing.id,
        listingTitle: listing.title,
      });
    }

    // 3. ALERTES MOYENNE PRIORITÉ - Propriétés suspendues
    const suspendedListings = await prisma.listing.findMany({
      where: {
        status: "SUSPENDED",
        updatedAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 jours
        },
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    for (const listing of suspendedListings) {
      alerts.push({
        id: `suspended-${listing.id}`,
        type: "DISPUTE",
        title: "⚠️ Propriété suspendue",
        description: `"${listing.title}" a été suspendue suite à un signalement`,
        priority: "HIGH",
        createdAt: listing.updatedAt.toISOString(),
        status: "PENDING",
        listingId: listing.id,
        listingTitle: listing.title,
      });
    }

    // 4. ALERTES BASSE PRIORITÉ - Modifications récentes (via ListingHistory)
    const recentModifications = await prisma.listingHistory.findMany({
      where: {
        actionType: { in: ["UPDATE", "PRICE_UPDATE", "PHOTO_UPDATE"] },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        changedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Éviter les doublons par propriété
    const seenListingsModif = new Set();
    for (const modif of recentModifications) {
      if (!modif.listing || seenListingsModif.has(modif.listingId)) continue;
      seenListingsModif.add(modif.listingId);

      const modifierName = modif.changedByUser?.firstName
        ? `${modif.changedByUser.firstName} ${modif.changedByUser.lastName || ""}`
        : "Un utilisateur";

      let actionLabel = "modifiée";
      if (modif.actionType === "PRICE_UPDATE") actionLabel = "prix modifié";
      if (modif.actionType === "PHOTO_UPDATE") actionLabel = "photos modifiées";

      alerts.push({
        id: `modification-${modif.id}`,
        type: "MODIFICATION",
        title: "📝 Propriété modifiée",
        description: `"${modif.listing.title}" a été ${actionLabel} par ${modifierName}`,
        priority: "LOW",
        createdAt: modif.createdAt.toISOString(),
        status: "RESOLVED",
        listingId: modif.listingId,
        listingTitle: modif.listing.title,
      });
    }

    // 5. ALERTES INFORMATION - Propriétés récemment validées
    const recentlyValidated = await prisma.listingHistory.findMany({
      where: {
        actionType: "STATUS_CHANGE",
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        changedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const seenListingsValid = new Set();
    for (const validation of recentlyValidated) {
      if (!validation.listing || seenListingsValid.has(validation.listingId))
        continue;

      // Vérifier que c'est un changement vers ACTIVE
      const newValue = validation.newValue as any;
      const isActive = newValue === "ACTIVE" || newValue?.status === "ACTIVE";

      if (isActive) {
        seenListingsValid.add(validation.listingId);
        const validatorName = validation.changedByUser?.firstName
          ? `${validation.changedByUser.firstName} ${validation.changedByUser.lastName || ""}`
          : "L'administrateur";

        alerts.push({
          id: `validated-${validation.id}`,
          type: "VALIDATION",
          title: "✅ Propriété validée",
          description: `"${validation.listing.title}" a été validée par ${validatorName}`,
          priority: "LOW",
          createdAt: validation.createdAt.toISOString(),
          status: "RESOLVED",
          listingId: validation.listingId,
          listingTitle: validation.listing.title,
        });
      }
    }

    // 6. ALERTES - Signalements de listings (ListingReport)
    const listingReports = await prisma.listingReport.findMany({
      where: {
        status: "PENDING",
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        reporter: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    for (const report of listingReports) {
      alerts.push({
        id: `report-${report.id}`,
        type: "DISPUTE",
        title: "🚨 Signalement de propriété",
        description: `"${report.listing?.title}" a été signalé pour "${report.reason}"`,
        priority: "HIGH",
        createdAt: report.createdAt.toISOString(),
        status: "PENDING",
        listingId: report.listingId,
        listingTitle: report.listing?.title,
      });
    }

    // Trier toutes les alertes par date (plus récente en premier)
    alerts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Statistiques des alertes
    const stats = {
      total: alerts.length,
      pending: alerts.filter((a) => a.status === "PENDING").length,
      high: alerts.filter((a) => a.priority === "HIGH").length,
      byType: {
        DISPUTE: alerts.filter((a) => a.type === "DISPUTE").length,
        VALIDATION: alerts.filter((a) => a.type === "VALIDATION").length,
        MODIFICATION: alerts.filter((a) => a.type === "MODIFICATION").length,
      },
    };

    console.log(`📊 Alertes chargées: ${alerts.length}`, stats);

    return NextResponse.json({
      success: true,
      alerts: alerts.slice(0, 15), // Limiter à 15 alertes
      stats,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({
      success: false,
      alerts: [],
      stats: {
        total: 0,
        pending: 0,
        high: 0,
        byType: { DISPUTE: 0, VALIDATION: 0, MODIFICATION: 0 },
      },
      error: "Erreur lors de la récupération des alertes",
    });
  }
}
