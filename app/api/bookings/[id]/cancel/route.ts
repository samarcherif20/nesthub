// app/api/bookings/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer la réservation
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: { select: { title: true, ownerId: true } },
        tenant: { select: { id: true, firstName: true, email: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le locataire ou le propriétaire
    if (booking.tenantId !== user.id && booking.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Vérifier que la réservation peut être annulée (pas déjà annulée ou terminée)
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Cette réservation ne peut pas être annulée' }, { status: 400 });
    }

    // Mettre à jour le statut
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Annulé par l\'utilisateur',
      },
    });

    // Créer une notification pour l'autre partie
    const isTenant = booking.tenantId === user.id;
    const otherUserId = isTenant ? booking.ownerId : booking.tenantId;

    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'BOOKING_CANCELLED',
        title: 'Réservation annulée',
        content: `La réservation pour ${booking.listing.title} a été annulée par ${isTenant ? 'le locataire' : 'le propriétaire'}.`,
        data: { bookingId: booking.id },
      },
    });

    return NextResponse.json({ 
      success: true, 
      booking: updatedBooking,
      message: 'Réservation annulée avec succès' 
    });
  } catch (error) {
    console.error('Erreur annulation réservation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}