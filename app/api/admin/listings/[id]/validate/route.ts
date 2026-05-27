// app/api/admin/listings/[id]/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { action, rejectionReason, rejectionDetails, isRevision } = body;

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 },
      );
    }

    let updatedListing;
    let notificationType;
    let notificationTitle;
    let notificationContent;

    // 🔥 DISTINCTION ENTRE NOUVELLE ANNONCE ET MODIFICATION
    if (isRevision) {
      // ========== CAS 1: MODIFICATION D'UNE ANNONCE EXISTANTE ==========
      if (action === "approve") {
        // Appliquer les modifications
        const pendingData = listing.pendingRevision as any;

        updatedListing = await prisma.listing.update({
          where: { id },
          data: {
            ...pendingData, // Applique les changements
            hasPendingRevision: false,
            pendingRevision: null,
            updatedAt: new Date(),
          },
        });

        notificationType = "LISTING_REVISION_APPROVED";
        notificationTitle = "Modification approuvée";
        notificationContent = `Votre demande de modification pour l'annonce "${listing.title}" a été approuvée et les changements sont maintenant en ligne.`;

        console.log(`[REVISION] Modification approuvée pour l'annonce ${id}`);
      } else {
        // Rejeter la modification - L'annonce reste ACTIVE
        updatedListing = await prisma.listing.update({
          where: { id },
          data: {
            hasPendingRevision: false,
            pendingRevision: null,
            // Ne pas modifier les données existantes !
          },
        });

        notificationType = "LISTING_REVISION_REJECTED";
        notificationTitle = " Modification refusée";
        notificationContent = `Votre demande de modification pour l'annonce "${listing.title}" a été refusée.\n\nMotif: ${rejectionReason || "Non spécifié"}${rejectionDetails ? `\nDétails: ${rejectionDetails}` : ""}\n\nVotre annonce reste active avec ses informations actuelles.`;

        console.log(` [REVISION] Modification rejetée pour l'annonce ${id}`);
      }
    } else {
      // ========== CAS 2: NOUVELLE ANNONCE ==========
      if (action === "approve") {
        updatedListing = await prisma.listing.update({
          where: { id },
          data: {
            status: "ACTIVE",
            publishedAt: new Date(),
            validatedAt: new Date(),
            validatedBy: admin.id,
            rejectionReason: null,
            rejectionDetails: null,
            rejectedAt: null,
            rejectedBy: null,
          },
        });

        notificationType = "LISTING_ACTIVATED";
        notificationTitle = "Annonce approuvée";
        notificationContent = `Félicitations ! Votre annonce "${listing.title}" a été validée et est maintenant en ligne.`;

        console.log(`[NEW] Nouvelle annonce approuvée: ${id}`);
      } else {
        updatedListing = await prisma.listing.update({
          where: { id },
          data: {
            status: "REJECTED",
            rejectionReason: rejectionReason,
            rejectionDetails: rejectionDetails,
            rejectedAt: new Date(),
            rejectedBy: admin.id,
          },
        });

        notificationType = "LISTING_REJECTED";
        notificationTitle = " Annonce refusée";
        notificationContent = `Votre annonce "${listing.title}" a été refusée.\n\nMotif: ${rejectionReason || "Non spécifié"}${rejectionDetails ? `\nDétails: ${rejectionDetails}` : ""}\n\nVeuillez modifier votre annonce et la soumettre à nouveau.`;

        console.log(` [NEW] Nouvelle annonce rejetée: ${id}`);
      }
    }

    // Créer la notification pour le propriétaire
    await prisma.notification.create({
      data: {
        userId: listing.ownerId,
        type: notificationType as any,
        title: notificationTitle,
        content: notificationContent,
        channels: ["IN_APP", "EMAIL"],
        data: {
          listingId: listing.id,
          listingTitle: listing.title,
          rejectionReason: rejectionReason,
          adminName: `${admin.firstName} ${admin.lastName}`,
        },
      },
    });

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message:
        action === "approve"
          ? isRevision
            ? "Modification approuvée"
            : "Annonce approuvée"
          : isRevision
            ? "Modification rejetée"
            : "Annonce rejetée",
      status: updatedListing.status,
    });
  } catch (error) {
    console.error("[VALIDATE] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
