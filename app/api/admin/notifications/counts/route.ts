// app/api/admin/notifications/counts/route.ts
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
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const pendingListingsCount = await prisma.listing.count({
      where: { status: "PENDING_REVIEW" },
    });

    const pendingReportsCount = await prisma.report.count({
      where: { status: "PENDING" },
    });

    const activeDisputesCount = await prisma.dispute.count({
      where: { status: "OPEN" },
    });

    return NextResponse.json({
      pendingListings: pendingListingsCount,
      pendingReports: pendingReportsCount,
      activeDisputes: activeDisputesCount,
    });
  } catch (error) {
    console.error("Error fetching admin counts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}