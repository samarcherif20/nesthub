// app/api/contracts/route.ts - Version corrigée
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateContractPDF } from "@/lib/pdf-generator";

//  FONCTION POUR NETTOYER LES NOMS
function cleanName(name: string | null | undefined): string {
  if (!name) return "";
  // Garder uniquement les lettres (y compris accentuées) et les espaces
  let cleaned = name.replace(/[^a-zA-Z\s\u00C0-\u00FF\u0100-\u017F\u0180-\u024F]/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

//  FONCTION POUR EXTRAIRE LE PRÉNOM ET NOM DEPUIS PLUSIEURS SOURCES
function extractUserIdentity(user: any) {
  // Essayer plusieurs sources possibles
  let firstName = "";
  let lastName = "";
  let cinNumber = "";
  
  // 1. Vérifier si on a des données dans cinData.extractedData
  const cinData = user?.cinData as any;
  const extractedData = cinData?.extractedData as any;
  
  if (extractedData) {
    if (extractedData.firstName && extractedData.firstName !== "UNKNOWN") {
      firstName = extractedData.firstName;
    }
    if (extractedData.lastName && extractedData.lastName !== "UNKNOWN") {
      lastName = extractedData.lastName;
    }
    if (extractedData.cinNumber) {
      cinNumber = extractedData.cinNumber;
    }
  }
  
  // 2. Sinon, utiliser les champs directs de l'utilisateur
  if (!firstName && user?.firstName) {
    firstName = user.firstName;
  }
  if (!lastName && user?.lastName) {
    lastName = user.lastName;
  }
  
  // 3. Sinon, essayer cinData direct
  if (!firstName && cinData?.firstName) {
    firstName = cinData.firstName;
  }
  if (!lastName && cinData?.lastName) {
    lastName = cinData.lastName;
  }
  
  // 4. Si toujours rien, essayer fullName ou username
  if (!firstName && !lastName && user?.fullName) {
    const nameParts = user.fullName.split(" ");
    firstName = nameParts[0] || "";
    lastName = nameParts.slice(1).join(" ") || "";
  }
  if (!firstName && !lastName && user?.username) {
    firstName = user.username;
  }
  
  // 5. Dernier recours : extraire du CIN number
  if (!firstName && !lastName && user?.cinNumber) {
    cinNumber = user.cinNumber;
    // Essayer d'extraire un nom du CIN si possible
  }
  
  // Nettoyer les noms
  firstName = cleanName(firstName);
  lastName = cleanName(lastName);
  
  return {
    firstName: firstName || "Client",
    lastName: lastName || (firstName ? "" : "Client"),
    cinNumber: cinNumber || user?.cinNumber || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    console.log(" POST /api/contracts - userId:", userId);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    console.log(" Body reçu:", body);
    
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

    //  EXTRAIRE LES IDENTITÉS CORRECTEMENT
    const tenantIdentity = extractUserIdentity(booking.tenant);
    const ownerIdentity = extractUserIdentity(booking.owner);

    console.log(" Tenant identity extraite:", {
      firstName: tenantIdentity.firstName,
      lastName: tenantIdentity.lastName,
      cinNumber: tenantIdentity.cinNumber,
    });
    console.log(" Owner identity extraite:", {
      firstName: ownerIdentity.firstName,
      lastName: ownerIdentity.lastName,
      cinNumber: ownerIdentity.cinNumber,
    });

    // Calcul des nuits
    const totalNights = booking.totalNights || 
      Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24));

    //  PRÉPARER LES DONNÉES POUR LE PDF
    const contractData = {
      reference: `CTR-${Date.now().toString(36)}`,
      bookingId: booking.id,
      tenant: {
        firstName: tenantIdentity.firstName,
        lastName: tenantIdentity.lastName,
        email: booking.tenant?.email || tenantIdentity.email,
        phone: booking.tenant?.phoneNumber || tenantIdentity.phone,
        cinNumber: tenantIdentity.cinNumber,
      },
      owner: {
        firstName: ownerIdentity.firstName,
        lastName: ownerIdentity.lastName,
        email: booking.owner?.email || ownerIdentity.email,
        phone: booking.owner?.phoneNumber || ownerIdentity.phone,
        cinNumber: ownerIdentity.cinNumber,
      },
      dates: {
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: totalNights,
      },
      price: {
        pricePerNight: booking.pricePerNight || 0,
        basePrice: (booking.pricePerNight || 0) * totalNights,
        cleaningFee: booking.cleaningFee || 0,
        serviceFee: booking.serviceFee || 0,
        totalPrice: booking.totalPrice || 0,
      },
      deposit: {
        amount: booking.securityDeposit || 0,
        status: "AUTHORIZED",
      },
      createdAt: new Date(),
    };

    //  GÉNÉRER LE PDF EN BASE64
    const pdfBase64 = await generateContractPDF(contractData);
    
    //  VÉRIFIER SI LE CONTRAT EXISTE DÉJÀ
    const existingContract = await prisma.contract.findUnique({
      where: { bookingId: booking.id },
    });

    let contract;

    if (existingContract) {
      contract = await prisma.contract.update({
        where: { id: existingContract.id },
        data: {
          pdfUrl: `data:application/pdf;base64,${pdfBase64}`,
          content: contractData,
          updatedAt: new Date(),
        },
      });
      console.log(" Contrat mis à jour");
    } else {
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
      console.log(" Nouveau contrat créé");
    }

    return NextResponse.json({ success: true, contract });
  } catch (error) {
    console.error(" Erreur POST:", error);
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
    console.error(" Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}