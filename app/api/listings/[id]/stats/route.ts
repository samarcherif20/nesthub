// app/api/listings/[id]/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id: listingId } = await params;
    const { searchParams } = new URL(request.url);
    
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 });
    }

    if (listing.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const [stats, listingData] = await Promise.all([
      prisma.listingStats.findMany({
        where: {
          listingId,
          date: { gte: startDate },
        },
        orderBy: { date: 'asc' },
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
    const totalClicks = stats.reduce((sum, s) => sum + s.clicks, 0);
    const totalMessages = stats.reduce((sum, s) => sum + s.messages, 0);
    const totalBookings = stats.reduce((sum, s) => sum + s.bookings, 0);
    const totalRevenue = stats.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const conversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;

    const chartData = stats.map(s => ({
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

  } catch (error) {
    console.error('[GET /api/listings/:id/stats] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}