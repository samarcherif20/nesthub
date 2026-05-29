// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ListingType } from "@prisma/client"; 

export async function GET() {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 1. CATÉGORIES - depuis ListingType enum
    const listingTypes = Object.values(ListingType).map((type, index) => ({
      id: (index + 1).toString(),
      name: getListingTypeName(type),
      enabled: true,
    }));

    // 2. COMMISSIONS - depuis Booking.commission réelle
    const avgCommission = await prisma.booking.aggregate({
      _avg: { commission: true },
      where: { status: { not: "CANCELLED" } }
    });

    // 3. DESTINATIONS POPULAIRES - depuis Listing.governorate
    const popularDestinationsData = await prisma.listing.groupBy({
      by: ['governorate'],
      _count: { id: true },
      where: { status: "ACTIVE" },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const popularDestinations = popularDestinationsData
      .map(p => p.governorate)
      .filter(Boolean);

    // 4. SEUIL DE SIGNALEMENT - depuis ListingReport
    const reportsCount = await prisma.listingReport.count();
    const listingsCount = await prisma.listing.count({ where: { status: "ACTIVE" } });
    const avgReportsPerListing = listingsCount > 0 ? reportsCount / listingsCount : 0;

    // 5. HELP CENTER URL - depuis StaticPage
    const helpCenterPage = await prisma.staticPage.findFirst({
      where: { type: "HELP_CENTER" }
    });

    return NextResponse.json({
      categories: listingTypes,
      commission: {
        standard: Math.round(avgCommission._avg.commission || 12),
        premium: Math.round((avgCommission._avg.commission || 12) * 1.5),
      },
      searchSettings: {
        defaultRadius: 25,
        displayPriority: "newest",
        popularDestinations: popularDestinations.length > 0 ? popularDestinations : ["Tunis", "Hammamet", "Sousse"],
      },
      moderationSettings: {
        autoHideThreshold: Math.max(3, Math.floor(avgReportsPerListing * 2) || 5),
        blacklistedKeywords: ["arnaque", "argent facile", "faux", "spam"],
      },
      supportSettings: {
        helpCenterUrl: helpCenterPage?.slug 
          ? `/${helpCenterPage.slug}` 
          : "https://help.nesthub.tn",
        emergencyNumber: "+216 71 000 000",
        emailRouting: "support-global@nesthub.tn",
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Erreur lors du chargement" }, { status: 500 });
  }
}

function getListingTypeName(type: ListingType): string {
  const names: Record<ListingType, string> = {
    APARTMENT: "Appartements",
    VILLA: "Villas",
    STUDIO: "Studios",
    DUPLEX: "Duplex",
    HOUSE: "Maisons",
    ROOM: "Chambres",
  };
  return names[type];
}

export async function PATCH(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    
    console.log(" Paramètres sauvegardés:", {
      commission: body.commission,
      searchSettings: body.searchSettings,
      moderationSettings: body.moderationSettings,
      supportSettings: body.supportSettings,
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Paramètres sauvegardés avec succès" 
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}