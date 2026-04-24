// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const whereClause: any = {};

    if (role === "tenant") {
      whereClause.tenantId = user.id;
    } else if (role === "owner") {
      whereClause.ownerId = user.id;
    } else {
      whereClause.OR = [{ tenantId: user.id }, { ownerId: user.id }];
    }

    if (status && status !== "ALL") {
      const statusList = status.split(",");
      whereClause.status = { in: statusList };
    }

    const skip = (page - 1) * pageSize;

    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              type: true,
              governorate: true,
              delegation: true,
              photos: {
                take: 1,
                where: { isMain: true },
                select: { url: true },
              },
            },
          },
          owner: {
            select: {
              id: true,
              username: true, // On garde le username
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
              isIdentityVerified: true,
              stats: {
                select: { averageRating: true, totalReviews: true },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              username: true, // On garde le username
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
              isIdentityVerified: true,
              stats: {
                select: { reliabilityScore: true },
              },
            },
          },
          offer: {
            select: {
              id: true,
              totalPrice: true,
              status: true,
            },
          },
          payments: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { status: true, paidAt: true },
          },
          review: {
            select: { id: true, rating: true, comment: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.booking.count({ where: whereClause }),
    ]);

    const formattedBookings = bookings.map((booking) => {
      const isPaid =
        booking.paymentStatus === "PAID" ||
        booking.payments.some((p) => p.status === "PAID");

      const location = [booking.listing.governorate, booking.listing.delegation]
        .filter(Boolean)
        .join(", ");

      return {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.totalNights,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        pricePerNight: booking.pricePerNight,
        cleaningFee: booking.cleaningFee || 0,
        serviceFee: booking.serviceFee || 0,
        isPaid,
        hasReview: !!booking.review,
        reviewRating: booking.review?.rating,
        tenantMessage: booking.tenantMessage,
        createdAt: booking.createdAt,
        confirmedAt: booking.confirmedAt,
        cancelledAt: booking.cancelledAt,
        tenant: {
          id: booking.tenant?.id,
          username: booking.tenant?.username || null, // AJOUTÉ
          name: booking.tenant?.username || "Locataire", // MODIFIÉ: utilise username
          firstName: booking.tenant?.firstName,
          lastName: booking.tenant?.lastName,
          image: booking.tenant?.profilePictureUrl || null,
          score: booking.tenant?.stats?.reliabilityScore,
          isVerified: booking.tenant?.isIdentityVerified,
        },
        owner: {
          id: booking.owner?.id,
          username: booking.owner?.username || null, // AJOUTÉ
          name: booking.owner?.username || "Hôte", // MODIFIÉ: utilise username
          firstName: booking.owner?.firstName,
          lastName: booking.owner?.lastName,
          image: booking.owner?.profilePictureUrl || null,
          rating: booking.owner?.stats?.averageRating,
          isVerified: booking.owner?.isIdentityVerified,
        },
        listing: {
          id: booking.listing.id,
          title: booking.listing.title,
          type: booking.listing.type,
          location: location || "Emplacement non spécifié",
          image: booking.listing.photos[0]?.url || null,
        },
        conversationId: undefined,
        bookingOfferId: booking.offerId || undefined,
      };
    });

    console.log(`📊 ${formattedBookings.length} réservations chargées`);

    return NextResponse.json({
      bookings: formattedBookings,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/bookings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
