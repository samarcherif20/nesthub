// app/api/owner/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    // 1. RECHERCHE D'ANNONCES
    const listings = await prisma.listing.findMany({
      where: {
        ownerId: user.id,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { governorate: { contains: query, mode: "insensitive" } },
          { delegation: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        title: true,
        governorate: true,
        delegation: true,
        status: true,
        pricePerNight: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. RECHERCHE DE RÉSERVATIONS
    const bookings = await prisma.booking.findMany({
      where: {
        ownerId: user.id,
        OR: [
          { reference: { contains: query, mode: "insensitive" } },
          { tenant: { firstName: { contains: query, mode: "insensitive" } } },
          { tenant: { lastName: { contains: query, mode: "insensitive" } } },
          { listing: { title: { contains: query, mode: "insensitive" } } },
        ],
      },
      take: 5,
      include: {
        tenant: {
          select: { firstName: true, lastName: true },
        },
        listing: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. RECHERCHE D'UTILISATEURS (PROPRIÉTAIRES)
    const users = await prisma.user.findMany({
      where: {
        id: { not: user.id },
        role: { in: ["PROPERTY_OWNER", "BOTH"] },
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        profilePictureUrl: true,
        governorate: true,
        isIdentityVerified: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Formater les résultats avec les types pour les icônes React
    const results = [
      // Annonces - type "listing"
      ...listings.map((listing) => ({
        type: "listing",
        id: listing.id,
        title: listing.title,
        subtitle: `${listing.governorate}${listing.pricePerNight ? ` • ${listing.pricePerNight} TND/nuit` : ""}`,
        status: listing.status,
        statusLabel: listing.status === "ACTIVE" ? "Actif" :
                     listing.status === "PENDING_REVIEW" ? "En attente" :
                     listing.status === "DRAFT" ? "Brouillon" : listing.status,
        statusColor: listing.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                     listing.status === "PENDING_REVIEW" ? "bg-amber-100 text-amber-700" :
                     "bg-gray-100 text-gray-700",
        href: `/dashboard/owner/listings/${listing.id}`,
      })),

      // Réservations - type "booking"
      ...bookings.map((booking) => ({
        type: "booking",
        id: booking.id,
        title: `Réservation #${booking.reference}`,
        subtitle: `${booking.tenant.firstName || ""} ${booking.tenant.lastName || ""} - ${booking.listing.title}`,
        status: booking.status,
        statusLabel: booking.status === "CONFIRMED" ? "Confirmée" :
                     booking.status === "PENDING" ? "En attente" :
                     booking.status === "COMPLETED" ? "Terminée" :
                     booking.status === "CANCELLED" ? "Annulée" : booking.status,
        statusColor: booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                     booking.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                     booking.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                     booking.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                     "bg-gray-100 text-gray-700",
        href: `/dashboard/owner/reservations/${booking.id}`,
      })),

      // Utilisateurs (Propriétaires) - type "user"
      ...users.map((u) => ({
        type: "user",
        id: u.id,
        title: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email,
        subtitle: u.governorate || "Propriétaire",
        status: u.isIdentityVerified ? "verified" : null,
        statusLabel: u.isIdentityVerified ? "Vérifié" : null,
        statusColor: u.isIdentityVerified ? "bg-emerald-100 text-emerald-700" : null,
        href: `/dashboard/owner/property-owner/${u.id}`,
      })),
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error("Owner Search API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}