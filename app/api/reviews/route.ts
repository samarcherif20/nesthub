// app/api/reviews/route.ts
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tab = searchParams.get("tab") || "received";

    let whereCondition = {};
    if (tab === "received") {
      whereCondition = {
        targetId: user.id,
        targetType: "USER",
        isPublished: true,
      };
    } else {
      whereCondition = {
        reviewerId: user.id,
        isPublished: true,
      };
    }

    const reviews = await prisma.review.findMany({
      where: whereCondition,
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
          },
        },
        target: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
          },
        },
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                type: true,
                governorate: true,
                delegation: true,
                photos: {
                  where: { isMain: true },
                  take: 1,
                  select: { url: true, isMain: true },
                },
              },
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}