// app/api/contracts/route.ts - Version qui fonctionne
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateContractPDF } from "@/lib/contracts/generatePDF";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { offerId } = body; // ← offerId, PAS bookingId

    if (!offerId) {
      return NextResponse.json({ error: "offerId requis" }, { status: 400 });
    }

    // Récupérer l'offre
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        listing: { include: { owner: true } },
        tenant: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    // Vérifier si contrat existe déjà
    const existingContract = await prisma.contract.findUnique({
      where: { offerId: offer.id },
    });

    if (existingContract) {
      return NextResponse.json({ success: true, contract: existingContract });
    }

    // Générer le PDF
    const pdfBase64 = await generateContractPDF({
      // ... tes données
    });

    // Créer le contrat (lié à l'offre)
    const contract = await prisma.contract.create({
      data: {
        reference: `CTR-${Date.now().toString(36)}`,
        offerId: offer.id, // ← clé étrangère vers Offer
        pdfUrl: `data:application/pdf;base64,${pdfBase64}`,
        content: {},
        status: "PENDING",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ success: true, contract });
  } catch (error) {
    console.error(error);
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
    const offerId = searchParams.get("offerId"); // ← offerId

    if (!offerId) {
      return NextResponse.json({ error: "offerId requis" }, { status: 400 });
    }

    const contract = await prisma.contract.findUnique({
      where: { offerId },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Contrat non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
