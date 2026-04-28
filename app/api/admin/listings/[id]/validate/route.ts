// app/api/admin/listings/[id]/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Valider ou rejeter une annonce
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const admin = await prisma.user.findUnique({
      where: { clerkId },
      select: { role: true, id: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, rejectionReason } = body; // action: "approve" ou "reject"

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true, title: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Annonce non trouvée" }, { status: 404 });
    }

    if (listing.status !== "PENDING_REVIEW") {
      return NextResponse.json({ error: "Cette annonce n'est pas en attente de validation" }, { status: 400 });
    }

    let newStatus: string;
    let notificationTitle: string;
    let notificationMessage: string;
    let notificationType: string;

    if (action === "approve") {
      newStatus = "ACTIVE";
      notificationTitle = "✅ Annonce approuvée";
      notificationMessage = `Félicitations ! Votre annonce "${listing.title}" a été approuvée et est maintenant en ligne.`;
      notificationType = "LISTING_ACTIVATED";
    } else {
      newStatus = "REJECTED";
      notificationTitle = "❌ Annonce rejetée";
      notificationMessage = `Votre annonce "${listing.title}" a été rejetée. ${rejectionReason ? `Raison : ${rejectionReason}` : "Veuillez corriger les informations et soumettre à nouveau."}`;
      notificationType = "LISTING_SUSPENDED";
    }

    // Mettre à jour le statut de l'annonce
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        status: newStatus,
        publishedAt: action === "approve" ? new Date() : null,
      },
    });

    // Créer une notification pour le propriétaire
    await prisma.notification.create({
      data: {
        userId: listing.ownerId,
        type: notificationType as any,
        title: notificationTitle,
        content: notificationMessage,
        channels: ["IN_APP", "EMAIL"],
        data: { listingId: id, listingTitle: listing.title },
      },
    });

    // Enregistrer l'action dans l'historique admin
    await prisma.userAction.create({
      data: {
        userId: listing.ownerId,
        actionType: action === "approve" ? "APPROVE_LISTING" : "REJECT_LISTING",
        performedBy: admin.id,
        reason: rejectionReason || null,
        content: JSON.stringify({ listingId: id, listingTitle: listing.title }),
      },
    });

    // Ajouter une entrée dans listingHistory
    await prisma.listingHistory.create({
      data: {
        listingId: id,
        actionType: action === "approve" ? "APPROVED" : "REJECTED",
        oldValue: "PENDING_REVIEW",
        newValue: newStatus,
        changedBy: admin.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "Annonce approuvée avec succès" : "Annonce rejetée",
      listing: updatedListing,
    });
  } catch (error) {
    console.error("[VALIDATE_LISTING] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}