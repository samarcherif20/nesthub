import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import ListingService from "@/lib/services/listing.service";
import { updateListingSchema } from "@/lib/validations/listing";
import { withAuth } from "@/lib/api/withAuth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Public
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;

    let shouldIncrementViews = true;

    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      if (user) {
        const listing = await prisma.listing.findFirst({
          where: { id, ownerId: user.id },
          select: { id: true },
        });
        if (listing) shouldIncrementViews = false;
      }
    }

    // ✅ Récupérer le listing via ListingService
    const listing = await ListingService.getListingById(
      id,
      shouldIncrementViews,
    );
    
    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 },
      );
    }

    // ✅ AJOUT : Récupérer les pending bookings (offres acceptées en attente de paiement)
    const pendingBookings = await prisma.pendingBooking.findMany({
      where: {
        listingId: id,
        expiresAt: { gt: new Date() }, // Non expirées
        isReleased: false,
      },
    });

    // ✅ Extraire les dates des pending bookings
    const pendingDates = pendingBookings.flatMap(pb => {
      const dates = pb.dates as string[];
      return dates.map(dateStr => dateStr.split("T")[0]);
    });

    // ✅ Récupérer les blocked dates normales (si pas déjà dans listing)
    const blockedDatesList = await prisma.blockedDate.findMany({
      where: {
        listingId: id,
        startDate: { gte: new Date() },
      },
    });

    const blockedDates = blockedDatesList.map(bd => 
      bd.startDate.toISOString().split("T")[0]
    );

    // ✅ Fusionner les données
    const response = {
      ...listing,
      blockedDates: blockedDates,
      pendingDates: pendingDates, // ✅ NOUVEAU
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/listings/:id] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Incrémenter les vues (inchangé)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;

    if (!id)
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      if (user) {
        const listing = await prisma.listing.findFirst({
          where: { id, ownerId: user.id },
          select: { id: true, title: true },
        });
        if (listing) {
          return NextResponse.json({
            success: false,
            message: "Vue non comptée (propriétaire)",
            reason: "owner",
          });
        }
      }
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true, title: true },
    });
    return NextResponse.json({
      success: true,
      message: "Vue comptée",
      viewCount: updatedListing.viewCount,
    });
  } catch (error) {
    console.error("[VIEW API] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mise à jour (inchangé)
export const PUT = withAuth(
  async (request: NextRequest, { params }: RouteParams) => {
    const user = (request as any).user;
    const { id } = await params;
    const body = await request.json();

    const convertNullToUndefined = (obj: any): any => {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === null) result[key] = undefined;
        else if (Array.isArray(value)) result[key] = value;
        else if (typeof value === "object" && value !== null)
          result[key] = convertNullToUndefined(value);
        else result[key] = value;
      }
      return result;
    };

    const cleanedBody = convertNullToUndefined(body);
    const { photos, ...updateData } = cleanedBody;

    const validationResult = updateListingSchema.safeParse(updateData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const listing = await ListingService.updateListing(
      id,
      user.id,
      validationResult.data,
      photos,
    );
    return NextResponse.json(listing);
  },
  {
    requireListingAccess: true,
    requiredPermission: "edit",
  },
);

// DELETE (inchangé)
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams) => {
    const user = (request as any).user;
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      await ListingService.deleteListing(id, user.id);
      return NextResponse.json({ message: "Annonce supprimée définitivement" });
    } else {
      const listing = await ListingService.archiveListing(id, user.id);
      return NextResponse.json({ message: "Annonce archivée", listing });
    }
  },
  {
    requireListingAccess: true,
    requiredPermission: "edit",
  },
);

// PATCH (inchangé)
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams) => {
    const user = (request as any).user;
    const { id } = await params;
    const body = await request.json();
    const { status, action } = body;

    let result;

    if (status) {
      const existingListing = await prisma.listing.findFirst({
        where: { id, ownerId: user.id },
      });
      if (!existingListing)
        return NextResponse.json(
          { error: "Annonce non trouvée" },
          { status: 404 },
        );

      result = await prisma.listing.update({ where: { id }, data: { status } });
      await prisma.listingHistory.create({
        data: {
          listingId: id,
          actionType: "STATUS_CHANGE",
          oldValue: { status: existingListing.status },
          newValue: { status },
          changedBy: user.id,
        },
      });
    } else if (action === "RESTORE") {
      result = await ListingService.restoreListing(id, user.id);
    } else if (action === "TOGGLE_STATUS") {
      const listing = await prisma.listing.findUnique({
        where: { id },
        select: { status: true, ownerId: true },
      });
      if (!listing || listing.ownerId !== user.id)
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      const newStatus = listing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      result = await prisma.listing.update({
        where: { id },
        data: { status: newStatus },
      });
    } else {
      return NextResponse.json(
        { error: "Status ou action manquant" },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  },
  {
    requireListingAccess: true,
    requiredPermission: "edit",
  },
);