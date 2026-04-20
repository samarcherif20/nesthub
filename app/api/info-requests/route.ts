import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// ✅ Fonction pour générer une référence unique
function generateReference(): string {
  const prefix = "INF";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ✅ Méthode POST pour créer une demande d'information
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, message, checkIn, checkOut, guests } = body;

    // Validation
    if (!listingId) {
      return NextResponse.json(
        { error: "ID du logement requis" },
        { status: 400 },
      );
    }

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: "Les dates de séjour sont requises" },
        { status: 400 },
      );
    }

    // Vérifier que le logement existe
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { owner: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Logement non trouvé" },
        { status: 404 },
      );
    }

    // Récupérer l'utilisateur qui fait la demande
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Vérifier que les dates sont valides
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return NextResponse.json(
        { error: "La date d'arrivée ne peut pas être dans le passé" },
        { status: 400 },
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: "La date de départ doit être après la date d'arrivée" },
        { status: 400 },
      );
    }

    // Calculer la date d'expiration (7 jours par défaut)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Créer la demande d'information avec TOUS les champs requis
    const infoRequest = await prisma.infoRequest.create({
      data: {
        reference: generateReference(),
        listingId,
        tenantId: user.id,
        ownerId: listing.ownerId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: guests || 1,
        message: message || null,
        hasPets: false,
        needsBabyBed: false,
        lateCheckin: false,
        status: "PENDING",
        expiresAt,
      },
    });

    // Créer une notification pour le propriétaire
    await prisma.notification.create({
      data: {
        userId: listing.ownerId,
        type: "INFO_REQUEST_RECEIVED",
        title: "Nouvelle demande d'information",
        content: `${user.username || "Un locataire"} souhaite obtenir plus d'informations sur votre logement "${listing.title}"`,
        data: {
          infoRequestId: infoRequest.id,
          listingId: listing.id,
          tenantId: user.id,
          tenantName: user.username || "inconnu",
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests: guests || 1,
        },
        channels: ["IN_APP", "EMAIL"],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Demande d'information envoyée avec succès",
      infoRequest,
    });
  } catch (error) {
    console.error("Erreur création demande d'information:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

// ✅ Méthode GET pour récupérer les demandes d'information
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const tenantId = searchParams.get("tenantId");

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const where: any = {};

    if (listingId) {
      where.listingId = listingId;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    // Si l'utilisateur est propriétaire, voir les demandes pour ses logements
    if (user.role === "PROPERTY_OWNER" || user.role === "ADMIN") {
      const userListings = await prisma.listing.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      });
      const listingIds = userListings.map((l) => l.id);
      where.listingId = { in: listingIds };
    }
    // Si l'utilisateur est locataire, voir ses propres demandes
    else {
      where.tenantId = user.id;
    }

    const infoRequests = await prisma.infoRequest.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        tenant: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(infoRequests);
  } catch (error) {
    console.error("Erreur récupération demandes d'information:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

// ✅ Méthode PUT pour mettre à jour une demande (accepter/refuser)
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { infoRequestId, status } = body;

    if (!infoRequestId) {
      return NextResponse.json(
        { error: "ID de la demande requis" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const infoRequest = await prisma.infoRequest.findUnique({
      where: { id: infoRequestId },
    });

    if (!infoRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 },
      );
    }

    // Vérifier que l'utilisateur a le droit de modifier (propriétaire ou admin)
    if (infoRequest.ownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const updated = await prisma.infoRequest.update({
      where: { id: infoRequestId },
      data: {
        status,
        respondedAt: new Date(),
      },
    });

    // Créer une notification pour le locataire
    await prisma.notification.create({
      data: {
        userId: infoRequest.tenantId,
        type:
          status === "ACCEPTED"
            ? "INFO_REQUEST_ACCEPTED"
            : "INFO_REQUEST_REJECTED",
        title: status === "ACCEPTED" ? "Demande acceptée" : "Demande refusée",
        content:
          status === "ACCEPTED"
            ? "Votre demande d'information a été acceptée par le propriétaire"
            : "Votre demande d'information a été refusée par le propriétaire",
        data: {
          infoRequestId: infoRequest.id,
          listingId: infoRequest.listingId,
        },
        channels: ["IN_APP", "EMAIL"],
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur mise à jour demande d'information:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
