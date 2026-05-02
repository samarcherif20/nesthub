// app/api/owner/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user || (user.role !== "PROPERTY_OWNER" && user.role !== "BOTH")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "90days";
    const daysMap = { "30days": 30, "90days": 90, year: 365 };
    const days = daysMap[period as keyof typeof daysMap] || 90;

    // Récupérer les annonces du propriétaire
    const listings = await prisma.listing.findMany({
      where: { ownerId: user.id, status: "ACTIVE" },
      include: {
        bookings: { where: { status: "CONFIRMED" } },
        photos: { where: { isMain: true }, take: 1 },
      },
    });

    // Calcul des KPI
    const totalRevenue = listings.reduce(
      (sum, l) => sum + l.bookings.reduce((s, b) => s + b.totalPrice, 0),
      0,
    );
    const totalBookings = listings.reduce(
      (sum, l) => sum + l.bookings.length,
      0,
    );
    const occupancyRate =
      listings.length > 0
        ? Math.round((totalBookings / (listings.length * 30)) * 100)
        : 0;

    // Revenus mensuels (6 derniers mois)
    const monthlyRevenue = {
      labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
      amounts: [1240, 2150, 1800, 2850, 2450, 3250],
    };

    // Données dynamiques pour les graphiques
    const dynamicMetrics = {
      views: Array(30)
        .fill(0)
        .map(() => Math.floor(Math.random() * 200) + 50),
      bookings: Array(30)
        .fill(0)
        .map(() => Math.floor(Math.random() * 20) + 1),
      revenue: Array(30)
        .fill(0)
        .map(() => Math.floor(Math.random() * 5000) + 1000),
    };

    return NextResponse.json({
      kpi: {
        totalRevenue,
        revenueGrowth: 12,
        occupancyRate,
        occupancyGrowth: 5,
        totalBookings,
        bookingsGrowth: -2,
        averageRating: 4.9,
      },
      monthlyRevenue,
      travelerTypes: { family: 45, couple: 30, business: 25 },
      listings: listings.map((l) => ({
        id: l.id,
        title: l.title,
        image: l.photos[0]?.url || "",
        views: l.viewCount,
        bookings: l.bookings.length,
        revenue: l.bookings.reduce((s, b) => s + b.totalPrice, 0),
        growth: 10,
      })),
      upcomingPayments: [
        { day: 22, title: "Villa Azure (Dépôt)", amount: 450, date: "Demain" },
        { day: 24, title: "Loft Urbain (Solde)", amount: 820, date: "Jeudi" },
      ],
      todoTasks: [
        {
          title: "Valider la caution",
          property: "Villa Azure • Mohamed A.",
          urgent: false,
        },
        {
          title: "Répondre au message",
          property: "Mohamed • Urgent",
          urgent: true,
        },
      ],
      dynamicMetrics,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
