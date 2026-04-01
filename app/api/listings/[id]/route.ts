// app/api/listings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import ListingService from '@/lib/services/listing.service';
import { updateListingSchema } from '@/lib/validations/listing';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const listing = await ListingService.getListingById(id, true);

    if (!listing) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 });
    }

    return NextResponse.json(listing);

  } catch (error) {
    console.error('[GET /api/listings/:id] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const body = await request.json();
    
    // ✅ Filtrer les champs qui ne sont pas dans le schéma de mise à jour
    const { photos, stats, createdAt, updatedAt, viewCount, bookingCount, ...updateData } = body;
    
    console.log('📦 [PUT] Données à mettre à jour:', updateData);
    
    // Validation
    const validationResult = updateListingSchema.safeParse(updateData);
    if (!validationResult.success) {
      console.error('❌ Erreurs validation:', validationResult.error.issues);
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: validationResult.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const listing = await ListingService.updateListing(id, user.id, validationResult.data);

    await prisma.userAction.create({
      data: {
        userId: user.id,
        actionType: 'UPDATE_LISTING',
        performedBy: user.id,
        content: JSON.stringify({ listingId: id, changes: Object.keys(validationResult.data) }),
      },
    });

    return NextResponse.json(listing);

  } catch (error) {
    console.error('[PUT /api/listings/:id] Erreur:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Annonce non trouvée') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === 'Non autorisé') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (permanent) {
      await ListingService.deleteListing(id, user.id);
      await prisma.userAction.create({
        data: {
          userId: user.id,
          actionType: 'DELETE_LISTING',
          performedBy: user.id,
          content: JSON.stringify({ listingId: id, permanent: true }),
        },
      });
      return NextResponse.json({ message: 'Annonce supprimée définitivement' });
    } else {
      const listing = await ListingService.archiveListing(id, user.id);
      await prisma.userAction.create({
        data: {
          userId: user.id,
          actionType: 'ARCHIVE_LISTING',
          performedBy: user.id,
          content: JSON.stringify({ listingId: id }),
        },
      });
      return NextResponse.json({ message: 'Annonce archivée', listing });
    }

  } catch (error) {
    console.error('[DELETE /api/listings/:id] Erreur:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Annonce non trouvée') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === 'Non autorisé') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('réservations')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { action } = body;
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    let result;
    
    switch (action) {
      case 'RESTORE':
        result = await ListingService.restoreListing(id, user.id);
        break;
        
      case 'TOGGLE_STATUS':
        const listing = await prisma.listing.findUnique({
          where: { id },
          select: { status: true, ownerId: true },
        });
        
        if (!listing || listing.ownerId !== user.id) {
          return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }
        
        const newStatus = listing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        result = await prisma.listing.update({
          where: { id },
          data: { status: newStatus },
        });
        break;
        
      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    }
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('[PATCH /api/listings/:id] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}