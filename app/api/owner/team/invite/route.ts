// app/api/owner/team/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { invitationEmailService } from "@/lib/services/invitation-email.service";
import { randomUUID } from "crypto";

// POST - Envoyer une invitation co-hôte
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const owner = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    if (!owner || (owner.role !== "PROPERTY_OWNER" && owner.role !== "ADMIN")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { listingId, email, name, role, permissions, message } =
      await req.json();

    if (!listingId || !email) {
      return NextResponse.json(
        { error: "Annonce et email requis" },
        { status: 400 },
      );
    }

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, ownerId: owner.id },
      select: { id: true, title: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée ou non autorisée" },
        { status: 404 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (existingUser) {
      const existingMember = await prisma.teamMember.findFirst({
        where: { listingId, userId: existingUser.id, isActive: true },
      });

      if (existingMember) {
        return NextResponse.json(
          {
            error:
              "Cet utilisateur est déjà membre de l'équipe pour cette annonce",
          },
          { status: 409 },
        );
      }
    }

    const existingInvite = await prisma.coOwnerInvitation.findFirst({
      where: {
        listingId,
        inviteeEmail: normalizedEmail,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Une invitation est déjà en attente pour cet email" },
        { status: 409 },
      );
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.coOwnerInvitation.create({
      data: {
        listingId,
        inviterId: owner.id,
        inviteeEmail: normalizedEmail,
        inviteeName: name || null,
        role: role || "CO_HOST",
        permissions: permissions || {
          canEdit: false,
          canManageBookings: true,
          canViewRevenue: false,
          canManageTeam: false,
        },
        message: message || null,
        token,
        expiresAt,
        status: "PENDING",
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/fr/accept-invite?token=${token}&type=cohost`;

    const ownerName =
      `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
      "Le propriétaire";

    await invitationEmailService.sendCohostInvitation({
      toEmail: normalizedEmail,
      invitedByName: ownerName,
      invitedByEmail: owner.email,
      inviteLink,
      expiresAt,
      listingTitle: listing.title,
      role: role === "MANAGER" ? "Gestionnaire" : "Co-hôte",
      message: message || undefined,
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.inviteeEmail,
        expiresAt,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/owner/team/invite] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}

// GET - Lister les invitations et membres
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const owner = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!owner || (owner.role !== "PROPERTY_OWNER" && owner.role !== "ADMIN")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const members = await prisma.teamMember.findMany({
      where: { listing: { ownerId: owner.id }, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        listing: {
          select: { id: true, title: true, type: true, governorate: true },
        },
      },
    });

    const invitations = await prisma.coOwnerInvitation.findMany({
      where: {
        listing: { ownerId: owner.id },
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: { listing: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ members, invitations });
  } catch (error: any) {
    console.error("[GET /api/owner/team/invite] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Annuler une invitation
export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    const { searchParams } = new URL(req.url);
    const invitationId = searchParams.get("id");

    if (!clerkId)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (!invitationId)
      return NextResponse.json(
        { error: "ID d'invitation requis" },
        { status: 400 },
      );

    const owner = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!owner || (owner.role !== "PROPERTY_OWNER" && owner.role !== "ADMIN")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const invitation = await prisma.coOwnerInvitation.findFirst({
      where: { id: invitationId, listing: { ownerId: owner.id } },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation non trouvée" },
        { status: 404 },
      );
    }

    await prisma.coOwnerInvitation.update({
      where: { id: invitationId },
      data: { status: "EXPIRED" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/owner/team/invite] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
