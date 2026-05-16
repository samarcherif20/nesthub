// app/api/admin/risk-score/recalculate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { updateUserRiskScore } from "@/lib/risk-scoring";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est ADMIN
    const currentUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { role: true }
    });

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin requis" }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    const score = await updateUserRiskScore(userId, "ADMIN_MANUAL");
    
    return NextResponse.json({ success: true, riskScore: score });
    
  } catch (error) {
    console.error("[POST /api/admin/risk-score/recalculate] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}