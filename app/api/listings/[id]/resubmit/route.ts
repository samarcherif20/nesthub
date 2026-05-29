import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;

    console.log(` [RESUBMIT] Début - listingId: ${id}, userId: ${clerkId}`);

    if (!clerkId) {
      console.log(" [RESUBMIT] Non authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!user) {
      console.log(" [RESUBMIT] Utilisateur non trouvé");
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const listing = await prisma.listing.findFirst({
      where: { id, ownerId: user.id },
    });

    if (!listing) {
      console.log(` [RESUBMIT] Annonce non trouvée - id: ${id}`);
      return NextResponse.json({ error: "Annonce non trouvée" }, { status: 404 });
    }

    console.log(` [RESUBMIT] Annonce trouvée: ${listing.title}, statut actuel: ${listing.status}`);

    //  METTRE À JOUR : status + hasPendingRevision = true
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        status: "PENDING_REVIEW",
        hasPendingRevision: true,  
        rejectionReason: null,
        rejectionDetails: null,
        rejectedAt: null,
        rejectedBy: null,
      },
    });

    console.log(` [RESUBMIT] Statut mis à jour: ${updatedListing.status}, hasPendingRevision: ${updatedListing.hasPendingRevision}`);

    // Notifier les admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    console.log(` [RESUBMIT] Envoi de notification à ${admins.length} admin(s)`);

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "LISTING_PENDING_REVIEW",
          title: "Annonce resoumise à validation",
          content: `${listing.title} a été modifiée et soumise à nouveau pour validation.`,
          channels: ["IN_APP", "EMAIL"],
          data: {
            listingId: listing.id,
            listingTitle: listing.title,
            isResubmit: true,
          },
        })),
      });
      console.log(` [RESUBMIT] Notifications envoyées`);
    }

    return NextResponse.json(updatedListing);
  } catch (error) {
    console.error("[RESUBMIT] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}