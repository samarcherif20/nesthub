import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const infoRequest = await prisma.infoRequest.findUnique({
      where: { id },
      include: { listing: true, tenant: true },
    });

    if (!infoRequest) {
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });
    }

    if (infoRequest.ownerId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (infoRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Cette demande a déjà été traitée" }, { status: 400 });
    }

    // Mettre à jour la demande
    const updated = await prisma.infoRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        respondedAt: new Date(),
      },
    });

    // Notifier le locataire
    const rejectionMessage = reason || "Le propriétaire n'est pas disponible pour ces dates";
    
    await prisma.notification.create({
      data: {
        userId: infoRequest.tenantId,
        type: "INFO_REQUEST_REJECTED",
        title: "❌ Demande refusée",
        content: `${rejectionMessage}. Vous pouvez faire une nouvelle demande avec d'autres dates.`,
        data: {
          infoRequestId: infoRequest.id,
          listingId: infoRequest.listingId,
          rejectedDates: {
            checkIn: infoRequest.checkIn,
            checkOut: infoRequest.checkOut,
          },
        },
        channels: ["IN_APP", "EMAIL"],
      },
    });

    return NextResponse.json({
      success: true,
      infoRequest: updated,
      message: "Demande refusée",
    });
  } catch (error) {
    console.error("Erreur refus:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}