import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = getAuth(req);
    const { id } = await params;
    const {
      vacationMode,
      vacationStartDate,
      vacationEndDate,
      vacationMessage,
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est le propriétaire
    const listing = await prisma.listing.findFirst({
      where: { id, ownerId: userId },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 },
      );
    }

    // Si on active le mode vacances, vérifier les conflits
    if (vacationMode && vacationStartDate && vacationEndDate) {
      const start = new Date(vacationStartDate);
      const end = new Date(vacationEndDate);

      const overlappingBookings = await prisma.booking.findMany({
        where: {
          listingId: id,
          status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
          OR: [
            { checkIn: { lte: end, gte: start } },
            { checkOut: { lte: end, gte: start } },
          ],
        },
      });

      if (overlappingBookings.length > 0) {
        return NextResponse.json(
          { error: "Vous avez des réservations pendant cette période" },
          { status: 400 },
        );
      }
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        vacationMode,
        vacationStartDate: vacationStartDate
          ? new Date(vacationStartDate)
          : null,
        vacationEndDate: vacationEndDate ? new Date(vacationEndDate) : null,
        vacationMessage,
      },
    });

    return NextResponse.json({ success: true, listing: updatedListing });
  } catch (error) {
    console.error("[PATCH /api/listings/[id]/vacation] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
