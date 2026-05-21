// app/api/user/verify-identity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, isEmailVerified: true, isPhoneVerified: true, isIdentityVerified: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier si l'utilisateur est déjà vérifié
    if (user.isIdentityVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    // Vérifier les prérequis
    if (!user.isEmailVerified || !user.isPhoneVerified) {
      return NextResponse.json(
        { error: "Email et téléphone doivent être vérifiés" },
        { status: 400 }
      );
    }

    // Marquer l'utilisateur comme vérifié
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isIdentityVerified: true,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur vérification identité:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}