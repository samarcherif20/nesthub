import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. KPI PRINCIPAUX
    const totalUsers = await prisma.user.count();
    const activeListings = await prisma.listing.count({
      where: { status: "ACTIVE" },
    });
    const totalBookings = await prisma.booking.count();

    const platformRevenue = await prisma.payment.aggregate({
      where: { status: "PAID", type: "commission" },
      _sum: { amount: true },
    });

    const pendingVerifications = await prisma.verificationRequest.count({
      where: { status: "PENDING" },
    });

    const openDisputes = await prisma.dispute.count({
      where: { status: "OPEN" },
    });
    const openReports = await prisma.userReport.count({
      where: { status: "PENDING" },
    });

    const activeUsers24h = await prisma.userLoginHistory.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    // 2. CALCUL DES CROISSANCES
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const usersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: currentMonthStart } },
    });
    const usersLastMonth = await prisma.user.count({
      where: { createdAt: { gte: lastMonthStart, lt: currentMonthStart } },
    });
    const usersGrowth =
      usersLastMonth === 0
        ? 0
        : ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100;

    const listingsThisMonth = await prisma.listing.count({
      where: { createdAt: { gte: currentMonthStart }, status: "ACTIVE" },
    });
    const listingsLastMonth = await prisma.listing.count({
      where: {
        createdAt: { gte: lastMonthStart, lt: currentMonthStart },
        status: "ACTIVE",
      },
    });
    const listingsGrowth =
      listingsLastMonth === 0
        ? 0
        : ((listingsThisMonth - listingsLastMonth) / listingsLastMonth) * 100;

    const bookingsThisMonth = await prisma.booking.count({
      where: { createdAt: { gte: currentMonthStart } },
    });
    const bookingsLastMonth = await prisma.booking.count({
      where: { createdAt: { gte: lastMonthStart, lt: currentMonthStart } },
    });
    const bookingsGrowth =
      bookingsLastMonth === 0
        ? 0
        : ((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100;

    const revenueThisMonth = await prisma.payment.aggregate({
      where: {
        status: "PAID",
        type: "commission",
        paidAt: { gte: currentMonthStart },
      },
      _sum: { amount: true },
    });
    const revenueLastMonth = await prisma.payment.aggregate({
      where: {
        status: "PAID",
        type: "commission",
        paidAt: { gte: lastMonthStart, lt: currentMonthStart },
      },
      _sum: { amount: true },
    });
    const revenueGrowth =
      revenueLastMonth._sum.amount === 0
        ? 0
        : ((revenueThisMonth._sum.amount - revenueLastMonth._sum.amount) /
            revenueLastMonth._sum.amount) *
          100;

    // 3. RÉPARTITION UTILISATEURS
    const [tenants, owners, both, coHosts, admins] = await Promise.all([
      prisma.user.count({ where: { role: "TENANT" } }),
      prisma.user.count({ where: { role: "PROPERTY_OWNER" } }),
      prisma.user.count({ where: { role: "BOTH" } }),
      prisma.user.count({ where: { role: "CO_HOST" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ]);

    // 4. STATUT DES COMPTES
    const [active, pending, suspended, locked, banned, inactive] =
      await Promise.all([
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.user.count({ where: { status: "PENDING_VALIDATION" } }),
        prisma.user.count({ where: { status: "TEMPORARILY_SUSPENDED" } }),
        prisma.user.count({ where: { status: "SECURITY_LOCKED" } }),
        prisma.user.count({ where: { status: "PERMANENTLY_BANNED" } }),
        prisma.user.count({ where: { status: "INACTIVE" } }),
      ]);

    // 5. REVENUS PAR MOIS (12 derniers mois)
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleString("fr", { month: "short" }),
      };
    }).reverse();

    const revenueByMonth = await Promise.all(
      last12Months.map(async ({ month, year, label }) => {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);

        const commissions = await prisma.payment.aggregate({
          where: {
            status: "PAID",
            type: "commission",
            paidAt: { gte: start, lte: end },
          },
          _sum: { amount: true },
        });

        const payouts = await prisma.payment.aggregate({
          where: {
            status: "PAID",
            type: "payout",
            paidAt: { gte: start, lte: end },
          },
          _sum: { amount: true },
        });

        const refunds = await prisma.payment.aggregate({
          where: {
            status: "REFUNDED",
            type: "commission",
            paidAt: { gte: start, lte: end },
          },
          _sum: { amount: true },
        });

        return {
          label,
          commissions: commissions._sum.amount || 0,
          payouts: payouts._sum.amount || 0,
          refunds: refunds._sum.amount || 0,
        };
      }),
    );

    // 6. TENDANCES DES RÉSERVATIONS (12 dernières semaines)
    const last12Weeks = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      return d;
    }).reverse();

    const bookingTrends = await Promise.all(
      last12Weeks.map(async (weekStart) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const [completed, cancelled, pending] = await Promise.all([
          prisma.booking.count({
            where: {
              status: "COMPLETED",
              createdAt: { gte: weekStart, lte: weekEnd },
            },
          }),
          prisma.booking.count({
            where: {
              status: "CANCELLED",
              createdAt: { gte: weekStart, lte: weekEnd },
            },
          }),
          prisma.booking.count({
            where: {
              status: "PENDING",
              createdAt: { gte: weekStart, lte: weekEnd },
            },
          }),
        ]);

        return { completed, cancelled, pending };
      }),
    );

    // 7. UTILISATEURS RÉCENTS
    const recentUsers = await prisma.user.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        riskScore: true,
        profilePictureUrl: true,
        isIdentityVerified: true,
        createdAt: true,
        stats: {
          select: {
            trustLabel: true,
            trustBadge: true,
          },
        },
      },
    });

    // 8. FILE DE VÉRIFICATION (Identités)
    const verificationQueueIdentities =
      await prisma.verificationRequest.findMany({
        where: { status: "PENDING" },
        take: 5,
        orderBy: { submittedAt: "desc" },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

    // 8bis. LISTINGS EN ATTENTE DE VALIDATION (Propriétés)
    const pendingListings = await prisma.listing.findMany({
      where: { status: "PENDING_REVIEW" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdAt: true,
      },
    });

    // Fusionner les deux files d'attente
    const combinedQueue = [
      // Vérifications d'identité
      ...verificationQueueIdentities.map((v) => ({
        id: v.id,
        userId: v.userId,
        listingId: null,
        userName:
          `${v.user.firstName || ""} ${v.user.lastName || ""}`.trim() ||
          v.user.email,
        type: "identity",
        urgency:
          v.confidenceScore && v.confidenceScore < 50 ? "high" : "normal",
        submittedAt: v.submittedAt,
      })),
      // Vérifications de propriétés (listings)
      ...pendingListings.map((l) => ({
        id: l.id,
        userId: l.owner.id,
        listingId: l.id,
        userName: l.title,
        type: "property",
        urgency: "normal",
        submittedAt: l.createdAt,
      })),
    ];

    // Trier par date (plus récent en premier)
    combinedQueue.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );

    // Prendre les 5 plus récents
    const finalVerificationQueue = combinedQueue.slice(0, 5);

    // 9. LITIGES OUVERTS
    const disputes = await prisma.dispute.findMany({
      where: { status: "OPEN" },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        booking: { select: { reference: true } },
      },
    });

    // 10. SIGNALEMENTS
    const reports = await prisma.userReport.findMany({
      where: { status: "PENDING" },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reportedUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // 11. AUDIT LOGS
    const auditLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { email: true } },
      },
    });

    // 12. STATUT DES ANNONCES
    const [
      listingActive,
      listingPending,
      listingDraft,
      listingSuspended,
      listingRejected,
    ] = await Promise.all([
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.listing.count({ where: { status: "DRAFT" } }),
      prisma.listing.count({ where: { status: "SUSPENDED" } }),
      prisma.listing.count({ where: { status: "REJECTED" } }),
    ]);

    // 13. TOP GOUVERNORATS
    const topGovernorates = await prisma.listing.groupBy({
      by: ["governorate"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    });

    const governoratesWithRevenue = await Promise.all(
      topGovernorates.map(async (g) => {
        const listings = await prisma.listing.findMany({
          where: { governorate: g.governorate },
          select: { id: true },
        });

        const bookings = await prisma.booking.count({
          where: { listingId: { in: listings.map((l) => l.id) } },
        });

        return {
          name: g.governorate,
          revenue: bookings * 100,
          bookings: g._count.id,
        };
      }),
    );

    // 14. RADAR METRICS
    const radarMetrics = {
      currentUsers: await prisma.user.count({
        where: { createdAt: { gte: currentMonthStart } },
      }),
      previousUsers: await prisma.user.count({
        where: { createdAt: { gte: lastMonthStart, lt: currentMonthStart } },
      }),
      currentListings: await prisma.listing.count({
        where: { createdAt: { gte: currentMonthStart }, status: "ACTIVE" },
      }),
      previousListings: await prisma.listing.count({
        where: {
          createdAt: { gte: lastMonthStart, lt: currentMonthStart },
          status: "ACTIVE",
        },
      }),
      currentBookings: await prisma.booking.count({
        where: { createdAt: { gte: currentMonthStart } },
      }),
      previousBookings: await prisma.booking.count({
        where: { createdAt: { gte: lastMonthStart, lt: currentMonthStart } },
      }),
      currentRevenue:
        (
          await prisma.payment.aggregate({
            where: {
              status: "PAID",
              type: "commission",
              paidAt: { gte: currentMonthStart },
            },
            _sum: { amount: true },
          })
        )._sum.amount || 0,
      previousRevenue:
        (
          await prisma.payment.aggregate({
            where: {
              status: "PAID",
              type: "commission",
              paidAt: { gte: lastMonthStart, lt: currentMonthStart },
            },
            _sum: { amount: true },
          })
        )._sum.amount || 0,
      currentTrust: 88,
      previousTrust: 72,
      currentConversion: 68,
      previousConversion: 55,
    };

    // 15. RINGS DATA
    const activeListingsCount = await prisma.listing.count({
      where: { status: "ACTIVE" },
    });
    const totalBookableDays = activeListingsCount * 30;
    const occupiedDays = await prisma.booking.count({
      where: {
        status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "COMPLETED"] },
        checkIn: { lte: new Date() },
        checkOut: { gte: new Date(new Date().setDate(1)) },
      },
    });
    const occupationRate =
      totalBookableDays > 0
        ? Math.round((occupiedDays / totalBookableDays) * 100)
        : 0;

    const averageRating = await prisma.review.aggregate({
      _avg: { rating: true },
    });
    const satisfactionRate = Math.round((averageRating._avg.rating || 0) * 20);

    const pendingReviews = await prisma.listing.count({
      where: { status: "PENDING_REVIEW" },
    });
    const activeListingsTotal = await prisma.listing.count({
      where: { status: "ACTIVE" },
    });
    const activityRate =
      activeListingsTotal > 0
        ? Math.round(
            (activeListingsTotal / (activeListingsTotal + pendingReviews)) *
              100,
          )
        : 0;

    const activeAccounts = await prisma.user.count({
      where: { status: "ACTIVE" },
    });
    const totalAccounts = await prisma.user.count();
    const healthRate =
      totalAccounts > 0
        ? Math.round((activeAccounts / totalAccounts) * 100)
        : 0;

    const ringsData = {
      occupation: occupationRate,
      satisfaction: satisfactionRate,
      activity: activityRate,
      health: healthRate,
    };

    // 16. SPARKLINE DATA
    const last12MonthsSpark = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d;
    }).reverse();

    const sparklineData = await (async () => {
      const users = [];
      const listings = [];
      const bookings = [];
      const revenues = [];

      for (const month of last12MonthsSpark) {
        const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        users.push(
          await prisma.user.count({ where: { createdAt: { lte: end } } }),
        );
        listings.push(
          await prisma.listing.count({
            where: { createdAt: { lte: end }, status: "ACTIVE" },
          }),
        );
        bookings.push(
          await prisma.booking.count({ where: { createdAt: { lte: end } } }),
        );

        const revenue = await prisma.payment.aggregate({
          where: { status: "PAID", type: "commission", paidAt: { lte: end } },
          _sum: { amount: true },
        });
        revenues.push(revenue._sum.amount || 0);
      }

      return {
        totalUsers: users,
        activeListings: listings,
        bookings: bookings,
        revenue: revenues,
      };
    })();

    // RÉPONSE FINALE COMPLÈTE
    return NextResponse.json({
      kpi: {
        totalUsers,
        usersGrowth: Math.round(usersGrowth * 10) / 10,
        activeListings,
        listingsGrowth: Math.round(listingsGrowth * 10) / 10,
        totalBookings,
        bookingsGrowth: Math.round(bookingsGrowth * 10) / 10,
        platformRevenue: platformRevenue._sum.amount || 0,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        pendingVerifications,
        openDisputes,
        openReports,
        activeUsers24h,
      },
      userDistribution: { tenants, owners, both, coHosts, admins },
      accountStatus: { active, pending, suspended, locked, banned, inactive },
      revenue: {
        labels: revenueByMonth.map((r) => r.label),
        commissions: revenueByMonth.map((r) => r.commissions),
        payouts: revenueByMonth.map((r) => r.payouts),
        refunds: revenueByMonth.map((r) => r.refunds),
      },
      bookingTrend: {
        labels: bookingTrends.map((_, i) => `Sem ${i + 1}`),
        completed: bookingTrends.map((b) => b.completed),
        cancelled: bookingTrends.map((b) => b.cancelled),
        pending: bookingTrends.map((b) => b.pending),
      },
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        email: user.email,
        role: user.role,
        status: user.status,
        riskScore: user.riskScore || 50,
        trustLabel: user.stats?.trustLabel || "Neutre",
        trustBadge: user.stats?.trustBadge || "gray",
        isVerified: user.isIdentityVerified,
        profilePictureUrl: user.profilePictureUrl,
        joinedAt: user.createdAt.toISOString().split("T")[0],
      })),
      verificationQueue: finalVerificationQueue.map((v) => ({
        id: v.id,
        userId: v.userId,
        listingId: v.listingId,
        userName: v.userName,
        type: v.type,
        urgency: v.urgency,
        submittedAt: `Il y a ${Math.floor((Date.now() - new Date(v.submittedAt).getTime()) / (1000 * 60 * 60))}h`,
      })),
      disputes: disputes.map((d) => ({
        id: d.id,
        bookingRef: d.booking?.reference || "N/A",
        type: d.type,
        description: d.description.slice(0, 50),
        priority: d.priority,
      })),
      reports: reports.map((r) => ({
        id: r.id,
        reporter:
          `${r.reporter.firstName || ""} ${r.reporter.lastName || ""}`.trim() ||
          r.reporter.email,
        reported:
          `${r.reportedUser.firstName || ""} ${r.reportedUser.lastName || ""}`.trim() ||
          r.reportedUser.email,
        reason: r.reason,
        priority: r.priority,
      })),
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        admin: log.admin?.email?.split("@")[0] || "Admin",
        action: log.action,
        target: log.targetId,
        details:
          typeof log.details === "object"
            ? JSON.stringify(log.details)
            : (log.details as string) || log.action,
        createdAt: new Date(log.createdAt).toLocaleTimeString("fr", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
      listingStatus: {
        active: listingActive,
        pending: listingPending,
        draft: listingDraft,
        suspended: listingSuspended,
        rejected: listingRejected,
      },
      topGovernorates: governoratesWithRevenue,
      radarMetrics,
      ringsData,
      sparklineData,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
