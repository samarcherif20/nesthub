import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { AccountStatus } from "@prisma/client";

// GET - Vérifier l'invitation
export async function GET(req: NextRequest) {
  console.log(" GET request received to /api/admin/invitations/accept");

  try {
    const token = req.nextUrl.searchParams.get("token");
    console.log(" GET request with token:", token);

    if (!token) {
      return NextResponse.json({
        valid: false,
        reason: "no_token",
      });
    }

    const invitation = await prisma.adminInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      console.log(" Invitation not found for token:", token);
      return NextResponse.json({
        valid: false,
        reason: "not_found",
      });
    }

    if (invitation.acceptedAt) {
      console.log(" Invitation already used:", invitation.acceptedAt);
      return NextResponse.json({
        valid: false,
        reason: "already_used",
      });
    }

    if (new Date() > invitation.expiresAt) {
      console.log(" Invitation expired:", invitation.expiresAt);
      return NextResponse.json({
        valid: false,
        reason: "expired",
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    // Récupérer l'invitant
    const inviter = await prisma.user.findUnique({
      where: { clerkId: invitation.invitedBy },
      select: { firstName: true, lastName: true, email: true },
    });

    console.log(" GET request successful for email:", invitation.email);

    return NextResponse.json({
      valid: true,
      type: "ADMIN",
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      hasExistingAccount: !!existingUser,
      invitedBy: inviter
        ? {
            name: `${inviter.firstName || ""} ${inviter.lastName || ""}`.trim(),
            email: inviter.email,
          }
        : null,
    });
  } catch (error) {
    console.error("[GET /api/admin/invitations/accept] Error:", error);
    return NextResponse.json({
      valid: false,
      reason: "error",
    });
  }
}

// POST - Accepter l'invitation
export async function POST(req: NextRequest) {
  console.log(" POST request received to /api/admin/invitations/accept");

  try {
    const body = await req.json();
    console.log("Request body:", {
      ...body,
      password: body.password ? "[REDACTED]" : undefined,
    });

    const { token, firstName, lastName, username, password } = body;

    if (!token) {
      console.log(" No token provided");
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    console.log(" Looking up invitation with token:", token);

    // Vérifier le token
    const invitation = await prisma.adminInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      console.log(" Invitation not found for token:", token);
      return NextResponse.json(
        { error: "Invitation invalide ou introuvable" },
        { status: 404 },
      );
    }

    console.log(" Invitation found:", {
      id: invitation.id,
      email: invitation.email,
    });

    if (invitation.acceptedAt) {
      console.log(" Invitation already used:", invitation.acceptedAt);
      return NextResponse.json(
        { error: "Cette invitation a déjà été utilisée" },
        { status: 409 },
      );
    }

    if (new Date() > invitation.expiresAt) {
      console.log(" Invitation expired:", invitation.expiresAt);
      return NextResponse.json(
        { error: "Cette invitation a expiré" },
        { status: 410 },
      );
    }

    const clerk = await clerkClient();
    console.log(" Clerk client initialized");

    // Vérifier si l'utilisateur existe déjà dans Clerk
    let existingClerkUsers;
    try {
      existingClerkUsers = await clerk.users.getUserList({
        emailAddress: [invitation.email],
      });
      console.log(" Clerk users found:", existingClerkUsers.data.length);
    } catch (clerkError) {
      console.error(" Error fetching users from Clerk:", clerkError);
      return NextResponse.json(
        {
          error: "Erreur de communication avec le service d'authentification",
        },
        { status: 500 },
      );
    }

    const isExistingAccount = existingClerkUsers.data.length > 0;
    console.log(" Existing account in Clerk:", isExistingAccount);

    let clerkUserId: string;
    let isNewUser = false;

    if (isExistingAccount) {
      // CAS COMPTE EXISTANT
      clerkUserId = existingClerkUsers.data[0].id;
      console.log(" Updating existing user:", clerkUserId);

      try {
        // Mettre à jour les métadonnées
        await clerk.users.updateUser(clerkUserId, {
          publicMetadata: { role: "ADMIN" },
        });
        console.log(" Clerk user metadata updated");
      } catch (clerkError) {
        console.error(" Error updating Clerk user:", clerkError);
        return NextResponse.json(
          {
            error: "Erreur lors de la mise à jour du compte",
          },
          { status: 500 },
        );
      }

      // Vérifier si l'utilisateur existe dans la DB
      const existingDbUser = await prisma.user.findUnique({
        where: { email: invitation.email },
      });

      if (existingDbUser) {
        console.log(" Updating existing DB user");
        await prisma.user.update({
          where: { email: invitation.email },
          data: {
            role: "ADMIN",
            status: AccountStatus.ACTIVE,
            isIdentityVerified: true,
            verifiedAt: new Date(),
          },
        });
      } else {
        console.log(" Creating new DB user from Clerk data");
        const clerkUser = existingClerkUsers.data[0];
        await prisma.user.create({
          data: {
            clerkId: clerkUserId,
            email: invitation.email,
            username: clerkUser.username || username || null,
            firstName: clerkUser.firstName || firstName || "",
            lastName: clerkUser.lastName || lastName || "",
            role: "ADMIN",
            status: AccountStatus.ACTIVE,
            isEmailVerified: true,
            isIdentityVerified: true,
            verifiedAt: new Date(),
          },
        });
      }
    } else {
      // CAS NOUVEAU COMPTE
      isNewUser = true;
      console.log(" Creating new user in Clerk");

      if (!firstName || !lastName || !username || !password) {
        console.log(" Missing required fields");
        return NextResponse.json(
          {
            error: "Prénom, nom, nom d'utilisateur et mot de passe requis",
          },
          { status: 400 },
        );
      }

      if (password.length < 8) {
        console.log(" Password too short");
        return NextResponse.json(
          {
            error: "Le mot de passe doit faire au moins 8 caractères",
          },
          { status: 400 },
        );
      }

      // Vérifier les exigences de mot de passe Clerk
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        console.log(" Password does not meet Clerk requirements");
        return NextResponse.json(
          {
            error:
              "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre",
          },
          { status: 400 },
        );
      }

      // Vérifier le format du username
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        console.log(" Invalid username format");
        return NextResponse.json(
          {
            error:
              "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores",
          },
          { status: 400 },
        );
      }

      try {
        // Créer l'utilisateur dans Clerk
        console.log(
          " Sending request to Clerk to create user with username...",
        );

        const clerkUser = await clerk.users.createUser({
          emailAddress: [invitation.email],
          username,
          password,
          firstName,
          lastName,
          publicMetadata: { role: "ADMIN" },
        });

        clerkUserId = clerkUser.id;
        console.log(" Clerk user created successfully:", clerkUserId);

        // Créer l'utilisateur dans la DB
        await prisma.user.create({
          data: {
            clerkId: clerkUserId,
            email: invitation.email,
            username,
            firstName,
            lastName,
            role: "ADMIN",
            status: AccountStatus.ACTIVE,
            isEmailVerified: true,
            isIdentityVerified: true,
            verifiedAt: new Date(),
          },
        });
        console.log(
          " DB user created successfully with automatic verification",
        );
      } catch (clerkError: any) {
        console.error(" Erreur création Clerk:", clerkError);

        // Gestion détaillée des erreurs Clerk
        if (clerkError.errors && clerkError.errors.length > 0) {
          for (const err of clerkError.errors) {
            console.error(` Clerk error: ${err.code} - ${err.message}`);

            if (
              err.code === "form_identifier_exists" &&
              err.meta?.paramName === "username"
            ) {
              return NextResponse.json(
                {
                  error: "Ce nom d'utilisateur est déjà pris",
                },
                { status: 409 },
              );
            }

            if (
              err.code === "form_identifier_exists" &&
              err.meta?.paramName === "email_address"
            ) {
              return NextResponse.json(
                {
                  error: "Un compte existe déjà avec cet email",
                },
                { status: 409 },
              );
            }

            if (err.code === "form_password_pwned") {
              return NextResponse.json(
                {
                  error:
                    "Ce mot de passe est trop commun, choisissez-en un autre",
                },
                { status: 400 },
              );
            }

            if (err.code === "form_password_length_too_short") {
              return NextResponse.json(
                {
                  error:
                    "Le mot de passe est trop court (minimum 8 caractères)",
                },
                { status: 400 },
              );
            }
          }
        }

        return NextResponse.json(
          {
            error: "Erreur lors de la création du compte",
          },
          { status: 500 },
        );
      }
    }

    // Marquer l'invitation comme acceptée
    await prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
    console.log(" Invitation marked as accepted");

    //  CRÉER LE TOKEN D'AUTO-LOGIN COMME POUR CO-HOST
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: clerkUserId,
      expiresInSeconds: 60 * 5, 
    });

    console.log(" Token d'auto-login créé:", signInToken.token);

    // Retourner la réponse avec le token
    return NextResponse.json({
      success: true,
      email: invitation.email,
      isNewUser,
      signInToken: signInToken.token,
      redirectTo: "/admin/dashboard",
    });
  } catch (error: any) {
    console.error("[POST /api/admin/invitations/accept] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la création du compte",
      },
      { status: 500 },
    );
  }
}
