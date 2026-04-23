// app/api/contracts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateContractPDF } from "@/lib/contracts/generatePDF";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    console.log("🔐 [CONTRACTS] userId:", userId);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur depuis la DB
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const body = await req.json();
    console.log("📦 Body reçu:", body);
    
    const { offerId, bookingId } = body;

    // Trouver la réservation
    let booking = null;
    
    if (bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          listing: { include: { owner: true, photos: { take: 1 } } },
          tenant: true,
          offer: true,
        },
      });
    } else if (offerId) {
      booking = await prisma.booking.findFirst({
        where: { offerId: offerId },
        include: {
          listing: { include: { owner: true, photos: { take: 1 } } },
          tenant: true,
          offer: true,
        },
      });
    }

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    console.log("🔍 Réservation trouvée:", {
      bookingId: booking.id,
      tenantId: booking.tenantId,
      ownerId: booking.listing.ownerId,
      currentUserId: user.id
    });

    // Vérifier que l'utilisateur est bien le locataire OU le propriétaire
    const isTenant = booking.tenantId === user.id;
    const isOwner = booking.listing.ownerId === user.id;

    if (!isTenant && !isOwner) {
      console.log("❌ Non autorisé - user n'est ni tenant ni owner");
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier si contrat existe déjà (via bookingId qui est unique)
    const existingContract = await prisma.contract.findUnique({
      where: { bookingId: booking.id },
    });

    if (existingContract) {
      return NextResponse.json({ 
        success: true, 
        contract: existingContract,
        alreadyExists: true 
      });
    }

    // Préparer les données pour le PDF
    const contractData = {
      reference: `CTR-${Date.now().toString(36)}`,
      bookingId: booking.id,
      listing: {
        title: booking.listing.title,
        address: `${booking.listing.street || ""} ${booking.listing.delegation || ""} ${booking.listing.governorate || ""}`.trim(),
        type: booking.listing.type || "Appartement",
        rooms: booking.listing.rooms || 1,
        maxGuests: booking.listing.maxGuests || booking.guests,
      },
      tenant: {
        firstName: booking.tenant?.firstName || user.firstName || "Locataire",
        lastName: booking.tenant?.lastName || "",
        email: booking.tenant?.email || user.email || "email@example.com",
        phone: booking.tenant?.phoneNumber || user.phoneNumber || "",
      },
      owner: {
        firstName: booking.listing.owner?.firstName || "Propriétaire",
        lastName: booking.listing.owner?.lastName || "",
        email: booking.listing.owner?.email || "email@example.com",
        phone: booking.listing.owner?.phoneNumber || "",
      },
      dates: {
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.totalNights,
      },
      price: {
        pricePerNight: booking.pricePerNight,
        basePrice: booking.pricePerNight * booking.totalNights,
        cleaningFee: booking.cleaningFee || 0,
        serviceFee: booking.serviceFee || 0,
        totalPrice: booking.totalPrice,
      },
      deposit: {
        amount: booking.securityDeposit || 0,
        status: "AUTHORIZED",
      },
      cancellationPolicy: "Modérée - Annulation gratuite jusqu'à 5 jours avant l'arrivée",
      createdAt: new Date(),
    };

    // Générer le PDF
    const pdfBase64 = await generateContractPDF(contractData);

    // Créer le contrat (lié à bookingId)
    const contract = await prisma.contract.create({
      data: {
        reference: contractData.reference,
        bookingId: booking.id,
        pdfUrl: `data:application/pdf;base64,${pdfBase64}`,
        content: contractData,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Créer une notification pour le locataire
    await prisma.notification.create({
      data: {
        userId: booking.tenantId,
        type: "CONTRACT_SIGNATURE_REQUIRED",
        title: "Contrat disponible",
        content: `Le contrat pour "${booking.listing.title}" est disponible à la signature.`,
        data: { contractId: contract.id, bookingId: booking.id },
        bookingId: booking.id,
      },
    });

    // Créer une notification pour le propriétaire
    if (booking.listing.ownerId !== booking.tenantId) {
      await prisma.notification.create({
        data: {
          userId: booking.listing.ownerId,
          type: "CONTRACT_SIGNATURE_REQUIRED",
          title: "Contrat disponible",
          content: `Le contrat pour "${booking.listing.title}" est disponible à la signature.`,
          data: { contractId: contract.id, bookingId: booking.id },
          bookingId: booking.id,
        },
      });
    }

    return NextResponse.json({ success: true, contract });
  } catch (error) {
    console.error("Erreur création contrat:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
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

    let targetBookingId: string | null = bookingId;

    if (!targetBookingId && offerId) {
      const booking = await prisma.booking.findFirst({
        where: { offerId: offerId },
        select: { id: true },
      });
      targetBookingId = booking?.id || null;
    }

    if (!targetBookingId) {
      return NextResponse.json(
        { error: "bookingId ou offerId requis" },
        { status: 400 }
      );
    }

    const contract = await prisma.contract.findUnique({
      where: { bookingId: targetBookingId },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Contrat non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Erreur GET contrat:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}