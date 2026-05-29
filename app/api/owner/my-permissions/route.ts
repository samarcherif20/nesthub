// app/api/owner/my-permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    //  1. Récupérer les annonces où l'utilisateur est propriétaire
    const ownedListings = await prisma.listing.findMany({
      where: { ownerId: user.id, isArchived: false },
      select: {
        id: true,
        title: true,
        type: true,
        governorate: true,
        status: true,
      },
    });

    //  2. Récupérer les annonces où l'utilisateur est co-hôte
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        listing: {
          select: { id: true, title: true, type: true, governorate: true, status: true },
        },
      },
    });

    //  3. Combiner les deux
    const ownedListingsWithRole = ownedListings.map(listing => ({
      ...listing,
      role: "OWNER",
      permissions: {
        canEdit: true,
        canManageBookings: true,
        canViewRevenue: true,
        canManageTeam: true,
      },
    }));

    const cohostListingsWithRole = teamMemberships.map(tm => ({
      id: tm.listing.id,
      title: tm.listing.title,
      type: tm.listing.type,
      governorate: tm.listing.governorate,
      status: tm.listing.status,
      role: "CO_HOST",
      permissions: {
        canEdit: tm.canEdit,
        canManageBookings: tm.canManageBookings,
        canViewRevenue: tm.canViewRevenue,
        canManageTeam: tm.canManageTeam,
      },
    }));

    const allListings = [...ownedListingsWithRole, ...cohostListingsWithRole];

    //  4. Déterminer le rôle principal de l'utilisateur
    const isOwner = user.role === "PROPERTY_OWNER" || user.role === "BOTH" || user.role === "ADMIN";
    const isCohost = teamMemberships.length > 0;

    let primaryRole = "UNKNOWN";
    if (isOwner && isCohost) {
      primaryRole = "BOTH"; 
    } else if (isOwner) {
      primaryRole = "OWNER";
    } else if (isCohost) {
      primaryRole = "CO_HOST";
    }

    console.log("📤 [my-permissions] Réponse:", {
      email: user.email,
      primaryRole,
      ownedCount: ownedListings.length,
      cohostCount: teamMemberships.length,
      totalListings: allListings.length,
    });

    return NextResponse.json({
      role: primaryRole,
      isOwner: isOwner,
      isCohost: isCohost,
      listingsCount: allListings.length,
      listings: allListings,
      ownedListingsCount: ownedListings.length,
      cohostListingsCount: teamMemberships.length,
    });
  } catch (error) {
    console.error("[GET /api/owner/my-permissions] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}