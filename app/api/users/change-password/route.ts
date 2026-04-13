// app/api/users/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    const { currentPassword, newPassword } = await req.json();

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
    }

    const clerk = await clerkClient();
    
    // Vérifier l'ancien mot de passe (via tentative de connexion)
    try {
      await clerk.users.verifyPassword({
        userId: clerkId,
        password: currentPassword,
      });
    } catch {
      return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
    }

    // Mettre à jour le mot de passe
    await clerk.users.updateUser(clerkId, {
      password: newPassword,
    });

    return NextResponse.json({ success: true, message: "Mot de passe mis à jour" });
  } catch (error) {
    console.error("[POST /api/users/change-password] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}