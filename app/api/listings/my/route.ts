// app/api/listings/my/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import ListingService from '@/lib/services/listing.service';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    
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

    if (user.role !== 'PROPERTY_OWNER' && user.role !== 'BOTH') {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas propriétaire' },
        { status: 403 }
      );
    }

    const status = searchParams.get('status') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || undefined;

    const result = await ListingService.getMyListings(user.id, {
      status,
      page,
      pageSize,
      search,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('[GET /api/listings/my] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}