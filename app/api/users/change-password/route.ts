import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  console.log("🔐 [change-password] Début de la requête");

  try {
    // 1. Récupérer l'utilisateur authentifié
    console.log("🔍 [change-password] Récupération de l'authentification...");
    const { userId } = await auth();
    console.log("📝 [change-password] userId:", userId);

    if (!userId) {
      console.log("❌ [change-password] Pas d'utilisateur authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 2. Récupérer les données du body
    console.log("📥 [change-password] Récupération du body...");
    const body = await req.json();
    const { currentPassword, newPassword } = body;
    console.log(
      "📝 [change-password] currentPassword length:",
      currentPassword?.length,
    );
    console.log(
      "📝 [change-password] newPassword length:",
      newPassword?.length,
    );
    console.log(
      "📝 [change-password] currentPassword exists:",
      !!currentPassword,
    );
    console.log("📝 [change-password] newPassword exists:", !!newPassword);

    // 3. Validation des champs
    if (!currentPassword || !newPassword) {
      console.log("❌ [change-password] Champs manquants");
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      console.log("❌ [change-password] Mot de passe trop court");
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 },
      );
    }

    // 4. Vérifier la force du mot de passe
    console.log(
      "🔍 [change-password] Vérification de la force du mot de passe...",
    );
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);

    console.log("📊 [change-password] Force du mot de passe:", {
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    });

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      console.log("❌ [change-password] Mot de passe trop faible");
      return NextResponse.json(
        {
          error:
            "Le mot de passe doit contenir des majuscules, minuscules, chiffres et caractères spéciaux",
        },
        { status: 400 },
      );
    }

    // 5. Initialiser Clerk
    console.log("🔧 [change-password] Initialisation de Clerk...");
    const clerk = await clerkClient();
    console.log("✅ [change-password] Clerk initialisé");

    // 6. Récupérer l'utilisateur Clerk
    console.log("👤 [change-password] Récupération de l'utilisateur Clerk...");
    let user;
    try {
      user = await clerk.users.getUser(userId);
      console.log("✅ [change-password] Utilisateur trouvé:", {
        id: user.id,
        emailAddresses: user.emailAddresses.length,
        passwordEnabled: user.passwordEnabled,
      });
    } catch (userError: any) {
      console.error(
        "❌ [change-password] Erreur récupération utilisateur:",
        userError,
      );
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // 7. Récupérer l'email
    const email = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    );
    console.log("📧 [change-password] Email trouvé:", email?.emailAddress);

    if (!email?.emailAddress) {
      console.log("❌ [change-password] Email non trouvé");
      return NextResponse.json({ error: "Email non trouvé" }, { status: 400 });
    }

    // 8. Vérifier si l'utilisateur a un mot de passe (pas OAuth)
    console.log("🔍 [change-password] Vérification du type de compte...");
    console.log("📊 [change-password] passwordEnabled:", user.passwordEnabled);

    if (!user.passwordEnabled) {
      console.log(
        "⚠️ [change-password] Compte OAuth détecté - pas de mot de passe",
      );
      return NextResponse.json(
        {
          error:
            "Ce compte utilise l'authentification sociale. Pas de mot de passe à modifier.",
          isOAuthUser: true,
        },
        { status: 400 },
      );
    }

    // 9. Vérifier l'ancien mot de passe
    console.log(
      "🔐 [change-password] Tentative de vérification de l'ancien mot de passe...",
    );
    console.log(
      "📧 [change-password] Email pour vérification:",
      email.emailAddress,
    );
    console.log(
      "🔑 [change-password] CurrentPassword (masked):",
      "*".repeat(currentPassword.length),
    );

    try {
      const signInResult = await clerk.signIns.createSignIn({
        identifier: email.emailAddress,
        password: currentPassword,
      });

      console.log("📊 [change-password] Résultat signIn:", {
        status: signInResult.status,
        id: signInResult.id,
      });

      if (!signInResult.status || signInResult.status !== "complete") {
        console.log(
          "❌ [change-password] SignIn non complet, status:",
          signInResult.status,
        );
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect" },
          { status: 401 },
        );
      }

      console.log(
        "✅ [change-password] Ancien mot de passe vérifié avec succès",
      );
    } catch (signInError: any) {
      console.error("❌ [change-password] Erreur lors de la vérification:", {
        status: signInError.status,
        message: signInError.message,
        errors: signInError.errors,
      });

      // Si l'utilisateur n'a pas de mot de passe (compte OAuth)
      if (
        signInError.status === 422 ||
        signInError.message?.includes("password") ||
        signInError.message?.includes("identifier")
      ) {
        console.log(
          "⚠️ [change-password] Compte OAuth ou mot de passe non défini",
        );
        return NextResponse.json(
          {
            error:
              "Compte externe. Utilisez votre fournisseur OAuth pour vous connecter.",
            isOAuthUser: true,
          },
          { status: 400 },
        );
      }

      console.log("❌ [change-password] Mot de passe actuel incorrect");
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 401 },
      );
    }

    // 10. Mettre à jour le mot de passe
    console.log("🔄 [change-password] Mise à jour du mot de passe...");
    try {
      await clerk.users.updateUser(userId, {
        password: newPassword,
      });
      console.log("✅ [change-password] Mot de passe mis à jour avec succès");
    } catch (updateError: any) {
      console.error(
        "❌ [change-password] Erreur lors de la mise à jour:",
        updateError,
      );
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du mot de passe" },
        { status: 500 },
      );
    }

    console.log("🎉 [change-password] Succès total de l'opération");
    return NextResponse.json({
      success: true,
      message: "Mot de passe mis à jour avec succès",
    });
  } catch (error: any) {
    console.error("💥 [change-password] Erreur générale:", {
      message: error.message,
      status: error.status,
      stack: error.stack,
    });

    if (error.status === 401) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer plus tard." },
      { status: 500 },
    );
  }
}
