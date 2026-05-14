// app/api/info-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { checkIn, checkOut, guests } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Récupérer l'infoRequest avec la conversation et l'offre
    const infoRequest = await prisma.infoRequest.findUnique({
      where: { id },
      include: {
        listing: true,
        tenant: true,
        conversation: {
          select: { id: true }
        },
        offer: true,  // ← AJOUTER L'OFFRE
      },
    });

    if (!infoRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 },
      );
    }

    // Vérifier que l'utilisateur est le locataire
    if (infoRequest.tenantId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // ✅ NOUVELLE CONDITION: Vérifier si une réservation existe déjà
    let existingBooking = null;
    if (infoRequest.offerId) {
      existingBooking = await prisma.booking.findFirst({
        where: {
          offerId: infoRequest.offerId,
          status: { notIn: ["CANCELLED", "REJECTED"] }
        }
      });
    }

    // ✅ Si une réservation existe, on ne peut plus modifier
    if (existingBooking) {
      return NextResponse.json(
        { error: "Une réservation a déjà été effectuée, les dates ne peuvent plus être modifiées" },
        { status: 400 },
      );
    }

    // ✅ Sinon, on autorise la modification (même si l'offre est acceptée)
    // Seules les demandes rejetées ou expirées ne peuvent pas être modifiées
    if (infoRequest.status === "REJECTED" || infoRequest.status === "EXPIRED") {
      return NextResponse.json(
        { error: "Cette demande ne peut plus être modifiée" },
        { status: 400 },
      );
    }

    // Normalisation des dates
    const normalizeDate = (dateStr: string): Date => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(`${dateStr}T00:00:00.000Z`);
      }
      return new Date(dateStr);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkInDate = infoRequest.checkIn;
    let checkOutDate = infoRequest.checkOut;
    let guestsCount = infoRequest.guests;

    if (checkIn !== undefined) {
      checkInDate = normalizeDate(checkIn);
      if (isNaN(checkInDate.getTime())) {
        return NextResponse.json(
          { error: `Date d'arrivée invalide: ${checkIn}` },
          { status: 400 },
        );
      }
      if (checkInDate < today) {
        return NextResponse.json(
          { error: "La date d'arrivée ne peut pas être dans le passé" },
          { status: 400 },
        );
      }
    }

    if (checkOut !== undefined) {
      checkOutDate = normalizeDate(checkOut);
      if (isNaN(checkOutDate.getTime())) {
        return NextResponse.json(
          { error: `Date de départ invalide: ${checkOut}` },
          { status: 400 },
        );
      }
      if (checkOutDate <= checkInDate) {
        return NextResponse.json(
          { error: "La date de départ doit être après la date d'arrivée" },
          { status: 400 },
        );
      }
    }

    if (guests !== undefined) {
      guestsCount = guests;
      if (guestsCount < 1) {
        return NextResponse.json(
          { error: "Le nombre de voyageurs doit être au moins 1" },
          { status: 400 },
        );
      }
      if (
        infoRequest.listing.maxGuests &&
        guestsCount > infoRequest.listing.maxGuests
      ) {
        return NextResponse.json(
          { error: `Maximum ${infoRequest.listing.maxGuests} voyageurs` },
          { status: 400 },
        );
      }
    }

    // Mettre à jour l'infoRequest
    const updatedInfoRequest = await prisma.infoRequest.update({
      where: { id },
      data: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: guestsCount,
      },
      include: {
        listing: true,
        tenant: true,
        owner: true,
        conversation: {
          select: { id: true }
        }
      },
    });

    return NextResponse.json({
      success: true,
      infoRequest: {
        ...updatedInfoRequest,
        conversationId: updatedInfoRequest.conversation?.id,
      },
    });
  } catch (error) {
    console.error("Erreur modification demande:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}