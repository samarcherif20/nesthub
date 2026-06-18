// app/api/owner/wallet/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const statusFilter = searchParams.get("status") || "all";
    const skip = (page - 1) * limit;

    // Récupérer TOUTES les réservations
    const allBookings = await prisma.booking.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        reference: true,
        totalPrice: true,
        escrowStatus: true,
        paymentStatus: true,
        status: true,
        escrowReleasedAt: true,
        escrowHeldAt: true,
        createdAt: true,
        checkIn: true,
        checkOut: true,
        totalNights: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 🔍 Fonction pour déterminer si une transaction est "payée"
    const isPaid = (b: any) => {
      return b.paymentStatus === "PAID" || 
             b.paymentStatus === "RELEASED" ||
             b.escrowStatus === "RELEASED" ||
             b.escrowStatus === "PAID_MANUALLY" ||
             b.status === "COMPLETED";
    };

    // 🔍 Fonction pour déterminer si une transaction est "en attente"
    const isPending = (b: any) => {
      return b.paymentStatus === "HELD" || 
             b.paymentStatus === "PENDING" ||
             b.escrowStatus === "HELD" ||
             b.escrowStatus === "PENDING" ||
             b.status === "CONFIRMED";
    };

    // Calcul des stats
    const totalEarned = allBookings
      .filter(b => isPaid(b))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const pendingBalance = allBookings
      .filter(b => isPending(b) && !isPaid(b))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // ✅ FILTRAGE selon statusFilter (simplifié)
    let filteredBookings = [...allBookings];
    
    if (statusFilter === "paid") {
      filteredBookings = filteredBookings.filter(b => isPaid(b));
    } else if (statusFilter === "pending") {
      filteredBookings = filteredBookings.filter(b => isPending(b) && !isPaid(b));
    }
    // "all" = toutes

    // Pagination
    const totalCount = filteredBookings.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const paginatedBookings = filteredBookings.slice(skip, skip + limit);

    // Formater les transactions
    const transactions = paginatedBookings.map(booking => {
      const paid = isPaid(booking);
      const pending = isPending(booking) && !paid;
      
      return {
        id: booking.id,
        reference: booking.reference,
        amount: booking.totalPrice,
        nights: booking.totalNights || 1,
        date: booking.checkIn,
        status: paid ? "paid" : "pending",
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalEarned,
        pendingBalance,
        availableBalance: totalEarned,
        totalBookings: allBookings.length,
      },
      transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        pageSize: limit,
      },
    });

  } catch (error) {
    console.error("Erreur wallet stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}