import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// ============================================
// TYPES
// ============================================

interface ListingPerformance {
  id: string;
  title: string;
  views: number;
  bookings: number;
  revenue: number;
  growth: number;
  occupancy: number;
  rating: number;
}

interface UpcomingPayment {
  day: number;
  title: string;
  amount: number;
  date: string;
  status: string;
}

interface TodoTask {
  title: string;
  property: string;
  urgent: boolean;
  done: boolean;
}

interface ActivityItem {
  type: "booking" | "review" | "payment" | "message";
  title: string;
  detail: string;
  time: string;
}

interface CityStats {
  name: string;
  revenue: number;
  bookings: number;
  percentage: number;
}

interface WeeklyDataPoint {
  label: string;
  views: number;
  bookings: number;
  revenue: number;
}

// ============================================
// FONCTION UTILITAIRE
// ============================================

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `il y a ${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

// ============================================
// API ROUTE
// ============================================

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur connecté
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { stats: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const ownerId = user.id;
    const currentYear = new Date().getFullYear();

    // ============================================
    // RÉCUPÉRATION DES DONNÉES
    // ============================================

    // Récupérer toutes les annonces du propriétaire
    const listings = await prisma.listing.findMany({
      where: { ownerId, status: { not: "ARCHIVED" } },
      include: {
        photos: { take: 1 },
        stats: { orderBy: { date: "desc" }, take: 30 },
      },
    });

    // Récupérer toutes les réservations du propriétaire
    const allBookings = await prisma.booking.findMany({
      where: { ownerId },
      include: {
        listing: true,
        review: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const completedBookings = allBookings.filter(
      (b) => b.status === "COMPLETED",
    );
    const confirmedBookings = allBookings.filter(
      (b) => b.status === "CONFIRMED",
    );

    // ============================================
    // CALCUL DES DATES POUR LES CROISSANCES
    // ============================================

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ============================================
    // 1. REVENUS TOTAUX ET CROISSANCE
    // ============================================

    const totalRevenue = allBookings
      .filter((b) => b.status === "COMPLETED" || b.status === "CONFIRMED")
      .reduce((sum, b) => sum + b.totalWithFees, 0);

    const lastMonthRevenue = allBookings
      .filter((b) => {
        const date = new Date(b.createdAt);
        return (
          (b.status === "COMPLETED" || b.status === "CONFIRMED") &&
          date >= lastMonth &&
          date < thisMonthStart
        );
      })
      .reduce((sum, b) => sum + b.totalWithFees, 0);

    const previousMonthRevenue = allBookings
      .filter((b) => {
        const date = new Date(b.createdAt);
        return (
          (b.status === "COMPLETED" || b.status === "CONFIRMED") &&
          date >= twoMonthsAgo &&
          date < lastMonth
        );
      })
      .reduce((sum, b) => sum + b.totalWithFees, 0);

    const revenueGrowth =
      previousMonthRevenue > 0
        ? ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
          100
        : 0;

    // ============================================
    // 2. TAUX D'OCCUPATION ET CROISSANCE
    // ============================================

    const totalNightsBooked = allBookings
      .filter((b) => b.status !== "CANCELLED")
      .reduce((sum, b) => sum + b.totalNights, 0);

    const totalAvailableNights = listings.reduce((sum, l) => {
      const daysSinceCreation = Math.floor(
        (Date.now() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      return sum + daysSinceCreation * (l.rooms || 1);
    }, 0);

    const occupancyRate =
      totalAvailableNights > 0
        ? (totalNightsBooked / totalAvailableNights) * 100
        : 0;

    const lastMonthNights = allBookings
      .filter((b) => {
        const date = new Date(b.createdAt);
        return (
          b.status !== "CANCELLED" && date >= lastMonth && date < thisMonthStart
        );
      })
      .reduce((sum, b) => sum + b.totalNights, 0);

    const previousMonthNights = allBookings
      .filter((b) => {
        const date = new Date(b.createdAt);
        return (
          b.status !== "CANCELLED" && date >= twoMonthsAgo && date < lastMonth
        );
      })
      .reduce((sum, b) => sum + b.totalNights, 0);

    const occupancyGrowth =
      previousMonthNights > 0
        ? ((lastMonthNights - previousMonthNights) / previousMonthNights) * 100
        : 0;

    // ============================================
    // 3. RÉSERVATIONS ET CROISSANCE
    // ============================================

    const totalBookings = allBookings.length;

    const lastMonthBookings = allBookings.filter((b) => {
      const date = new Date(b.createdAt);
      return date >= lastMonth && date < thisMonthStart;
    }).length;

    const previousMonthBookings = allBookings.filter((b) => {
      const date = new Date(b.createdAt);
      return date >= twoMonthsAgo && date < lastMonth;
    }).length;

    const bookingsGrowth =
      previousMonthBookings > 0
        ? ((lastMonthBookings - previousMonthBookings) /
            previousMonthBookings) *
          100
        : 0;

    // ============================================
    // 4. NOTE MOYENNE
    // ============================================

    const allReviews = allBookings.filter((b) => b.review).map((b) => b.review);
    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + (r?.rating || 0), 0) /
          allReviews.length
        : 0;

    // ============================================
    // 5. PRIX MOYEN PAR NUIT ET CROISSANCE
    // ============================================

    const avgDailyRate =
      completedBookings.length > 0
        ? completedBookings.reduce((sum, b) => sum + b.pricePerNight, 0) /
          completedBookings.length
        : 0;

    const lastMonthCompleted = completedBookings.filter((b) => {
      const date = new Date(b.createdAt);
      return date >= lastMonth && date < thisMonthStart;
    });
    const previousMonthCompleted = completedBookings.filter((b) => {
      const date = new Date(b.createdAt);
      return date >= twoMonthsAgo && date < lastMonth;
    });

    const lastMonthAvgRate =
      lastMonthCompleted.length > 0
        ? lastMonthCompleted.reduce((sum, b) => sum + b.pricePerNight, 0) /
          lastMonthCompleted.length
        : avgDailyRate;

    const previousMonthAvgRate =
      previousMonthCompleted.length > 0
        ? previousMonthCompleted.reduce((sum, b) => sum + b.pricePerNight, 0) /
          previousMonthCompleted.length
        : avgDailyRate;

    const avgDailyRateGrowth =
      previousMonthAvgRate > 0
        ? ((lastMonthAvgRate - previousMonthAvgRate) / previousMonthAvgRate) *
          100
        : 0;

    // ============================================
    // 6. REVENUS MENSUELS (12 derniers mois)
    // ============================================

    const monthlyRevenue: number[] = [];
    const previousYearRevenue: number[] = [];
    const months = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Juin",
      "Juil",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];

    for (let i = 0; i < 12; i++) {
      const revenue = allBookings
        .filter((b) => {
          const date = new Date(b.createdAt);
          return (
            date.getMonth() === i &&
            date.getFullYear() === currentYear &&
            (b.status === "COMPLETED" || b.status === "CONFIRMED")
          );
        })
        .reduce((sum, b) => sum + b.totalWithFees, 0);
      monthlyRevenue.push(revenue);

      const prevRevenue = allBookings
        .filter((b) => {
          const date = new Date(b.createdAt);
          return (
            date.getMonth() === i &&
            date.getFullYear() === currentYear - 1 &&
            (b.status === "COMPLETED" || b.status === "CONFIRMED")
          );
        })
        .reduce((sum, b) => sum + b.totalWithFees, 0);
      previousYearRevenue.push(prevRevenue);
    }

    // ============================================
    // 7. TYPES DE VOYAGEURS
    // ============================================

    const tenantIds = allBookings.map((b) => b.tenantId);
    const tenants = await prisma.user.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, profession: true },
    });

    const tenantProfessions = new Map(tenants.map((t) => [t.id, t.profession]));

    let professionalCount = 0;
    let studentCount = 0;
    let longStayCount = 0;
    let shortStayCount = 0;
    let standardStayCount = 0;

    const studentKeywords = [
      "طالب",
      "طالبة",
      "étudiant",
      "student",
      "متدرج",
      "متربص",
    ];

    for (const booking of allBookings) {
      const profession = tenantProfessions.get(booking.tenantId) || "";
      const nights = booking.totalNights;
      const professionLower = profession.toLowerCase();

      const isStudent = studentKeywords.some((keyword) =>
        professionLower.includes(keyword),
      );

      if (isStudent) {
        studentCount++;
      } else if (profession && profession.trim() !== "") {
        professionalCount++;
      } else if (nights > 7) {
        longStayCount++;
      } else if (nights <= 3) {
        shortStayCount++;
      } else {
        standardStayCount++;
      }
    }

    const totalCounts =
      professionalCount +
      studentCount +
      longStayCount +
      shortStayCount +
      standardStayCount;

    const travelerTypes = {
      professional:
        totalCounts > 0
          ? Math.round((professionalCount / totalCounts) * 100)
          : 0,
      student:
        totalCounts > 0 ? Math.round((studentCount / totalCounts) * 100) : 0,
      longStay:
        totalCounts > 0 ? Math.round((longStayCount / totalCounts) * 100) : 0,
      shortStay:
        totalCounts > 0 ? Math.round((shortStayCount / totalCounts) * 100) : 0,
      standardStay:
        totalCounts > 0
          ? Math.round((standardStayCount / totalCounts) * 100)
          : 0,
    };

// ============================================
// 8. PERFORMANCE PAR ANNONCE
// ============================================

const listingsPerformance = await Promise.all(
  listings.map(async (listing) => {
    const listingBookings = allBookings.filter(
      (b) => b.listingId === listing.id,
    );
    const completed = listingBookings.filter(
      (b) => b.status === "COMPLETED",
    );
    const revenue = completed.reduce((sum, b) => sum + b.totalWithFees, 0);
    const avgRating =
      completed
        .filter((b) => b.review)
        .reduce((sum, b) => sum + (b.review?.rating || 0), 0) /
      (completed.filter((b) => b.review).length || 1);

    const lastMonthRevenue = completed
      .filter(
        (b) =>
          new Date(b.createdAt) >= lastMonth &&
          new Date(b.createdAt) < thisMonthStart,
      )
      .reduce((sum, b) => sum + b.totalWithFees, 0);
    const previousMonthRevenue = completed
      .filter(
        (b) =>
          new Date(b.createdAt) >= twoMonthsAgo &&
          new Date(b.createdAt) < lastMonth,
      )
      .reduce((sum, b) => sum + b.totalWithFees, 0);

    const growth =
      previousMonthRevenue > 0
        ? ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
          100
        : 0;

    // ✅ RÉCUPÉRER LA PHOTO PRINCIPALE
    const mainPhoto = listing.photos?.find((p) => p.isMain) ?? listing.photos?.[0];
    const thumbnailUrl = mainPhoto?.url || null;

    return {
      id: listing.id,
      title: listing.title,
      thumbnailUrl: thumbnailUrl,  // ← AJOUTER CETTE LIGNE
      views: listing.viewCount,
      bookings: listingBookings.length,
      revenue: revenue,
      growth: Math.round(growth * 10) / 10,
      occupancy:
        listingBookings.length > 0
          ? (listingBookings.filter((b) => b.status === "COMPLETED").length /
              listingBookings.length) *
            100
          : 0,
      rating: Math.round(avgRating * 10) / 10,
    };
  })
);
    // ============================================
    // 9. PAIEMENTS À VENIR
    // ============================================

    const upcomingPayments: UpcomingPayment[] = confirmedBookings
      .filter((b) => new Date(b.checkIn) > new Date())
      .slice(0, 5)
      .map((b) => ({
        day: new Date(b.checkIn).getDate(),
        title: `${b.listing?.title || "Propriété"} - ${b.totalNights} nuits`,
        amount: b.totalWithFees,
        date: new Date(b.checkIn).toLocaleDateString("fr-FR"),
        status: "confirmed",
      }));

    // ============================================
    // 10. TÂCHES À FAIRE
    // ============================================

    const todoTasks: TodoTask[] = [];
    for (const listing of listings) {
      const photoCount = await prisma.listingMedia.count({
        where: { listingId: listing.id },
      });

      if (photoCount < 5) {
        todoTasks.push({
          title: "Ajouter plus de photos",
          property: listing.title,
          urgent: photoCount === 0,
          done: false,
        });
      }
      if (!listing.description || listing.description.length < 100) {
        todoTasks.push({
          title: "Compléter la description",
          property: listing.title,
          urgent: false,
          done: false,
        });
      }
      if (listing.status === "DRAFT") {
        todoTasks.push({
          title: "Publier l'annonce",
          property: listing.title,
          urgent: true,
          done: false,
        });
      }
    }

    // ============================================
    // 11. ACTIVITÉ RÉCENTE
    // ============================================

    const recentActivity: ActivityItem[] = [];

    // Dernières réservations
    allBookings.slice(0, 3).forEach((b) => {
      recentActivity.push({
        type: "booking",
        title: "Nouvelle réservation",
        detail: `${b.listing?.title || "Propriété"} - ${b.totalNights} nuits`,
        time: getTimeAgo(new Date(b.createdAt)),
      });
    });

    // Derniers avis
    const recentReviews = allBookings
      .filter((b) => b.review && b.review.createdAt)
      .slice(0, 2);
    recentReviews.forEach((b) => {
      recentActivity.push({
        type: "review",
        title: "Nouvel avis",
        detail: `${b.listing?.title || "Propriété"} - ${b.review?.rating} étoiles`,
        time: getTimeAgo(new Date(b.review!.createdAt)),
      });
    });

    // Derniers paiements
    const recentPayments = allBookings
      .flatMap((b) => b.payments || [])
      .filter((p) => p.createdAt)
      .slice(0, 2);
    recentPayments.forEach((p) => {
      const booking = allBookings.find((b) => b.id === p.bookingId);
      recentActivity.push({
        type: "payment",
        title: "Paiement reçu",
        detail: `${booking?.listing?.title || "Propriété"} - ${p.amount} DT`,
        time: getTimeAgo(new Date(p.createdAt)),
      });
    });

    // ============================================
    // 12. TOP VILLES
    // ============================================

    const cityStats = new Map<string, { revenue: number; bookings: number }>();
    for (const listing of listings) {
      const revenue = allBookings
        .filter(
          (b) =>
            b.listingId === listing.id &&
            (b.status === "COMPLETED" || b.status === "CONFIRMED"),
        )
        .reduce((sum, b) => sum + b.totalWithFees, 0);

      if (!cityStats.has(listing.governorate)) {
        cityStats.set(listing.governorate, { revenue: 0, bookings: 0 });
      }
      const stats = cityStats.get(listing.governorate)!;
      stats.revenue += revenue;
      stats.bookings += allBookings.filter(
        (b) => b.listingId === listing.id,
      ).length;
    }

    const topCities: CityStats[] = Array.from(cityStats.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        bookings: data.bookings,
        percentage: 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const totalRevenueAll = topCities.reduce((sum, c) => sum + c.revenue, 0);
    topCities.forEach((city) => {
      city.percentage =
        totalRevenueAll > 0 ? (city.revenue / totalRevenueAll) * 100 : 0;
    });

    // ============================================
    // 13. DONNÉES POUR GRAPHIQUES (14 derniers jours)
    // ============================================

    const last14Days: WeeklyDataPoint[] = [];
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayStr = `${dayNames[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;

      const dayBookings = allBookings.filter((b) => {
        const bDate = new Date(b.createdAt);
        bDate.setHours(0, 0, 0, 0);
        return bDate.getTime() === date.getTime();
      });

      let dayViews = 0;
      for (const listing of listings) {
        const stat = await prisma.listingStats.findFirst({
          where: {
            listingId: listing.id,
            date: {
              gte: date,
              lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        });
        if (stat) dayViews += stat.views;
      }

      last14Days.push({
        label: dayStr,
        views: dayViews,
        bookings: dayBookings.length,
        revenue: dayBookings.reduce((sum, b) => sum + b.totalWithFees, 0),
      });
    }

    // ============================================
    // RÉPONSE FINALE
    // ============================================

    return NextResponse.json({
      kpi: {
        totalRevenue,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        occupancyRate: Math.round(occupancyRate),
        occupancyGrowth: Math.round(occupancyGrowth * 10) / 10,
        totalBookings,
        bookingsGrowth: Math.round(bookingsGrowth * 10) / 10,
        averageRating: Math.round(averageRating * 10) / 10,
        avgDailyRate: Math.round(avgDailyRate),
        avgDailyRateGrowth: Math.round(avgDailyRateGrowth * 10) / 10,
        totalListings: listings.length,
      },
      monthlyRevenue: {
        labels: months,
        amounts: monthlyRevenue,
        previousAmounts: previousYearRevenue,
      },
      travelerTypes,
      listings: listingsPerformance,
      upcomingPayments,
      todoTasks: todoTasks.slice(0, 4),
      recentActivity: recentActivity.slice(0, 6),
      topCities,
      weeklyData: {
        labels: last14Days.map((d) => d.label),
        views: last14Days.map((d) => d.views),
        bookings: last14Days.map((d) => d.bookings),
        revenue: last14Days.map((d) => d.revenue),
      },
    });
  } catch (error) {
    console.error("Erreur analytics:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
