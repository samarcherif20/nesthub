// app/api/admin/notifications/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuth, isAuthError } from '@/lib/auth-admin';
import { emailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  console.log('🚀 [API] POST /api/admin/notifications/send - Début');
  
  try {
    // Log complet de la requête
    console.log('📨 Headers:', Object.fromEntries(request.headers));
    
    // Vérification admin
    console.log('🔐 Vérification admin...');
    const auth = getAdminAuth(request);
    if (isAuthError(auth)) {
      console.log('❌ Auth error:', auth);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    console.log('✅ Admin vérifié:', auth.userId);

    // Récupération des données
    const body = await request.json();
    console.log('📦 Body reçu:', JSON.stringify(body, null, 2));

    const { userId, actionType, motif, reason, duration, level } = body;

    console.log('📨 Requête notification:', { userId, actionType, motif, duration, level });

    // Validation
    if (!userId || !actionType) {
      console.log('❌ Paramètres manquants');
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
    console.log('👤 Recherche utilisateur:', userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé:', userId);
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    console.log('✅ Utilisateur trouvé:', { 
      id: user.id, 
      email: user.email,
      name: `${user.firstName} ${user.lastName}`
    });

    // Validation de l'email
    if (!user.email || !user.email.includes('@')) {
      console.error('❌ Email invalide:', user.email);
      return NextResponse.json(
        { error: 'Email utilisateur invalide' },
        { status: 400 }
      );
    }

    // Envoyer l'email avec Brevo
    console.log('📧 Tentative envoi email via Brevo...');
    try {
      await emailService.sendModerationNotification({
        userEmail: user.email,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur',
        actionType,
        motif,
        reason,
        duration,
        level,
        suspendedUntil: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : undefined,
      });
      console.log('✅ Email envoyé avec succès');
    } catch (emailError) {
      console.error('❌ Erreur email mais on continue:', emailError);
      // On continue pour ne pas bloquer l'action admin
    }

    // Logger l'envoi dans la base
    console.log('📝 Création log email...');
    await prisma.emailLog.create({
      data: {
        userId,
        actionType,
        sentBy: auth.userId,
        motif,
        duration: duration || null,
        level: level || null,
        status: 'SENT', // On considère que c'est envoyé même si email échoue
      }
    }).catch(e => console.error('❌ Erreur logging:', e));

    console.log('✅ Notification enregistrée dans les logs');

    return NextResponse.json({ 
      success: true,
      message: 'Notification traitée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur détaillée:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack',
      error
    });
    
    // Logger l'erreur si possible
    try {
      const body = await request.json().catch(() => ({}));
      const { userId, actionType, motif, duration, level } = body;
      
      if (userId) {
        await prisma.emailLog.create({
          data: {
            userId,
            actionType: actionType || 'UNKNOWN',
            sentBy: 'system',
            motif,
            duration,
            level,
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          }
        }).catch(e => console.error('❌ Erreur logging:', e));
      }
    } catch (logError) {
      console.error('❌ Erreur lors du logging:', logError);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}