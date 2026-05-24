// app/api/admin/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Helper pour vérifier si l'utilisateur est admin
async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });
    return user?.role === "ADMIN";
  } catch (error) {
    console.error("Erreur vérification admin:", error);
    return false;
  }
}

// GET - Récupérer toutes les réservations avec filtres et pagination
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAdmin = await isAdminUser(clerkUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé - Droits administrateur requis" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const paymentStatus = searchParams.get("paymentStatus") || "ALL";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { listing: { title: { contains: search, mode: "insensitive" } } },
        { tenant: { firstName: { contains: search, mode: "insensitive" } } },
        { tenant: { lastName: { contains: search, mode: "insensitive" } } },
        { owner: { firstName: { contains: search, mode: "insensitive" } } },
        { owner: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status !== "ALL") where.status = status;
    if (paymentStatus !== "ALL") where.paymentStatus = paymentStatus;
    if (dateFrom) where.checkIn = { gte: new Date(dateFrom) };
    if (dateTo) where.checkOut = { lte: new Date(dateTo) };
    if (minAmount) where.totalPrice = { gte: parseFloat(minAmount) };
    if (maxAmount) where.totalPrice = { ...where.totalPrice, lte: parseFloat(maxAmount) };

    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              governorate: true,
              delegation: true,
              photos: {
                where: { isMain: true },
                take: 1,
                select: { url: true },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePictureUrl: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paidAt: true,
            },
          },
          review: {
            select: {
              id: true,
              rating: true,
            },
          },
          conversation: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [totalBookings, activeStays, revenueThisMonth, totalRevenue, cancelledBookings, pendingPayments] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          status: "CHECKED_IN",
          checkIn: { lte: now },
          checkOut: { gte: now },
        },
      }),
      prisma.booking.aggregate({
        where: {
          createdAt: { gte: firstDayOfMonth },
          status: { in: ["CONFIRMED", "COMPLETED"] },
          paymentStatus: "PAID",
        },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { status: { in: ["CONFIRMED", "COMPLETED"] }, paymentStatus: "PAID" },
        _sum: { totalPrice: true },
      }),
      prisma.booking.count({ where: { status: "CANCELLED" } }),
      prisma.booking.count({ where: { paymentStatus: "PENDING" } }),
    ]);

    const totalBookingsCount = totalBookings;
    const cancelledCount = cancelledBookings;
    const cancellationRate = totalBookingsCount > 0 ? ((cancelledCount / totalBookingsCount) * 100).toFixed(1) : "0";

    const stats = {
      totalBookings: totalBookingsCount,
      activeStays: activeStays,
      revenueThisMonth: revenueThisMonth._sum.totalPrice || 0,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      cancellationRate: parseFloat(cancellationRate),
      pendingPayments: pendingPayments,
      completedBookings: totalBookingsCount - cancelledCount,
      cancelledBookings: cancelledCount,
    };

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      conversationId: booking.conversation?.id,
      listing: {
        id: booking.listing.id,
        title: booking.listing.title,
        governorate: booking.listing.governorate,
        images: booking.listing.photos,
      },
      tenant: {
        id: booking.tenant.id,
        firstName: booking.tenant.firstName,
        lastName: booking.tenant.lastName,
        email: booking.tenant.email,
        profilePictureUrl: booking.tenant.profilePictureUrl,
      },
      owner: {
        id: booking.owner?.id,
        firstName: booking.owner?.firstName,
        lastName: booking.owner?.lastName,
        email: booking.owner?.email,
      },
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      totalPrice: booking.totalPrice,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
      payments: booking.payments,
      hasReview: !!booking.review,
    }));

    return NextResponse.json({
      bookings: formattedBookings,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("[Admin Bookings API] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Mettre à jour une réservation (SEULEMENT CONFIRMER)
export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAdmin = await isAdminUser(clerkUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { bookingId, action } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "ID de réservation requis" }, { status: 400 });
    }

    // L'admin ne peut que CONFIRMER une réservation (PAS ANNULER)
    if (action !== "confirm") {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
      include: {
        listing: { select: { id: true, title: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("[Admin Bookings API PATCH] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une réservation (seulement si COMPLETED ou CANCELLED)
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAdmin = await isAdminUser(clerkUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json({ error: "ID de réservation requis" }, { status: 400 });
    }

    // Vérifier que la réservation est bien COMPLETED ou CANCELLED avant suppression
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    if (booking.status !== "COMPLETED" && booking.status !== "CANCELLED") {
      return NextResponse.json({ error: "Seules les réservations terminées ou annulées peuvent être supprimées" }, { status: 403 });
    }

    await prisma.booking.delete({
      where: { id: bookingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Bookings API DELETE] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}