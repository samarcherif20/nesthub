// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Récupérer les annonces
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    
    const isMyListings = searchParams.get('my') === 'true';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const minRooms = searchParams.get('minRooms') ? parseInt(searchParams.get('minRooms')!) : undefined;
    const governorate = searchParams.get('governorate') || undefined;
    
    let where: any = {};
    
    if (isMyListings && clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      
      if (user) {
        where.ownerId = user.id;
        if (status && status !== 'ALL') {
          where.status = status;
        }
      } else {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }
    } else {
      where.status = 'ACTIVE';
    }
    
    if (governorate) where.governorate = governorate;
    if (minRooms) where.rooms = { gte: minRooms };
    
    if ((minPrice !== undefined || maxPrice !== undefined) && (minPrice !== undefined || maxPrice !== undefined)) {
      const min = minPrice !== undefined ? minPrice : 0;
      const max = maxPrice !== undefined ? maxPrice : 999999;
      
      where.AND = [
        {
          OR: [
            { pricePerNight: { not: null } },
            { pricePerMonth: { not: null } },
          ],
        },
        {
          OR: [
            { pricePerNight: { gte: min, lte: max } },
            { pricePerMonth: { gte: min, lte: max } },
          ],
        },
      ];
    }
    
    if (search) {
      const searchOr = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
      if (where.AND) {
        where.AND.push({ OR: searchOr });
      } else {
        where.OR = searchOr;
      }
    }
    
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
    
    const priceStats = await prisma.listing.aggregate({
      where: isMyListings && clerkId ? { ownerId: where.ownerId } : { status: 'ACTIVE' },
      _min: { pricePerNight: true, pricePerMonth: true },
      _max: { pricePerNight: true, pricePerMonth: true },
    });
    
    const minPriceGlobal = Math.min(
      priceStats._min.pricePerNight || 0,
      priceStats._min.pricePerMonth || 0
    );
    const maxPriceGlobal = Math.max(
      priceStats._max.pricePerNight || 10000,
      priceStats._max.pricePerMonth || 10000
    );
    
    return NextResponse.json({
      listings,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      priceRange: {
        min: minPriceGlobal,
        max: maxPriceGlobal,
      },
    });
    
  } catch (error) {
    console.error('[GET /api/listings] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une annonce
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    
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
        { error: 'Vous devez être propriétaire pour créer une annonce' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const slug = `${body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    
    const listing = await prisma.listing.create({
      data: {
        ...body,
        slug,
        ownerId: user.id,
        status: 'DRAFT',
      },
    });
    
    await prisma.listingHistory.create({
      data: {
        listingId: listing.id,
        actionType: 'CREATE',
        newValue: listing,
        changedBy: user.id,
      },
    });
    
    return NextResponse.json(listing, { status: 201 });
    
  } catch (error) {
    console.error('[POST /api/listings] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour une annonce
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!clerkId || !id) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    
    const body = await request.json();
    
    const existingListing = await prisma.listing.findFirst({
      where: { id, ownerId: user.id },
    });
    
    if (!existingListing) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 });
    }
    
    const changes: any = {};
    for (const key of Object.keys(body)) {
      if (existingListing[key as keyof typeof existingListing] !== body[key]) {
        changes[key] = {
          old: existingListing[key as keyof typeof existingListing],
          new: body[key],
        };
      }
    }
    
    const listing = await prisma.listing.update({
      where: { id },
      data: body,
    });
    
    if (Object.keys(changes).length > 0) {
      await prisma.listingHistory.create({
        data: {
          listingId: id,
          actionType: 'UPDATE',
          oldValue: changes,
          newValue: listing,
          changedBy: user.id,
        },
      });
    }
    
    return NextResponse.json(listing);
    
  } catch (error) {
    console.error('[PUT /api/listings] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Changer le statut (CORRIGÉ - accepte l'ID du path ou query)
export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const url = new URL(request.url);
    
    // Récupère l'ID soit du path, soit du query param
    const pathParts = url.pathname.split('/');
    const idFromPath = pathParts[pathParts.length - 1];
    const idFromQuery = url.searchParams.get('id');
    const id = (idFromPath !== 'listings' && idFromPath !== 'my') ? idFromPath : idFromQuery;
    
    console.log(`🔧 PATCH - id: ${id}`);
    
    if (!clerkId || !id) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }
    
    const body = await request.json();
    const { status } = body;
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    
    const existingListing = await prisma.listing.findFirst({
      where: { id, ownerId: user.id },
    });
    
    if (!existingListing) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 });
    }
    
    const listing = await prisma.listing.update({
      where: { id },
      data: { status },
    });
    
    await prisma.listingHistory.create({
      data: {
        listingId: id,
        actionType: 'STATUS_CHANGE',
        oldValue: { status: existingListing.status },
        newValue: { status },
        changedBy: user.id,
      },
    });
    
    return NextResponse.json(listing);
    
  } catch (error) {
    console.error('[PATCH /api/listings] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer ou archiver
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';
    const cancelBookings = searchParams.get('cancelBookings') === 'true';
    
    if (!clerkId || !id) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    
    if (permanent) {
      await prisma.listing.delete({ where: { id, ownerId: user.id } });
      return NextResponse.json({ message: 'Annonce supprimée définitivement' });
    } else {
      const listing = await prisma.listing.update({
        where: { id, ownerId: user.id },
        data: { status: 'ARCHIVED', archivedAt: new Date() },
      });
      
      if (cancelBookings) {
        await prisma.booking.updateMany({
          where: { listingId: id, status: { in: ['PENDING', 'ACCEPTED', 'CONFIRMED'] } },
          data: { status: 'CANCELLED', cancellationReason: 'Annonce supprimée par le propriétaire' },
        });
      }
      
      return NextResponse.json({ message: 'Annonce archivée', listing });
    }
    
  } catch (error) {
    console.error('[DELETE /api/listings] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}