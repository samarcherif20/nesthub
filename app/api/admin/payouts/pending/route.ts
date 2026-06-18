// app/api/admin/payouts/pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que c'est un admin (optionnel)
    // Ici on suppose que seul l'admin peut accéder

    const payouts = await prisma.booking.findMany({
      where: {
        escrowStatus: "READY_FOR_MANUAL_PAYOUT",
      },
      include: {
        listing: { include: { owner: true } },
        tenant: true,
      },
      orderBy: { escrowReleasedAt: "desc" },
    });

    const formattedPayouts = payouts.map(p => ({
      id: p.id,
      reference: p.reference,
      amount: p.totalPrice,
      ownerName: `${p.listing.owner.firstName} ${p.listing.owner.lastName}`,
      ownerEmail: p.listing.owner.email,
      ownerRib: p.listing.owner.rib || "Non renseigné",
      createdAt: p.escrowReleasedAt,
    }));

    return NextResponse.json({ 
      success: true, 
      payouts: formattedPayouts,
      count: formattedPayouts.length,
    });

  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}