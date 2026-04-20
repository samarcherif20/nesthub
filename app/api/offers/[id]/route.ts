import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const offer = await prisma.offer.findFirst({
      where: {
        id,
        OR: [{ tenantId: user.id }, { ownerId: user.id }],
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            type: true,
            location: true,
          },
        },
        tenant: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        infoRequest: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error("Erreur GET offre:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}