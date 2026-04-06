import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString(),
    );
    const month = parseInt(
      searchParams.get("month") || (new Date().getMonth() + 1).toString(),
    );

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { ownerId: true },
      });

      if (!listing || (listing.ownerId !== user.id && user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    // Récupérer les dates bloquées
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        listingId: listingId || undefined,
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } },
            ],
          },
        ],
      },
    });

    // Récupérer les réservations
    const bookings = await prisma.booking.findMany({
      where: {
        listingId: listingId || undefined,
        status: { notIn: ["CANCELLED", "REJECTED", "EXPIRED"] },
        OR: [
          { checkIn: { gte: startDate, lte: endDate } },
          { checkOut: { gte: startDate, lte: endDate } },
          {
            AND: [
              { checkIn: { lte: startDate } },
              { checkOut: { gte: endDate } },
            ],
          },
        ],
      },
      include: {
        tenant: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Récupérer les règles de prix
    const pricingRules = await prisma.pricingRule.findMany({
      where: {
        listingId: listingId || undefined,
        isActive: true,
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } },
            ],
          },
        ],
      },
    });

    return NextResponse.json({
      blockedDates,
      bookings,
      pricingRules,
    });
  } catch (error) {
    console.error("[GET /api/listings/availability] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const body = await request.json();
    const { listingId, action, dates, reason, customPrice, minStay } = body;

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });

    if (!listing || listing.ownerId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // ACTION: BLOQUER
    if (action === "block") {
      for (const dateStr of dates) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const existing = await prisma.blockedDate.findFirst({
          where: {
            listingId,
            startDate: date,
            endDate: date,
          },
        });

        if (existing) {
          await prisma.blockedDate.update({
            where: { id: existing.id },
            data: { reason: reason || existing.reason },
          });
        } else {
          await prisma.blockedDate.create({
            data: {
              listingId,
              startDate: date,
              endDate: date,
              reason: reason || null,
              blockedById: user.id,
            },
          });
        }
      }
      return NextResponse.json({
        success: true,
        message: `${dates.length} date(s) bloquée(s)`,
      });
    }

    // ACTION: DÉBLOQUER
    if (action === "unblock") {
      for (const dateStr of dates) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        await prisma.blockedDate.deleteMany({
          where: {
            listingId,
            startDate: date,
            endDate: date,
          },
        });
      }
      return NextResponse.json({
        success: true,
        message: `${dates.length} date(s) débloquée(s)`,
      });
    }

    // ACTION: PRIX SPÉCIAL
    if (action === "setPrice") {
      const price = parseFloat(customPrice);
      if (isNaN(price) || price <= 0) {
        return NextResponse.json({ error: "Prix invalide" }, { status: 400 });
      }

      for (const dateStr of dates) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const existing = await prisma.pricingRule.findFirst({
          where: {
            listingId,
            startDate: date,
            endDate: date,
          },
        });

        if (existing) {
          await prisma.pricingRule.update({
            where: { id: existing.id },
            data: {
              fixedPrice: price,
              isActive: true,
            },
          });
        } else {
          await prisma.pricingRule.create({
            data: {
              listingId,
              name: `Prix spécial ${dateStr}`,
              fixedPrice: price,
              startDate: date,
              endDate: date,
              isActive: true,
              priority: 10,
            },
          });
        }
      }
      return NextResponse.json({
        success: true,
        message: `Prix appliqué à ${dates.length} date(s)`,
      });
    }

    // ACTION: DURÉE MINIMUM
    if (action === "setMinStay") {
      for (const dateStr of dates) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const existing = await prisma.pricingRule.findFirst({
          where: {
            listingId,
            startDate: date,
            endDate: date,
          },
        });

        if (existing) {
          await prisma.pricingRule.update({
            where: { id: existing.id },
            data: { minStay },
          });
        } else {
          await prisma.pricingRule.create({
            data: {
              listingId,
              name: `Durée minimum ${dateStr}`,
              minStay,
              startDate: date,
              endDate: date,
              isActive: true,
            },
          });
        }
      }
      return NextResponse.json({
        success: true,
        message: `Durée minimum mise à jour`,
      });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    console.error("[POST /api/listings/availability] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
