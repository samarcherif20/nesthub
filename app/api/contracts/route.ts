// app/api/contracts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateContractPDF } from "@/lib/pdf-generator";

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
      booking = await prisma.booking.findUnique({ 
        where: { id: bookingId },
        include: {
          tenant: true,
          owner: true,
          listing: true,
        }
      });
    } else if (offerId) {
      booking = await prisma.booking.findFirst({ 
        where: { offerId: offerId },
        include: {
          tenant: true,
          owner: true,
          listing: true,
        }
      });
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

    // ✅ FONCTION POUR EXTRAIRE LES DONNÉES DU CIN
    function getIdentityFromCin(user: any) {
      const cinData = user?.cinData as any;
      
      // Si cinData existe et a les bonnes propriétés
      if (cinData && (cinData.firstName || cinData.lastName)) {
        return {
          firstName: cinData.firstName || user?.firstName || "",
          lastName: cinData.lastName || user?.lastName || "",
          cinNumber: user?.cinNumber || "",
          dateOfBirth: cinData.dateOfBirth || user?.dateOfBirth,
          // ❌ SUPPRIMÉ : profession, governorate, delegation
        };
      }
      
      // Fallback sur les champs normaux
      return {
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        cinNumber: user?.cinNumber || "",
        dateOfBirth: user?.dateOfBirth,
      };
    }

    const tenantIdentity = getIdentityFromCin(booking.tenant);
    const ownerIdentity = getIdentityFromCin(booking.owner);

    console.log("📋 Tenant identity from CIN:", {
      firstName: tenantIdentity.firstName,
      lastName: tenantIdentity.lastName,
      cinNumber: tenantIdentity.cinNumber,
      dateOfBirth: tenantIdentity.dateOfBirth,
    });
    console.log("📋 Owner identity from CIN:", {
      firstName: ownerIdentity.firstName,
      lastName: ownerIdentity.lastName,
      cinNumber: ownerIdentity.cinNumber,
      dateOfBirth: ownerIdentity.dateOfBirth,
    });

    // ✅ PRÉPARER LES DONNÉES POUR LE PDF (sans profession, governorate, delegation)
    const contractData = {
      reference: `CTR-${Date.now().toString(36)}`,
      bookingId: booking.id,
      tenant: {
        firstName: tenantIdentity.firstName,
        lastName: tenantIdentity.lastName,
        email: booking.tenant?.email || "",
        phone: booking.tenant?.phoneNumber,
        cinNumber: tenantIdentity.cinNumber,
        dateOfBirth: tenantIdentity.dateOfBirth,
        // ❌ SUPPRIMÉ : profession, governorate, delegation
      },
      owner: {
        firstName: ownerIdentity.firstName,
        lastName: ownerIdentity.lastName,
        email: booking.owner?.email || "",
        phone: booking.owner?.phoneNumber,
        cinNumber: ownerIdentity.cinNumber,
        dateOfBirth: ownerIdentity.dateOfBirth,
        // ❌ SUPPRIMÉ : profession, governorate, delegation
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
      createdAt: new Date(),
    };

    // ✅ GÉNÉRER LE PDF EN BASE64
    const pdfBase64 = await generateContractPDF(contractData);
    
    // ✅ VÉRIFIER SI LE CONTRAT EXISTE DÉJÀ
    const existingContract = await prisma.contract.findUnique({
      where: { bookingId: booking.id },
    });

    let contract;

    if (existingContract) {
      // ✅ METTRE À JOUR le contrat existant
      contract = await prisma.contract.update({
        where: { id: existingContract.id },
        data: {
          pdfUrl: `data:application/pdf;base64,${pdfBase64}`,
          content: contractData,
          updatedAt: new Date(),
        },
      });
      console.log("✅ Contrat mis à jour avec les dernières données");
    } else {
      // ✅ CRÉER un nouveau contrat
      contract = await prisma.contract.create({
        data: {
          reference: contractData.reference,
          bookingId: booking.id,
          pdfUrl: `data:application/pdf;base64,${pdfBase64}`,
          content: contractData,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      console.log("✅ Nouveau contrat créé");
    }

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