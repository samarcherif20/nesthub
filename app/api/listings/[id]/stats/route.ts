import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/withAuth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(
  async (request: NextRequest, { params }: RouteParams) => {
    const user = (request as any).user;
    const { id: listingId } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [stats, listingData] = await Promise.all([
      prisma.listingStats.findMany({
        where: { listingId, date: { gte: startDate } },
        orderBy: { date: "asc" },
      }),
      prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          viewCount: true,
          bookingCount: true,
          favoriteCount: true,
          conversionRate: true,
        },
      }),
    ]);

    const totalViews = stats.reduce((sum, s) => sum + s.views, 0);
    const totalBookings = stats.reduce((sum, s) => sum + s.bookings, 0);
    const totalRevenue = stats.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const conversionRate =
      totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;

    const chartData = stats.map((s) => ({
      date: s.date,
      views: s.views,
      bookings: s.bookings,
      revenue: s.revenue || 0,
    }));

    return NextResponse.json({
      summary: {
        totalViews: listingData?.viewCount || totalViews,
        totalBookings: listingData?.bookingCount || totalBookings,
        totalFavorites: listingData?.favoriteCount || 0,
        conversionRate: listingData?.conversionRate || conversionRate,
        totalRevenue,
        averageViewsPerDay: days > 0 ? totalViews / days : 0,
      },
      chartData,
      dailyStats: stats,
    });
  },
  {
    requireListingAccess: true,
    requiredPermission: "viewRevenue",
  },
);
