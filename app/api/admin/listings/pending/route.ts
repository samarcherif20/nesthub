// app/api/admin/listings/pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: any = {
      status: "PENDING_REVIEW",
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { owner: { firstName: { contains: search, mode: "insensitive" } } },
        { owner: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [listings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePictureUrl: true,
            },
          },
          photos: {
            where: { isMain: true },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    const formattedListings = listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      type: listing.type,
      governorate: listing.governorate,
      delegation: listing.delegation,
      pricePerNight: listing.pricePerNight,
      images: listing.photos.map((p) => p.url),
      owner: {
        firstName: listing.owner.firstName,
        lastName: listing.owner.lastName,
        profilePictureUrl: listing.owner.profilePictureUrl,
      },
      createdAt: listing.createdAt,
    }));

    return NextResponse.json({
      listings: formattedListings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching pending listings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}