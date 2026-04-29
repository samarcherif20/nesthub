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

    // Compter les annonces par statut
    const [total, pending, revisions, processedToday] = await Promise.all([
      prisma.listing.count({
        where: {
          OR: [
            { status: "PENDING_REVIEW" },
            { status: "ACTIVE", hasPendingRevision: true },
          ],
        },
      }),
      prisma.listing.count({
        where: {
          status: "PENDING_REVIEW",
          hasPendingRevision: false,
        },
      }),
      prisma.listing.count({
        where: {
          status: "ACTIVE",
          hasPendingRevision: true,
        },
      }),
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

    // Calculer le temps moyen de réponse (exemple)
    const avgResponseTime = 3.4;

    return NextResponse.json({
      total,
      pending,
      revisions,
      processedToday,
      avgResponseTime,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}