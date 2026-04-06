// app/api/listings/[id]/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get('actionType');
    const days = parseInt(searchParams.get('days') || '30');
    
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

    // Vérifier l'accès
    const listing = await prisma.listing.findFirst({
      where: {
        id,
        OR: [
          { ownerId: user.id },
          { teamMembers: { some: { userId: user.id, isActive: true } } }
        ]
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Annonce non trouvée ou non autorisée' }, { status: 404 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      listingId: id,
      createdAt: { gte: startDate },
    };

    // ✅ Filtrer par type d'action
    if (actionType && actionType !== 'ALL' && actionType !== '') {
      where.actionType = actionType;
    }

    const history = await prisma.listingHistory.findMany({
      where,
      include: {
        changedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Formater les données
    const formattedHistory = history.map(entry => ({
      id: entry.id,
      actionType: entry.actionType,
      fieldName: entry.fieldName,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      createdAt: entry.createdAt.toISOString(),
      changedByUser: {
        id: entry.changedByUser.id,
        firstName: entry.changedByUser.firstName,
        lastName: entry.changedByUser.lastName,
        profilePictureUrl: entry.changedByUser.profilePictureUrl,
        email: entry.changedByUser.email,
      },
    }));

    return NextResponse.json({
      history: formattedHistory,
      total: history.length,
    });
  } catch (error) {
    console.error('[GET /api/listings/:id/history] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}