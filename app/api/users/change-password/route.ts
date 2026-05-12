import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    const CLERK_API_KEY = process.env.CLERK_SECRET_KEY;

    // 1. Récupérer l'utilisateur pour obtenir son email
    const userResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const user = await userResponse.json();
    const email = user.email_addresses?.[0]?.email_address;

    if (!email) {
      return NextResponse.json(
        { error: "Aucun email trouvé" },
        { status: 400 }
      );
    }

    // 2. VÉRIFIER L'ANCIEN MOT DE PASSE
    const verifyResponse = await fetch("https://api.clerk.com/v1/sign_ins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CLERK_API_KEY}`,
      },
      body: JSON.stringify({
        identifier: email,
        password: currentPassword,
      }),
    });

    if (!verifyResponse.ok) {
      console.log("❌ Ancien mot de passe incorrect");
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 401 }
      );
    }

    console.log("✅ Ancien mot de passe vérifié");

    // 3. Changer le mot de passe
    const updateResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CLERK_API_KEY}`,
      },
      body: JSON.stringify({
        password: newPassword,
      }),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.error("Update error:", error);
      return NextResponse.json(
        { error: "Erreur lors du changement de mot de passe" },
        { status: 500 }
      );
    }

    console.log("✅ Mot de passe mis à jour avec succès");

    return NextResponse.json({
      success: true,
      message: "Mot de passe mis à jour avec succès",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: error.message || "Une erreur est survenue" },
      { status: 500 }
    );
  }
}