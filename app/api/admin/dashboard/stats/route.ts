// app/api/admin/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // 1. REVENUS MENSUELS
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const lastMonth = new Date(currentMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const currentMonthPayments = await prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: currentMonth } },
      _sum: { amount: true },
    });

    const lastMonthPayments = await prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: lastMonth, lt: currentMonth } },
      _sum: { amount: true },
    });

    const monthlyRevenue = currentMonthPayments._sum.amount || 0;
    const lastMonthRevenue = lastMonthPayments._sum.amount || 0;
    const revenueGrowth =
      lastMonthRevenue > 0
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 12.4;

    // 2. CROISSANCE UTILISATEURS
    const currentMonthUsers = await prisma.user.count({
      where: { createdAt: { gte: currentMonth } },
    });

    const lastMonthUsers = await prisma.user.count({
      where: { createdAt: { gte: lastMonth, lt: currentMonth } },
    });

    const userGrowth =
      lastMonthUsers > 0
        ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
        : 8;

    const totalUsers = await prisma.user.count();

    // 3. TAUX D'OCCUPATION
    const totalListings = await prisma.listing.count({
      where: { status: "ACTIVE" },
    });

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const activeBookings = await prisma.booking.count({
      where: {
        status: { in: ["CONFIRMED", "PAID"] },
        checkIn: { lte: thirtyDaysFromNow },
        checkOut: { gte: new Date() },
      },
    });

    const occupancyRate =
      totalListings > 0 ? (activeBookings / (totalListings * 30)) * 100 : 78.5;

    // 4. LITIGES ACTIFS
    const activeDisputes = await prisma.dispute.count({
      where: { status: { in: ["OPEN", "IN_REVIEW"] } },
    });

    const highSeverityDisputes = await prisma.dispute.count({
      where: { status: { in: ["OPEN", "IN_REVIEW"] }, priority: "HIGH" },
    });

    // 5. ANALYSE FINANCIÈRE (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyStats = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(sixMonthsAgo);
      monthStart.setMonth(monthStart.getMonth() + i);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const revenue = await prisma.payment.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
      });

      const revAmount = revenue._sum.amount || 0;
      const commissions = revAmount * 0.05;
      const netProfit = revAmount - commissions;

      monthlyStats.push({
        month: monthStart.toLocaleString("fr-FR", { month: "short" }),
        revenue: Math.round(revAmount),
        commissions: Math.round(commissions),
        netProfit: Math.round(netProfit),
      });
    }

    // 6. PARTS DE MARCHÉ PAR TYPE
    const listingsByType = await prisma.listing.groupBy({
      by: ["type"],
      _count: true,
      where: { status: "ACTIVE" },
    });

    const totalActiveListings =
      listingsByType.reduce((sum, l) => sum + l._count, 0) || 1;
    let apartments = 0,
      villas = 0,
      studios = 0,
      other = 0;

    for (const item of listingsByType) {
      const percentage = (item._count / totalActiveListings) * 100;
      if (item.type === "APARTMENT") apartments = percentage;
      else if (item.type === "VILLA") villas = percentage;
      else if (item.type === "STUDIO") studios = percentage;
      else other += percentage;
    }

    // 7. TENDANCES RÉSERVATIONS (12 mois)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const bookingTrends = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(twelveMonthsAgo);
      monthStart.setMonth(monthStart.getMonth() + i);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const confirmed = await prisma.booking.count({
        where: {
          status: { in: ["CONFIRMED", "COMPLETED", "PAID"] },
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      });

      const cancelled = await prisma.booking.count({
        where: {
          status: "CANCELLED",
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      });

      bookingTrends.push({
        month: monthStart.toLocaleString("fr-FR", { month: "short" }),
        confirmed,
        cancelled,
      });
    }

    // 8. DÉMOGRAPHIE LOCATAIRES
    const tenants = await prisma.user.findMany({
      where: { role: "TENANT" },
      select: { profession: true },
    });

    let professionals = 0,
      students = 0,
      families = 0;
    for (const tenant of tenants) {
      const profession = tenant.profession?.toLowerCase() || "";
      if (profession.includes("étudiant") || profession.includes("student"))
        students++;
      else if (
        profession.includes("professionnel") ||
        profession.includes("cadre") ||
        profession.includes("ingénieur")
      )
        professionals++;
      else families++;
    }

    const totalTenants = tenants.length || 1;
    const tenantDemographics = {
      professionals: Math.round((professionals / totalTenants) * 100),
      students: Math.round((students / totalTenants) * 100),
      families: Math.round((families / totalTenants) * 100),
    };

    // 9. RÉPARTITION PAR GOUVERNORAT (CORRIGÉ)
    const listingsByGovernorateRaw = await prisma.listing.groupBy({
      by: ["governorate"],
      _count: true,
      where: { status: "ACTIVE" },
    });

    // Trier et prendre les 5 premiers
    const topGovernorates = listingsByGovernorateRaw
      .sort((a, b) => b._count - a._count)
      .slice(0, 5)
      .map((g) => ({
        name: g.governorate,
        percentage: Math.round((g._count / totalActiveListings) * 100),
      }));

    // 10. TOP HÔTES PERFORMANTS
    const topHostsData = await prisma.user.findMany({
      where: { role: "PROPERTY_OWNER" },
      include: {
        listings: {
          where: { status: "ACTIVE" },
          include: { bookings: { where: { status: "CONFIRMED" } } },
        },
      },
      take: 5,
    });

    const topHosts = topHostsData
      .map((host) => {
        const totalBookingsCount = host.listings.reduce(
          (sum, l) => sum + l.bookings.length,
          0,
        );
        const conversionRate =
          host.listings.length > 0
            ? Math.round((totalBookingsCount / host.listings.length) * 100)
            : 0;
        return {
          name:
            `${host.firstName || ""} ${host.lastName || ""}`.trim() ||
            "Anonyme",
          conversion: conversionRate,
          listings: host.listings.length,
          avatar: host.profilePictureUrl,
        };
      })
      .sort((a, b) => b.conversion - a.conversion)
      .slice(0, 3);

    // 11. VÉRIFICATIONS EN ATTENTE
    const pendingVerifications = await prisma.verificationRequest.count({
      where: { status: "PENDING" },
    });

    // RÉPONSE FINALE
    return NextResponse.json({
      revenue: {
        monthly: Math.round(monthlyRevenue),
        growth: Math.abs(revenueGrowth),
        chart: monthlyStats,
      },
      users: {
        total: totalUsers,
        newThisMonth: currentMonthUsers,
        growth: Math.abs(userGrowth),
      },
      occupancy: {
        rate: Math.min(100, Math.max(0, Math.round(occupancyRate))),
        totalListings: totalListings,
        activeBookings: activeBookings,
      },
      disputes: {
        active: activeDisputes,
        highSeverity: highSeverityDisputes,
        change: -2,
      },
      marketShare: {
        apartments: Math.round(apartments),
        villas: Math.round(villas),
        studios: Math.round(studios),
        other: Math.round(other),
      },
      bookingTrends,
      tenantDemographics,
      topGovernorates,
      topHosts,
      pendingVerifications,
      totalRevenue: Math.round(
        monthlyStats.reduce((sum, m) => sum + m.revenue, 0),
      ),
      totalBookings: bookingTrends.reduce((sum, m) => sum + m.confirmed, 0),
    });
  } catch (error) {
    console.error("Erreur dashboard stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
