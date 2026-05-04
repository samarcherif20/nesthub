// app/api/user/switch-role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a le droit de changer de rôle
    if (user.role !== "BOTH") {
      return NextResponse.json({ 
        error: "Vous n'avez pas le droit de changer de rôle. Votre compte n'est pas configuré en mode BOTH." 
      }, { status: 403 });
    }

    // Mettre à jour le rôle actif (ajouter un champ `activeRole` si nécessaire)
    // Pour l'instant, on modifie directement le rôle
    // Mais attention : cela efface le mode BOTH !
    
    // ✅ Solution : Ajouter un champ `activeRole` dans le modèle User
    // Option 1: Modifier Prisma pour ajouter activeRole
    // Option 2: Utiliser la session pour stocker le rôle actif
    
    // Solution temporaire : stocker dans la session côté frontend
    // Le rôle dans la DB reste BOTH
    
    return NextResponse.json({ 
      success: true, 
      activeRole: targetRole,
      message: `Vous êtes maintenant en mode ${targetRole === "TENANT" ? "Locataire" : "Propriétaire"}`
    });
    
  } catch (error) {
    console.error("Erreur changement de rôle:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET - Récupérer le rôle actif
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
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer le rôle actif depuis le cookie/session
    // Pour l'instant, on retourne le rôle par défaut
    const activeRole = user.role === "BOTH" ? "TENANT" : user.role;

    return NextResponse.json({ 
      userRole: user.role,
      activeRole,
      canSwitch: user.role === "BOTH"
    });
    
  } catch (error) {
    console.error("Erreur récupération rôle:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}