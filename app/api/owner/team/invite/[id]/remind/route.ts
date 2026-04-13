// app/api/owner/team/invite/[id]/remind/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { invitationEmailService } from "@/lib/services/invitation-email.service";

// POST - Renvoyer une invitation (reminder)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = getAuth(req);
    const { id: invitationId } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les droits du propriétaire
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

    // Récupérer l'invitation
    const invitation = await prisma.coOwnerInvitation.findFirst({
      where: {
        id: invitationId,
        listing: { ownerId: owner.id },
      },
      include: {
        listing: {
          select: { id: true, title: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation non trouvée" },
        { status: 404 },
      );
    }

    // Vérifier si l'invitation est encore valide
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette invitation n'est plus en attente" },
        { status: 400 },
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Cette invitation a expiré" },
        { status: 400 },
      );
    }

    // Re-générer un token (optionnel) ou garder le même
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/fr/accept-invite?token=${invitation.token}&type=cohost`;

    const ownerName =
      `${owner.firstName || ""} ${owner.lastName || ""}`.trim() ||
      "Le propriétaire";

    // Envoyer l'email de rappel
    await invitationEmailService.sendCohostInvitation({
      toEmail: invitation.inviteeEmail,
      invitedByName: ownerName,
      invitedByEmail: owner.email,
      inviteLink,
      expiresAt: invitation.expiresAt,
      listingTitle: invitation.listing.title,
      role: invitation.role === "MANAGER" ? "Gestionnaire" : "Co-hôte",
      message: invitation.message || undefined,
    });

    // Optionnel: mettre à jour la date d'envoi du rappel
    await prisma.coOwnerInvitation.update({
      where: { id: invitationId },
      data: {
        // updatedAt sera automatiquement mis à jour
        // Tu peux ajouter un champ reminderSentAt si besoin
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation renvoyée avec succès",
    });
  } catch (error: any) {
    console.error("[POST /api/owner/team/invite/:id/remind] Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}