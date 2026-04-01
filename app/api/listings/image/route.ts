// app/api/listings/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    const blobUrl = req.nextUrl.searchParams.get('url');
    
    // Autoriser même sans authentification pour les photos publiques ?
    // Pour plus de sécurité, on peut exiger l'authentification
    if (!clerkId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    if (!blobUrl) {
      return NextResponse.json({ error: 'URL manquante' }, { status: 400 });
    }
    
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    
    // Pour les photos d'annonces, on autorise tous les utilisateurs authentifiés
    // (propriétaires, locataires, admin)
    // On peut ajouter une vérification supplémentaire si besoin
    
    // Récupérer l'image depuis Vercel Blob (avec token)
    const response = await fetch(blobUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    });
    
    if (!response.ok) {
      console.error('[listings/image] Échec fetch:', response.status);
      return NextResponse.json({ error: 'Image non trouvée' }, { status: 404 });
    }
    
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
    
  } catch (error) {
    console.error('[listings/image] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}