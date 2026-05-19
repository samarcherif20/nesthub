import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Générer une référence unique pour l'offre
function generateOfferReference(): string {
  const prefix = "OFF";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Créer une offre (locataire clique "Demander à réserver")
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, infoRequestId } = body;

    if (!conversationId || !infoRequestId) {
      return NextResponse.json(
        { error: "Conversation et demande d'info requises" },
        { status: 400 },
      );
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Récupérer la conversation et la demande d'info
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        listing: true,
        infoRequest: true,
      },
    });

    if (!conversation || !conversation.infoRequest) {
      return NextResponse.json(
        { error: "Conversation ou demande d'info non trouvée" },
        { status: 404 },
      );
    }

    const infoRequest = conversation.infoRequest;

    // Vérifier que l'utilisateur est le locataire
    if (conversation.tenantId !== user.id) {
      return NextResponse.json(
        { error: "Seul le locataire peut créer une offre" },
        { status: 403 },
      );
    }

    // Vérifier s'il y a une offre active (PENDING ou ACCEPTED)
    const existingActiveOffer = await prisma.offer.findFirst({
      where: {
        infoRequestId: infoRequest.id,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });

    if (existingActiveOffer) {
      return NextResponse.json(
        { error: "Une offre est déjà en cours pour cette demande" },
        { status: 400 },
      );
    }

    // Supprimer les anciennes offres refusées/expirées pour en créer une nouvelle Cela permet au locataire de refaire une offre après un refus
    const deletedOffers = await prisma.offer.deleteMany({
      where: {
        infoRequestId: infoRequest.id,
        status: { in: ["REJECTED", "EXPIRED", "CANCELLED"] },
      },
    });

    if (deletedOffers.count > 0) {
      console.log(
        ` ${deletedOffers.count} ancienne(s) offre(s) supprimée(s) pour infoRequest ${infoRequest.id}`,
      );
    }

    // Calculer les prix
    const nights = Math.ceil(
      (infoRequest.checkOut.getTime() - infoRequest.checkIn.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const pricePerNight = conversation.listing.pricePerNight || 0;

    // Valeurs par défaut si cleaningFee est null/undefined
    const cleaningFee = conversation.listing.cleaningFee ?? 85;
    const basePrice = pricePerNight * nights;
    const serviceFee = Math.round(basePrice * 0.05);
    const totalPrice = basePrice + cleaningFee + serviceFee;

    console.log(" Détail prix offre:", {
      nights,
      pricePerNight,
      basePrice,
      cleaningFee,
      serviceFee,
      totalPrice,
    });

    // Date d'expiration: +24h
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Créer l'offre
    const offer = await prisma.offer.create({
      data: {
        reference: generateOfferReference(),
        infoRequestId: infoRequest.id,
        listingId: conversation.listingId,
        tenantId: conversation.tenantId,
        ownerId: conversation.ownerId,
        checkIn: infoRequest.checkIn,
        checkOut: infoRequest.checkOut,
        guests: infoRequest.guests,
        nights: nights,
        pricePerNight: pricePerNight,
        cleaningFee: cleaningFee,
        serviceFee: serviceFee,
        totalPrice: totalPrice,
        status: "PENDING",
        expiresAt: expiresAt,
      },
    });

    // Créer un message système dans le chat
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: conversation.tenantId,
        receiverId: conversation.ownerId,
        content: ` "Offre de réservation créée"\n\n Pour les Dates de : ${infoRequest.checkIn.toLocaleDateString("fr-FR")} → ${infoRequest.checkOut.toLocaleDateString("fr-FR")} (${nights} nuits)\n et nombres de voyageur(s) : ${infoRequest.guests} \n , Détail du prix:\n• ${pricePerNight} TND × ${nights} nuit(s) = ${basePrice} TND\n• Frais de ménage: ${cleaningFee} TND\n• Frais de service (5%): ${serviceFee} TND\n• "TOTAL: ${totalPrice.toLocaleString("fr-FR")} TND"\n\n Le propriétaire a 24h pour répondre.`,
        isRead: false,
        isSystem: true,
      },
    });

    // Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: `Offre de réservation créée - ${totalPrice} TND`,
        lastMessageAt: new Date(),
      },
    });

    // Notification au propriétaire
    await prisma.notification.create({
      data: {
        userId: conversation.ownerId,
        type: "OFFER_CREATED",
        title: "Nouvelle offre de réservation",
        content: `${user.username || "Un locataire"} a fait une offre pour "${conversation.listing.title}" - ${totalPrice.toLocaleString("fr-FR")} TND`,
        data: {
          offerId: offer.id,
          listingId: conversation.listingId,
          conversationId: conversation.id,
        },
        channels: ["IN_APP"],
      },
    });

    return NextResponse.json({
      success: true,
      offer,
      expiresIn: "24h",
    });
  } catch (error) {
    console.error("Erreur création offre:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

//  Récupérer les offres d'une conversation
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId requis" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const offers = await prisma.offer.findMany({
      where: {
        OR: [{ listing: { conversations: { some: { id: conversationId } } } }],
      },
      include: {
        parentOffer: true,
        childOffers: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error("Erreur GET offres:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
