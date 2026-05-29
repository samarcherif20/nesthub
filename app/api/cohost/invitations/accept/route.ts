// app/api/cohost/invitations/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

//  AJOUT DE LA FONCTION GET
export async function GET(req: NextRequest) {

  try {
    const token = req.nextUrl.searchParams.get("token");
    const type = req.nextUrl.searchParams.get("type") || "admin";
    const normalizedType = (type || "").toLowerCase();

    console.log(" Paramètres GET:", {
      token: token?.slice(0, 8) + "...",
      type,
      normalizedType,
    });

    if (!token) {
      return NextResponse.json({ valid: false, reason: "no_token" });
    }

    if (normalizedType === "cohost") {
      const invitation = await prisma.coOwnerInvitation.findFirst({
        where: { token },
        include: {
          listing: { select: { title: true, id: true } },
          inviter: { select: { firstName: true, lastName: true, email: true } },
        },
      });

      if (!invitation) {
        console.log(" Invitation non trouvée");
        return NextResponse.json({ valid: false, reason: "not_found" });
      }

      console.log(" Invitation trouvée:", {
        id: invitation.id,
        email: invitation.inviteeEmail,
        status: invitation.status,
      });

      if (invitation.status !== "PENDING") {
        return NextResponse.json({ valid: false, reason: "already_used" });
      }

      if (new Date() > invitation.expiresAt) {
        return NextResponse.json({ valid: false, reason: "expired" });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: invitation.inviteeEmail },
      });

      return NextResponse.json({
        valid: true,
        type: "CO_HOST",
        email: invitation.inviteeEmail,
        expiresAt: invitation.expiresAt,
        hasExistingAccount: !!existingUser,
        invitedBy: invitation.inviter
          ? {
              name: `${invitation.inviter.firstName || ""} ${invitation.inviter.lastName || ""}`.trim(),
              email: invitation.inviter.email,
            }
          : null,
        listing: { id: invitation.listing.id, title: invitation.listing.title },
        role: invitation.role,
        permissions: invitation.permissions,
      });
    }

    return NextResponse.json({ valid: false, reason: "invalid_type" });
  } catch (error) {
    console.error("[GET /api/cohost/invitations/accept] Error:", error);
    return NextResponse.json({ valid: false, reason: "error" });
  }
}

// POST - Acceptation de l'invitation
export async function POST(req: NextRequest) {
  console.log("[POST] /api/cohost/invitations/accept - Début");

  try {
    const body = await req.json();
    const { token, firstName, lastName, username, password, type } = body;

    console.log(" Paramètres POST:", {
      token: token?.slice(0, 8) + "...",
      firstName,
      lastName,
      username,
      hasPassword: !!password,
      type,
    });

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const normalizedType = (type || "").toLowerCase();

    if (normalizedType === "cohost") {
      const invitation = await prisma.coOwnerInvitation.findFirst({
        where: { token },
        include: { listing: true },
      });

      if (!invitation) {
        console.log(" Invitation non trouvée");
        return NextResponse.json(
          { error: "Invitation invalide" },
          { status: 404 },
        );
      }

      console.log(" Invitation trouvée:", {
        id: invitation.id,
        email: invitation.inviteeEmail,
        status: invitation.status,
        role: invitation.role,
      });

      if (invitation.status !== "PENDING") {
        console.log(" Invitation déjà utilisée, status:", invitation.status);
        return NextResponse.json(
          { error: "Cette invitation a déjà été utilisée" },
          { status: 409 },
        );
      }

      if (new Date() > invitation.expiresAt) {
        console.log(" Invitation expirée, expiresAt:", invitation.expiresAt);
        return NextResponse.json(
          { error: "Cette invitation a expiré" },
          { status: 410 },
        );
      }

      const clerk = await clerkClient();
      let clerkUserId: string;
      let isNewUser = false;

      const existingUsers = await clerk.users.getUserList({
        emailAddress: [invitation.inviteeEmail],
      });

      if (existingUsers.data.length > 0) {
        clerkUserId = existingUsers.data[0].id;
        console.log("👤 Utilisateur existant dans Clerk:", clerkUserId);
        await clerk.users.updateUser(clerkUserId, {
          publicMetadata: { role: "PROPERTY_OWNER" },
        });
        console.log(" Métadonnées Clerk mises à jour");
      } else {
        isNewUser = true;
        console.log(" Création nouvel utilisateur Clerk");

        if (!firstName || !lastName || !username || !password) {
          return NextResponse.json(
            { error: "Prénom, nom, nom d'utilisateur et mot de passe requis" },
            { status: 400 },
          );
        }

        const newUser = await clerk.users.createUser({
          emailAddress: [invitation.inviteeEmail],
          username,
          password,
          firstName,
          lastName,
          publicMetadata: { role: "PROPERTY_OWNER" },
        });
        clerkUserId = newUser.id;
        console.log(" Utilisateur Clerk créé:", clerkUserId);
      }

      const dbUser = await prisma.user.upsert({
        where: { email: invitation.inviteeEmail },
        update: {
          clerkId: clerkUserId,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          username: username || undefined,
          role: "CO_HOST",
        },
        create: {
          clerkId: clerkUserId,
          email: invitation.inviteeEmail,
          username: username || invitation.inviteeEmail.split("@")[0],
          firstName: firstName || "",
          lastName: lastName || "",
          role: "CO_HOST",
          status: "ACTIVE",
          isEmailVerified: true,
        },
      });

      console.log(" Utilisateur DB mis à jour:", dbUser.id);

      await prisma.teamMember.create({
        data: {
          listingId: invitation.listingId,
          userId: dbUser.id,
          role: invitation.role,
          permissions: invitation.permissions,
          canEdit: (invitation.permissions as any)?.canEdit || false,
          canManageBookings:
            (invitation.permissions as any)?.canManageBookings || true,
          canViewRevenue:
            (invitation.permissions as any)?.canViewRevenue || false,
          canManageTeam:
            (invitation.permissions as any)?.canManageTeam || false,
          invitedBy: invitation.inviterId,
          joinedAt: new Date(),
          isActive: true,
        },
      });

      console.log(" Membre d'équipe ajouté");

      await prisma.coOwnerInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });

      console.log(" Invitation marquée comme acceptée");

      // Créer un token de signature pour auto-connexion
      const signInToken = await clerk.signInTokens.createSignInToken({
        userId: clerkUserId,
        expiresInSeconds: 60 * 5, 
      });

      console.log(" Token d'auto-login créé:", signInToken.token);

      // Retourner le token pour redirection
      return NextResponse.json({
        success: true,
        email: invitation.inviteeEmail,
        isNewUser,
        signInToken: signInToken.token,
        redirectTo: "/dashboard/owner",
      });
    }

    return NextResponse.json(
      { error: "Type d'invitation non supporté" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("[POST /api/cohost/invitations/accept] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
