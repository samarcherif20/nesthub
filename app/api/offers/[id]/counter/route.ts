import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function generateOfferReference(): string {
  const prefix = "CTR";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const parentOfferId = params.id;
    const body = await req.json();
    const { pricePerNight, checkIn, checkOut, message } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const parentOffer = await prisma.offer.findUnique({
      where: { id: parentOfferId },
      include: {
        listing: true,
        infoRequest: {
          include: {
            conversation: true,
          },
        },
      },
    });

    if (!parentOffer) {
      return NextResponse.json({ error: "Offre originale non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le propriétaire ou le locataire
    if (parentOffer.ownerId !== user.id && parentOffer.tenantId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier le nombre de contre-offres (max 3)
    if (parentOffer.counterCount >= 3) {
      return NextResponse.json(
        { error: "Nombre maximum de contre-offres atteint (3)" },
        { status: 400 }
      );
    }

    // Calculer les nouvelles valeurs
    const checkInDate = checkIn ? new Date(checkIn) : parentOffer.checkIn;
    const checkOutDate = checkOut ? new Date(checkOut) : parentOffer.checkOut;
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const newPricePerNight = pricePerNight || parentOffer.pricePerNight;
    const basePrice = newPricePerNight * nights;
    const cleaningFee = parentOffer.cleaningFee;
    const serviceFee = Math.round(basePrice * 0.05);
    const totalPrice = basePrice + cleaningFee + serviceFee;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Créer la contre-offre
    const counterOffer = await prisma.offer.create({
      data: {
        reference: generateOfferReference(),
        infoRequestId: parentOffer.infoRequestId,
        listingId: parentOffer.listingId,
        tenantId: parentOffer.tenantId,
        ownerId: parentOffer.ownerId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: parentOffer.guests,
        nights: nights,
        pricePerNight: newPricePerNight,
        cleaningFee: cleaningFee,
        serviceFee: serviceFee,
        totalPrice: totalPrice,
        status: "PENDING",
        parentOfferId: parentOffer.id,
        expiresAt: expiresAt,
      },
    });

    // Mettre à jour le compteur de l'offre parente
    await prisma.offer.update({
      where: { id: parentOffer.id },
      data: {
        status: "COUNTERED",
        counterCount: { increment: 1 },
      },
    });

    // Créer un message système dans le chat
    const conversation = parentOffer.infoRequest?.conversation;
    const senderName = user.id === parentOffer.ownerId ? "Le propriétaire" : "Le locataire";
    
    if (conversation) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          receiverId: user.id === parentOffer.ownerId ? parentOffer.tenantId : parentOffer.ownerId,
          content: `🔄 **Contre-offre reçue**\n\n${senderName} propose:\n📅 ${checkInDate.toLocaleDateString("fr-FR")} → ${checkOutDate.toLocaleDateString("fr-FR")} (${nights} nuits)\n💰 ${newPricePerNight} TND/nuit\n💵 Total: ${totalPrice.toLocaleString("fr-FR")} TND\n\n${message ? `💬 Message: ${message}` : ""}\n\n⏰ Valable 24h.`,
          isRead: false,
          isSystem: true,
        },
      });
    }

    // Notification
    const notifyUserId = user.id === parentOffer.ownerId ? parentOffer.tenantId : parentOffer.ownerId;
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: "OFFER_COUNTERED",
        title: "Nouvelle contre-offre",
        content: `${senderName} a fait une contre-offre pour "${parentOffer.listing.title}"`,
        data: {
          offerId: counterOffer.id,
          listingId: parentOffer.listingId,
        },
        channels: ["IN_APP", "EMAIL"],
      },
    });

    return NextResponse.json({
      success: true,
      offer: counterOffer,
      remainingCounters: 3 - (parentOffer.counterCount + 1),
    });
  } catch (error) {
    console.error("Erreur contre-offre:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}