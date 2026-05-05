// app/api/users/switch-role/route.ts - AMÉLIORÉ

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Pour stocker le rôle actif en session (alternative sans modifier la BDD)
const activeRoleStore = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { targetRole } = await req.json();

    if (!targetRole || !["TENANT", "PROPERTY_OWNER"].includes(targetRole)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
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

    // Vérifier que l'utilisateur a le droit de changer de rôle
    if (user.role !== "BOTH") {
      return NextResponse.json(
        {
          error:
            "Vous n'avez pas le droit de changer de rôle. Votre compte n'est pas configuré en mode BOTH.",
        },
        { status: 403 },
      );
    }

    // Stocker le rôle actif en mémoire (ou utiliser un cookie)
    activeRoleStore.set(userId, targetRole);

    // Créer une réponse avec cookie
    const response = NextResponse.json({
      success: true,
      activeRole: targetRole,
      message: `Vous êtes maintenant en mode ${targetRole === "TENANT" ? "Locataire" : "Propriétaire"}`,
    });

    // Option: set cookie pour persister le rôle actif
    response.cookies.set("activeRole", targetRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    return response;
  } catch (error) {
    console.error("Erreur changement de rôle:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
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
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Récupérer le rôle actif: d'abord du store, puis du cookie
    let activeRole = activeRoleStore.get(userId);

    if (!activeRole) {
      const cookieRole = req.cookies.get("activeRole")?.value;
      activeRole = cookieRole || (user.role === "BOTH" ? "TENANT" : user.role);
    }

    return NextResponse.json({
      userRole: user.role,
      activeRole,
      canSwitch: user.role === "BOTH",
    });
  } catch (error) {
    console.error("Erreur récupération rôle:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
