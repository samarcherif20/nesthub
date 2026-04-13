// app/api/users/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface UserStatsResponse {
  stats: {
    reliabilityScore: number;
    totalBookings: number;
    totalListings: number;
    totalReviews: number;
    averageRating: number;
    responseRate: number;
    responseTime: string;
    badges: string[];
    memberSince: string;
    completionRate: number;
  };
}

async function calculateResponseRate(userId: string): Promise<number> {
  // Calculer le taux de réponse aux messages
  const messages = await prisma.bookingMessage.groupBy({
    by: ['bookingId'],
    where: {
      receiverId: userId,
    },
    _count: {
      id: true,
    },
  });

  // Logique simplifiée - à affiner selon les besoins
  return messages.length > 0 ? 95 : 100;
}

async function calculateResponseTime(userId: string): Promise<string> {
  // Calculer le temps de réponse moyen
  // Logique simplifiée
  return '2h';
}

async function calculateCompletionRate(userId: string): Promise<number> {
  // Calculer le taux de complétion du profil
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return 0;

  let completedFields = 0;
  const totalFields = 8;

  if (user.firstName) completedFields++;
  if (user.lastName) completedFields++;
  if (user.phoneNumber && user.phoneVerified) completedFields++;
  if (user.bio && user.bio.length > 20) completedFields++;
  if (user.profilePictureUrl) completedFields++;
  if (user.spokenLanguages && user.spokenLanguages.length > 0) completedFields++;
  if (user.profession) completedFields++;
  if (user.isIdentityVerified) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
}

function getBadges(score: number, userId: string, isVerified: boolean): string[] {
  const badges: string[] = [];
  
  if (score >= 90) {
    badges.push('SUPERHOST');
  }
  if (score >= 75) {
    badges.push('EXPERT');
  }
  if (score >= 50) {
    badges.push('RELIABLE');
  }
  if (isVerified) {
    badges.push('VERIFIED');
  }
  
  return badges;
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        stats: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Compter les avis reçus
    const reviewsAgg = await prisma.review.aggregate({
      where: { targetId: user.id },
      _avg: { rating: true },
      _count: true,
    });

    // Compter les réservations en tant que locataire
    const tenantBookings = await prisma.booking.count({
      where: { tenantId: user.id },
    });

    // Compter les réservations en tant que propriétaire
    const ownerBookings = await prisma.booking.count({
      where: { ownerId: user.id },
    });

    // Compter les annonces
    const listingsCount = await prisma.listing.count({
      where: { ownerId: user.id },
    });

    // Calculer les métriques
    const totalBookings = tenantBookings + ownerBookings;
    const responseRate = await calculateResponseRate(user.id);
    const responseTime = await calculateResponseTime(user.id);
    const completionRate = await calculateCompletionRate(user.id);
    const badges = getBadges(user.stats?.reliabilityScore || 50, user.id, user.isIdentityVerified);

    return NextResponse.json({
      stats: {
        reliabilityScore: user.stats?.reliabilityScore || 50,
        totalBookings: user.stats?.totalBookings || totalBookings,
        totalListings: listingsCount,
        totalReviews: user.stats?.totalReviews || reviewsAgg._count,
        averageRating: user.stats?.averageRating || reviewsAgg._avg.rating || 0,
        responseRate,
        responseTime,
        badges,
        memberSince: user.createdAt.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        completionRate,
      },
    });
  } catch (error) {
    console.error('[users/stats] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}