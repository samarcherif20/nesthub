// app/api/users/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    console.log(" Début changement mot de passe");
    
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    console.log(" userId:", userId);

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
    console.log(" CLERK_API_KEY présent:", !!CLERK_API_KEY);

    // 1. Récupérer l'utilisateur pour obtenir son email
    console.log(" Récupération de l'utilisateur...");
    const userResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!userResponse.ok) {
      console.log(" Erreur récupération utilisateur:", userResponse.status);
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const user = await userResponse.json();
    const email = user.email_addresses?.find((e: any) => e.id === user.primary_email_address_id)?.email_address;
    console.log(" Email trouvé:", email);

    if (!email) {
      return NextResponse.json({ error: "Aucun email trouvé" }, { status: 400 });
    }

    // 2. VÉRIFIER L'ANCIEN MOT DE PASSE via l'API sign_in_tokens de Clerk
    console.log(" Vérification de l'ancien mot de passe...");
    
    const signInResponse = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CLERK_API_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,       
        password: currentPassword,
      }),
    });

    console.log(" Status vérification:", signInResponse.status);

    if (!signInResponse.ok) {
      const errorText = await signInResponse.text();
      console.log(" Réponse erreur:", errorText);
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 401 }
      );
    }

    console.log(" Ancien mot de passe vérifié avec succès");

    // 3. Changer le mot de passe
    console.log(" Changement du mot de passe...");
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
      console.error(" Erreur changement:", error);
      return NextResponse.json(
        { error: "Erreur lors du changement de mot de passe" },
        { status: 500 }
      );
    }

    console.log(" Mot de passe mis à jour avec succès");

    return NextResponse.json({
      success: true,
      message: "Mot de passe mis à jour avec succès",
    });
  } catch (error: any) {
    console.error(" Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Une erreur est survenue" },
      { status: 500 }
    );
  }
}