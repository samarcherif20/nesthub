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
    // ⚠️ CRUCIAL: await params avant de l'utiliser
    const { id } = await params;

    console.log("ID reçu:", id); // Debug

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { checkIn, checkOut, guests } = body;

    console.log("Données reçues:", { checkIn, checkOut, guests }); // Debug

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

    // Récupérer l'infoRequest
    const infoRequest = await prisma.infoRequest.findUnique({
      where: { id },
      include: {
        listing: true,
        tenant: true,
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

    // Vérifier que la demande est encore en attente
    if (infoRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette demande ne peut plus être modifiée" },
        { status: 400 },
      );
    }

    // Validation des dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkInDate = infoRequest.checkIn;
    let checkOutDate = infoRequest.checkOut;
    let guestsCount = infoRequest.guests;

    if (checkIn) {
      checkInDate = new Date(checkIn);
      if (checkInDate < today) {
        return NextResponse.json(
          { error: "La date d'arrivée ne peut pas être dans le passé" },
          { status: 400 },
        );
      }
    }

    if (checkOut) {
      checkOutDate = new Date(checkOut);
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
      },
    });

    console.log("InfoRequest mis à jour:", updatedInfoRequest.id); // Debug

    return NextResponse.json({
      success: true,
      infoRequest: updatedInfoRequest,
    });
  } catch (error) {
    console.error("Erreur modification demande:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
