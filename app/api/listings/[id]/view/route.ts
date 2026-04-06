import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;
    
    console.log('===================');
    console.log('📊 [VIEW API] Appel reçu!');
    console.log(`📊 [VIEW API] Listing ID: ${id}`);
    console.log(`📊 [VIEW API] Utilisateur: ${clerkId || 'non connecté'}`);
    console.log(`📊 [VIEW API] URL complète: ${request.url}`);
    console.log('===================');
    
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }
    
    // Vérifier si l'utilisateur est le propriétaire
    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      
      if (user) {
        const listing = await prisma.listing.findFirst({
          where: { id, ownerId: user.id },
          select: { id: true, title: true },
        });
        
        if (listing) {
          console.log(`🚫 [VIEW API] Vue NON comptée - propriétaire: ${listing.title}`);
          return NextResponse.json({ 
            success: false, 
            message: 'Vue non comptée (propriétaire)',
            reason: 'owner'
          });
        }
      }
    }
    
    // Incrémenter
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true, title: true },
    });
    
    console.log(`✅ [VIEW API] Vue COMPTÉE pour: ${updatedListing.title}`);
    console.log(`📊 [VIEW API] Nouveau compteur: ${updatedListing.viewCount}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Vue comptée',
      viewCount: updatedListing.viewCount
    });
    
  } catch (error) {
    console.error('[VIEW API] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}