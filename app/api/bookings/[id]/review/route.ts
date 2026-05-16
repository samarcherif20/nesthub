// app/api/bookings/[id]/review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { onReviewCreated } from "@/lib/risk-scoring";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id: bookingId } = await params;
    const formData = await request.formData();
    const rating = parseInt(formData.get("rating") as string);
    const publicComment = formData.get("publicComment") as string;
    const privateNote = formData.get("privateNote") as string;
    const criteria = JSON.parse(formData.get("criteria") as string || "{}");

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { tenantId: true, ownerId: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    // Le reviewer est le locataire, target est le propriétaire
    const targetId = booking.ownerId;

    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: user.id,
        targetId: targetId!,
        targetType: "USER",
        rating,
        comment: publicComment,
      },
    });

    // ✅ DÉCLENCHER LE RECALCUL DU SCORE
    await onReviewCreated(review.id);

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}