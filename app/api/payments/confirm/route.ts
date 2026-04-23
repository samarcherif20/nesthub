// app/api/payments/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const paymentIntentId = searchParams.get('payment_intent');
    const bookingId = searchParams.get('booking_id');

    // Récupérer la transaction
    const transaction = await prisma.paymentTransaction.findFirst({
      where: bookingId 
        ? { id: bookingId }
        : { stripePaymentIntentId: paymentIntentId },
      include: {
        offer: {
          include: {
            listing: {
              include: { photos: { take: 1, where: { isMain: true } } },
            },
            tenant: true,
            owner: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 });
    }

    // Récupérer la réservation associée
    const booking = await prisma.booking.findFirst({
      where: { offerId: transaction.offerId },
    });

    return NextResponse.json({
      success: transaction.status === 'SUCCESS',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        paidAt: transaction.paidAt,
      },
      booking: booking ? {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      } : null,
      offer: {
        id: transaction.offer.id,
        checkIn: transaction.offer.checkIn,
        checkOut: transaction.offer.checkOut,
        nights: transaction.offer.nights,
        guests: transaction.offer.guests,
        totalPrice: transaction.offer.totalPrice,
        listing: {
          id: transaction.offer.listing.id,
          title: transaction.offer.listing.title,
          location: transaction.offer.listing.location,
          image: transaction.offer.listing.photos[0]?.url,
        },
      },
    });
  } catch (error) {
    console.error('Erreur confirmation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}