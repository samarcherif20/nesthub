// app/api/admin/listings/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    //  Compter les annonces par statut (complet)
    const [
      total,
      pending,
      revisions,
      validated,
      rejected,
      processedToday,
    ] = await Promise.all([
      // Total en attente de validation
      prisma.listing.count({
        where: {
          OR: [
            { status: "PENDING_REVIEW" },
            { status: "ACTIVE", hasPendingRevision: true },
          ],
        },
      }),
      // Nouvelles annonces en attente
      prisma.listing.count({
        where: {
          status: "PENDING_REVIEW",
          hasPendingRevision: false,
        },
      }),
      // Modifications en attente
      prisma.listing.count({
        where: {
          status: "ACTIVE",
          hasPendingRevision: true,
        },
      }),
      //  Annonces validées (historique)
      prisma.listing.count({
        where: {
          status: "ACTIVE",
          hasPendingRevision: false,
        },
      }),
      //  Annonces rejetées (historique)
      prisma.listing.count({
        where: {
          status: "REJECTED",
        },
      }),
      // Traitées aujourd'hui
      prisma.listing.count({
        where: {
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          OR: [
            { status: "ACTIVE" },
            { status: "REJECTED" },
          ],
        },
      }),
    ]);

    // Calculer le temps moyen de réponse (en heures)
    // Récupérer les annonces traitées avec leurs dates
    const processedListings = await prisma.listing.findMany({
      where: {
        OR: [
          { validatedAt: { not: null } },
          { rejectedAt: { not: null } },
        ],
      },
      select: {
        createdAt: true,
        validatedAt: true,
        rejectedAt: true,
      },
    });

    let avgResponseTime = 0;
    if (processedListings.length > 0) {
      const totalHours = processedListings.reduce((sum, listing) => {
        const processedAt = listing.validatedAt || listing.rejectedAt;
        if (processedAt) {
          const diffMs = processedAt.getTime() - listing.createdAt.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          return sum + diffHours;
        }
        return sum;
      }, 0);
      avgResponseTime = parseFloat((totalHours / processedListings.length).toFixed(1));
    }

    return NextResponse.json({
      total,
      pending,
      revisions,
      validated,    
      rejected,     
      processedToday,
      avgResponseTime,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}