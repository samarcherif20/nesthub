// app/api/disputes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            listing: true,
            tenant: { select: { id: true, firstName: true, lastName: true, username: true } },
            owner: { select: { id: true, firstName: true, lastName: true, username: true } }
          }
        }
      }
    });

    if (!dispute) {
      return NextResponse.json({ error: "Litige non trouve" }, { status: 404 });
    }

    // Verifier que l'utilisateur a le droit de voir ce litige
    const isOwner = dispute.booking.ownerId === user.id;
    const isTenant = dispute.booking.tenantId === user.id;
    const isOpener = dispute.openedBy === user.id;

    if (!isOwner && !isTenant && !isOpener) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    return NextResponse.json(dispute);
  } catch (error) {
    console.error("Erreur recuperation litige:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}