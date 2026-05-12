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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        profilePictureUrl: true,
        bio: true,
        createdAt: true,
        role: true,
        isIdentityVerified: true,
        phoneVerified: true,
        emailVerified: true,
        spokenLanguages: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Calculer les stats
    const stats = await prisma.userStats.findUnique({
      where: { userId: user.id },
    });

    const reviews = await prisma.review.count({
      where: { targetId: user.id, rating: { gte: 4 } },
    });

    const listings = await prisma.listing.count({
      where: { ownerId: user.id, status: "ACTIVE" },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio,
        memberSince: new Date(user.createdAt).getFullYear().toString(),
        responseRate: 95,
        rating: 4.9,
        reviewCount: reviews,
        isVerified: user.isIdentityVerified,
        isEliteHost: user.role === "BOTH" || user.role === "PROPERTY_OWNER",
        location: "Tunisie",
        languages: user.spokenLanguages,
      },
    });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}