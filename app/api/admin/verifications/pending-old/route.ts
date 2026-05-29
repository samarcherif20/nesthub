// app/api/admin/verifications/pending-old/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    console.log(" [pending-old] userId from Clerk:", userId);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier dans la base de données si l'utilisateur est ADMIN
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    console.log(" [pending-old] user role from DB:", user?.role);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé - Admin seulement" }, { status: 403 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const oldRequests = await prisma.verificationRequest.count({
      where: {
        status: "PENDING",
        submittedAt: { lt: twentyFourHoursAgo },
      },
    });

    return NextResponse.json({ count: oldRequests });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}