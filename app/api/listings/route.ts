// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import ListingService from '@/lib/services/listing.service';
import { createListingSchema, searchListingsSchema } from '@/lib/validations/listing';

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
    
    // Log pour debug
    console.log('📦 [POST /api/listings] Données reçues:', JSON.stringify(body, null, 2));
    
    const validationResult = createListingSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ [POST /api/listings] Erreurs validation:', validationResult.error.issues);
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: validationResult.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          }))
        },
        { status: 400 }
      );
    }

    const listing = await ListingService.createListing(user.id, validationResult.data);

    await prisma.userAction.create({
      data: {
        userId: user.id,
        actionType: 'CREATE_LISTING',
        performedBy: user.id,
        content: JSON.stringify({ listingId: listing.id, title: listing.title }),
      },
    });

    return NextResponse.json(listing, { status: 201 });

  } catch (error) {
    console.error('[POST /api/listings] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 10,
      governorate: searchParams.get('governorate') || undefined,
      type: searchParams.get('type') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      minRooms: searchParams.get('minRooms') ? parseInt(searchParams.get('minRooms')!) : undefined,
      search: searchParams.get('search') || undefined,
    };

    const validationResult = searchListingsSchema.safeParse(filters);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { page, pageSize, governorate, type, minPrice, maxPrice, minRooms, search } = validationResult.data;

    const where: any = {
      status: 'ACTIVE',
      isArchived: false,
    };

    if (governorate) where.governorate = governorate;
    if (type) where.type = type;
    if (minRooms) where.rooms = { gte: minRooms };
    
    if (minPrice || maxPrice) {
      where.OR = [
        { pricePerNight: {} as any },
        { pricePerMonth: {} as any },
      ];
      
      if (minPrice) {
        where.OR[0].pricePerNight = { gte: minPrice };
        where.OR[1].pricePerMonth = { gte: minPrice };
      }
      if (maxPrice) {
        where.OR[0].pricePerNight = { ...where.OR[0].pricePerNight, lte: maxPrice };
        where.OR[1].pricePerMonth = { ...where.OR[1].pricePerMonth, lte: maxPrice };
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { neighborhood: { contains: search, mode: 'insensitive' } },
      ];
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
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
              isIdentityVerified: true,
              stats: {
                select: {
                  averageRating: true,
                },
              },
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        skip,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });

  } catch (error) {
    console.error('[GET /api/listings] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}