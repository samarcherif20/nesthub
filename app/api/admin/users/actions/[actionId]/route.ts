import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuth, isAuthError } from '@/lib/auth-admin';

// PATCH - Annuler une action (restaurer le statut précédent)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    console.log('🚀 [UNDO] Début annulation action');
    
    const auth = getAdminAuth(request);
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    const { actionId } = await params;
    console.log('📝 Action ID à annuler:', actionId);

    if (!actionId) {
      return NextResponse.json(
        { error: 'ID action manquant' },
        { status: 400 }
      );
    }

    // Récupérer l'action avec les infos de l'utilisateur
    const userAction = await prisma.userAction.findUnique({
      where: { id: actionId },
      include: { user: true }
    });

    if (!userAction) {
      return NextResponse.json(
        { error: 'Action non trouvée' },
        { status: 404 }
      );
    }

    console.log('✅ Action trouvée:', {
      id: userAction.id,
      type: userAction.actionType,
      userId: userAction.userId,
      previousStatus: userAction.previousStatus
    });

    // Restaurer le statut précédent si disponible
    if (userAction.previousStatus) {
      await prisma.user.update({
        where: { id: userAction.userId },
        data: {
          status: userAction.previousStatus,
          suspendedUntil: null
        }
      });
      console.log('✅ Statut utilisateur restauré à:', userAction.previousStatus);
    }

    // Marquer l'action comme annulée (on peut ajouter un champ isUndone ou changer le type)
    await prisma.userAction.update({
      where: { id: actionId },
      data: {
        actionType: userAction.actionType + '_UNDONE'
      }
    });

    console.log('✅ Action marquée comme annulée');

    return NextResponse.json({ 
      success: true,
      message: 'Action annulée avec succès'
    });

  } catch (error) {
    console.error('❌ Error undoing action:', error);
    return NextResponse.json(
      { error: 'Erreur serveur: ' + error.message },
      { status: 500 }
    );
  }
}

// GET - Récupérer une action spécifique (optionnel)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const auth = getAdminAuth(request);
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    const { actionId } = await params;

    const action = await prisma.userAction.findUnique({
      where: { id: actionId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        admin: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!action) {
      return NextResponse.json(
        { error: 'Action non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({ action });
    
  } catch (error) {
    console.error('Error fetching action:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}