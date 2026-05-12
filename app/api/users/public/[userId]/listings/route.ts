import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { username: userId },
          { clerkId: userId },
        ],
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const listings = await prisma.listing.findMany({
      where: {
        ownerId: user.id,
        status: "ACTIVE",
      },
      include: {
        photos: {
          where: { isMain: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const formattedListings = listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      location: `${listing.governorate}, ${listing.delegation}`,
      guests: listing.maxGuests || 4,
      bedrooms: listing.rooms,
      price: listing.pricePerNight || listing.pricePerMonth || 0,
      rating: 4.8,
      imageUrl: listing.photos[0]?.url || null,
      liked: false,
    }));

    return NextResponse.json({ listings: formattedListings });
  } catch (error) {
    console.error("Error fetching user listings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}