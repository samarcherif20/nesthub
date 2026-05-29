// app/api/users/vacation-mode/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    const { enabled, message, startDate, endDate } = await req.json();

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    //  AJOUTE : Vérifier les conflits AVANT de mettre à jour
    if (enabled && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Récupérer l'utilisateur pour obtenir son ID interne
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
      }

      // Récupérer TOUTES les annonces du propriétaire
      const userListings = await prisma.listing.findMany({
        where: { ownerId: user.id },
        select: { id: true, title: true },
      });

      if (userListings.length > 0) {
        const listingIds = userListings.map(l => l.id);

        // Vérifier s'il y a des réservations pendant la période
        const overlappingBookings = await prisma.booking.findMany({
          where: {
            listingId: { in: listingIds },
            status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
            OR: [
              // Réservation qui commence pendant la période
              { checkIn: { gte: start, lte: end } },
              // Réservation qui se termine pendant la période
              { checkOut: { gte: start, lte: end } },
              // Réservation qui englobe toute la période
              { checkIn: { lte: start }, checkOut: { gte: end } },
            ],
          },
          include: {
            listing: { select: { title: true } },
          },
        });

        if (overlappingBookings.length > 0) {
          const listingNames = [...new Set(overlappingBookings.map(b => b.listing.title))];
          return NextResponse.json(
            { 
              error: `Impossible d'activer le mode vacances. Vous avez ${overlappingBookings.length} réservation(s) pendant cette période sur : ${listingNames.join(", ")}`,
              bookings: overlappingBookings.length,
              listings: listingNames,
            },
            { status: 400 }
          );
        }
      }
    }

    //  Si pas de conflit, on met à jour
    const user = await prisma.user.update({
      where: { clerkId },
      data: {
        vacationMode: enabled,
        vacationMessage: message || null,
        vacationStartDate: startDate ? new Date(startDate) : null,
        vacationEndDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({
      success: true,
      vacationMode: user.vacationMode,
      vacationMessage: user.vacationMessage,
      vacationStartDate: user.vacationStartDate,
      vacationEndDate: user.vacationEndDate,
    });
  } catch (error) {
    console.error("[POST /api/users/vacation-mode] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}