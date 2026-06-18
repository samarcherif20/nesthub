// app/api/bookings/[bookingId]/confirm-checkin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: { listing: true, tenant: true, owner: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le locataire
    if (booking.tenantId !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier qu'on est bien le jour du check-in ou après
    const today = new Date();
    const checkInDate = new Date(booking.checkIn);
    
    if (today < checkInDate) {
      const daysRemaining = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return NextResponse.json({ 
        error: `Vous ne pouvez confirmer votre arrivée que le jour J. Encore ${daysRemaining} jour(s) avant votre séjour.` 
      }, { status: 400 });
    }

    // Vérifier qu'il n'a pas déjà confirmé
    if (booking.checkInConfirmedAt) {
      return NextResponse.json({ error: "Vous avez déjà confirmé votre arrivée" }, { status: 400 });
    }

    // Vérifier que le paiement est bien en séquestre
    if (booking.escrowStatus !== "HELD") {
      return NextResponse.json({ error: "Le paiement n'est pas en attente de libération" }, { status: 400 });
    }

    //  Libération dans 2h
    const releaseDate = new Date(today.getTime() + 2 * 60 * 60 * 1000);

    // Mettre à jour la réservation
    await prisma.booking.update({
      where: { id: params.bookingId },
      data: {
        checkInConfirmedAt: today,
        escrowReleaseScheduledAt: releaseDate,
        checkedInAt: today,
      },
    });

    //  NOTIFICATION au propriétaire
    await prisma.notification.create({
      data: {
        userId: booking.ownerId!,
        type: "CHECKIN_REMINDER",
        title: " Le locataire est arrivé !",
        content: `${booking.tenant.firstName} ${booking.tenant.lastName} a confirmé son arrivée pour ${booking.listing.title}. Le paiement sera libéré dans 2h.`,
        data: { bookingId: booking.id, releaseDate: releaseDate.toISOString() },
      },
    });

    // NOTIFICATION au locataire
    await prisma.notification.create({
      data: {
        userId: booking.tenantId,
        type: "SYSTEM_ALERT",
        title: "Arivée confirmée",
        content: `Votre arrivée est confirmée. Le propriétaire recevra le paiement dans 2h. Bon séjour !`,
        data: { bookingId: booking.id, releaseDate: releaseDate.toISOString() },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Arrivée confirmée ! Le paiement sera libéré dans 2h.",
      releaseDate: releaseDate
    });

  } catch (error) {
    console.error("Erreur confirmation check-in:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}