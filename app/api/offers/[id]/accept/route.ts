// app/api/offers/[id]/accept/route.ts (version corrigée)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id: offerId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        listing: true,
        infoRequest: {
          include: {
            conversation: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (offer.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Seul le propriétaire peut accepter l'offre" },
        { status: 403 },
      );
    }

    // Vérifier que l'offre est encore valide
    if (offer.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette offre n'est plus disponible" },
        { status: 400 },
      );
    }

    if (new Date() > offer.expiresAt) {
      return NextResponse.json(
        { error: "Cette offre a expiré" },
        { status: 400 },
      );
    }

    //  1. Bloquer les dates dans le calendrier (pendant 24h)
    const startDate = new Date(offer.checkIn);
    const endDate = new Date(offer.checkOut);
    const datesToBlock: Date[] = [];

    // Générer toutes les dates entre checkIn et checkOut (excluant checkOut)
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      datesToBlock.push(new Date(d));
    }

    // Calculer la date d'expiration (dans 24h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    //   Bloquer chaque date dans BlockedDate
    for (const date of datesToBlock) {
      // Vérifier si un blocage existe déjà pour cette date
      const existingBlock = await prisma.blockedDate.findFirst({
        where: {
          listingId: offer.listingId,
          startDate: date,
        },
      });

      if (existingBlock) {
        // Mettre à jour l'existant
        await prisma.blockedDate.update({
          where: { id: existingBlock.id },
          data: {
            reason: `Réservation en attente de paiement - Expire le ${expiresAt.toLocaleString()}`,
          },
        });
      } else {
        // Créer un nouveau blocage
        await prisma.blockedDate.create({
          data: {
            listingId: offer.listingId,
            startDate: date,
            endDate: date,
            reason: `Réservation en attente de paiement - Expire le ${expiresAt.toLocaleString()}`,
            blockedById: user.id,
          },
        });
      }
    }

    // Bloquer dans AvailabilityCalendar
    for (const date of datesToBlock) {
      const existingCalendar = await prisma.availabilityCalendar.findFirst({
        where: {
          listingId: offer.listingId,
          date: date,
        },
      });

      if (existingCalendar) {
        await prisma.availabilityCalendar.update({
          where: { id: existingCalendar.id },
          data: {
            isAvailable: false,
            blockedReason: `En attente de paiement - Expire dans 24h`,
          },
        });
      } else {
        await prisma.availabilityCalendar.create({
          data: {
            listingId: offer.listingId,
            date: date,
            isAvailable: false,
            blockedReason: `En attente de paiement - Expire dans 24h`,
          },
        });
      }
    }

    //  2. Enregistrer le pending booking pour libération automatique
    await prisma.pendingBooking.upsert({
      where: { offerId: offer.id },
      update: {
        expiresAt: expiresAt,
        dates: datesToBlock.map((d) => d.toISOString()),
      },
      create: {
        offerId: offer.id,
        listingId: offer.listingId,
        checkIn: offer.checkIn,
        checkOut: offer.checkOut,
        dates: datesToBlock.map((d) => d.toISOString()),
        expiresAt: expiresAt,
      },
    });

    //  3. Mettre à jour l'offre
    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    //  4. Créer un message système dans le chat
    const conversation = offer.infoRequest?.conversation;
    if (conversation) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: offer.ownerId,
          receiverId: offer.tenantId,
          content: ` "Offre acceptée !"\n\nLe propriétaire a accepté votre offre.\n\nPour les Dates de : ${offer.checkIn.toLocaleDateString()} → ${offer.checkOut.toLocaleDateString()}\n Ayant le Montant: ${offer.totalPrice.toLocaleString("fr-FR")} TND\n Vous avez jusqu'au ${expiresAt.toLocaleString()} pour finaliser le paiement.\n\nPassé ce délai, les dates seront automatiquement libérées.`,
          isRead: false,
          isSystem: true,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: ` Offre acceptée - ${offer.totalPrice.toLocaleString("fr-FR")} TND à payer avant ${expiresAt.toLocaleString()}`,
          lastMessageAt: new Date(),
        },
      });
    }

    // 5. Notification au locataire
    await prisma.notification.create({
      data: {
        userId: offer.tenantId,
        type: "OFFER_ACCEPTED",
        title: " Offre acceptée !",
        content: `Le propriétaire a accepté votre offre pour "${offer.listing.title}". Vous avez jusqu'au ${expiresAt.toLocaleString()} pour payer.`,
        data: {
          offerId: offer.id,
          listingId: offer.listingId,
          expiresAt: expiresAt.toISOString(),
        },
        channels: ["IN_APP"],
      },
    });

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
      expiresAt: expiresAt,
      blockedDates: datesToBlock.length,
      message:
        "Offre acceptée, dates bloquées pour 24h. Le locataire peut maintenant payer.",
    });
  } catch (error) {
    console.error("Erreur acceptation offre:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
