import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    console.log("🔐 POST /api/contracts - userId:", userId);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📦 Body reçu:", body);
    
    const { offerId, bookingId } = body;

    if (!offerId && !bookingId) {
      return NextResponse.json({ error: "offerId ou bookingId requis" }, { status: 400 });
    }

    let booking = null;
    
    if (bookingId) {
      booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    } else if (offerId) {
      booking = await prisma.booking.findFirst({ where: { offerId: offerId } });
    }

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    const isTenant = booking.tenantId === user?.id;
    const isOwner = booking.ownerId === user?.id;
    const isAdmin = user?.role === "ADMIN";

    if (!isTenant && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const existingContract = await prisma.contract.findUnique({
      where: { bookingId: booking.id },
    });

    if (existingContract) {
      return NextResponse.json({ success: true, contract: existingContract, alreadyExists: true });
    }

    const contract = await prisma.contract.create({
      data: {
        reference: `CTR-${Date.now().toString(36)}`,
        bookingId: booking.id,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ success: true, contract });
  } catch (error) {
    console.error("❌ Erreur POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const offerId = searchParams.get("offerId");
    const bookingId = searchParams.get("bookingId");

    let targetBookingId = bookingId;

    if (!targetBookingId && offerId) {
      const booking = await prisma.booking.findFirst({
        where: { offerId: offerId },
        select: { id: true },
      });
      targetBookingId = booking?.id || null;
    }

    if (!targetBookingId) {
      return NextResponse.json({ error: "bookingId ou offerId requis" }, { status: 400 });
    }

    const contract = await prisma.contract.findUnique({
      where: { bookingId: targetBookingId },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contrat non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ contract });
  } catch (error) {
    console.error("❌ Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
