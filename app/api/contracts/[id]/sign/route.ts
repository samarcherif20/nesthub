import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id: contractId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { booking: { include: { listing: true } } },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contrat non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (contract.booking.listing.ownerId !== user.id) {
      return NextResponse.json({ error: "Seul le propriétaire peut signer" }, { status: 403 });
    }

    // Vérifier que le contrat n'est pas expiré
    if (new Date() > contract.expiresAt) {
      return NextResponse.json({ error: "Contrat expiré" }, { status: 400 });
    }

    // Mettre à jour le contrat
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: "COMPLETED",
        ownerSignedAt: new Date(),
      },
    });

    // Notification au locataire
    await prisma.notification.create({
      data: {
        userId: contract.booking.tenantId,
        type: "CONTRACT_SIGNED",
        title: "Contrat signé",
        content: `Le propriétaire a signé le contrat pour "${contract.booking.listing.title}".`,
        data: { contractId: contract.id },
        channels: ["IN_APP", "EMAIL"],
      },
    });

    return NextResponse.json({
      success: true,
      contract: updatedContract,
    });
  } catch (error) {
    console.error("Erreur signature contrat:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}