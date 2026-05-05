// app/api/users/upgrade-role/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    console.log("🔑 [UPGRADE] userId:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    if (user.role === "BOTH") {
      return NextResponse.json({ error: "Déjà en mode BOTH" }, { status: 400 });
    }

    // Mise à jour vers BOTH
    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: { role: "BOTH" },
    });

    console.log("✅ [UPGRADE] Nouveau rôle:", updatedUser.role);

    // ✅ CORRECTION : Ajout du champ 'content' requis
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM_ALERT", // Utilisez un type existant
          title: "Mode Double Identité activé !",
          content:
            "Félicitations ! Vous pouvez maintenant utiliser NESTHUB en tant que Locataire ET Propriétaire.", // ← AJOUTÉ !
          isRead: false,
        },
      });
      console.log("✅ Notification créée");
    } catch (notifError) {
      // Ignorer l'erreur de notification si la table a des contraintes
      console.log("⚠️ Notification non créée:", notifError);
    }

    return NextResponse.json({
      success: true,
      role: updatedUser.role,
      message: "Mode Double Identité activé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur upgrade:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'upgrade" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      currentRole: user.role,
      canUpgrade: user.role !== "BOTH",
      alreadyUpgraded: user.role === "BOTH",
    });
  } catch (error) {
    console.error("Erreur vérification:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
