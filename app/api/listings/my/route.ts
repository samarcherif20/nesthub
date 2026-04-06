// app/api/listings/my/route.ts (CORRIGÉ)
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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

    // Récupérer les paramètres
    const status = searchParams.get('status') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    
    // 🔥 FILTRES AVANCÉS
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRooms = searchParams.get('minRooms');
    const governorate = searchParams.get('governorate');

    // Construction du WHERE
    let where: any = {
      ownerId: user.id,
    };

    // Filtre par statut
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // 🔥 Filtre par gouvernorat
    if (governorate && governorate !== '') {
      where.governorate = governorate;
    }

    // 🔥 Filtre par nombre de chambres
    if (minRooms && minRooms !== '') {
      where.rooms = { gte: parseInt(minRooms) };
    }

    // 🔥 FILTRE PRIX CORRIGÉ
    // Une annonce est dans la plage si:
    // - pricePerNight EST DANS [minPrice, maxPrice] OU
    // - pricePerMonth EST DANS [minPrice, maxPrice]
    if ((minPrice && minPrice !== '') || (maxPrice && maxPrice !== '')) {
      const min = minPrice && minPrice !== '' ? parseFloat(minPrice) : 0;
      const max = maxPrice && maxPrice !== '' ? parseFloat(maxPrice) : 999999;
      
      where.AND = [
        {
          OR: [
            { pricePerNight: { not: null } },
            { pricePerMonth: { not: null } },
          ],
        },
        {
          OR: [
            {
              AND: [
                { pricePerNight: { gte: min } },
                { pricePerNight: { lte: max } },
              ],
            },
            {
              AND: [
                { pricePerMonth: { gte: min } },
                { pricePerMonth: { lte: max } },
              ],
            },
          ],
        },
      ];
    }

    // Filtre par recherche
    if (search && search !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    console.log('📝 Where clause finale:', JSON.stringify(where, null, 2));

    const skip = (page - 1) * pageSize;

    const [listings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          photos: {
            where: { isMain: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    console.log(`📊 Résultats: ${listings.length} annonces sur ${totalCount} total`);

    // Calculer les prix min/max pour le slider
    const allListings = await prisma.listing.findMany({
      where: { ownerId: user.id },
      select: { pricePerNight: true, pricePerMonth: true },
    });
    
    let minGlobal = Infinity;
    let maxGlobal = -Infinity;
    
    allListings.forEach(l => {
      if (l.pricePerNight !== null && l.pricePerNight > 0) {
        minGlobal = Math.min(minGlobal, l.pricePerNight);
        maxGlobal = Math.max(maxGlobal, l.pricePerNight);
      }
      if (l.pricePerMonth !== null && l.pricePerMonth > 0) {
        minGlobal = Math.min(minGlobal, l.pricePerMonth);
        maxGlobal = Math.max(maxGlobal, l.pricePerMonth);
      }
    });
    
    const priceRange = {
      min: minGlobal === Infinity ? 0 : Math.floor(minGlobal),
      max: maxGlobal === -Infinity ? 10000 : Math.ceil(maxGlobal),
    };

    return NextResponse.json({
      listings,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      priceRange,
    });

  } catch (error) {
    console.error('[GET /api/listings/my] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}