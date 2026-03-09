// app/api/admin/users/actions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuth, isAuthError } from '@/lib/auth-admin';
import { Prisma } from '@prisma/client';

// Types pour les actions
interface ActionBody {
  userId: string;
  action: 'SUSPEND' | 'BAN' | 'ACTIVATE' | 'LOCK' | 'UNLOCK' | 'ESCALATE' | 'NOTE' | 'WARNING';
  duration?: number;        // Pour SUSPEND
  reason?: string;          // Raison courte
  motif?: string;           // Motif détaillé
  level?: number;           // Pour ESCALATE (1,2,3)
  content?: string;         // Pour NOTE
  notify?: boolean;         // Pour notifications
}

// GET - Historique des actions
export async function GET(request: NextRequest) {
  try {
    const auth = getAdminAuth(request);
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    // Récupérer les paramètres de pagination/filtres
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const actionType = searchParams.get('actionType');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;

    // Construire la clause where
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (actionType && actionType !== 'ALL') {
      where.actionType = actionType;
    }
    
    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { motif: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { user: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    // Compter le total pour la pagination
    const totalCount = await prisma.userAction.count({ where });

    // Récupérer les actions avec les relations
    const actions = await prisma.userAction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
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

    return NextResponse.json({ 
      actions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching actions:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Effectuer une action
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [1] DÉBUT POST ACTION');
    
    const auth = getAdminAuth(request);
    console.log('👤 [2] Auth reçu:', auth);
    
    if (isAuthError(auth)) {
      console.log('❌ [3] Auth error:', auth.error);
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    console.log('✅ [4] Auth OK - Admin Clerk ID:', auth.userId);

    const body = await request.json() as ActionBody;
    console.log('📦 [5] Body reçu:', JSON.stringify(body, null, 2));

    const { userId, action, duration, reason, motif, level, content, notify } = body;

    if (!userId || !action) {
      console.log('❌ [6] Paramètres manquants:', { userId, action });
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // ✅ [7] Vérifier que l'admin existe en cherchant par clerkId
    console.log('🔍 [7] Recherche admin avec clerkId:', auth.userId);
    const adminUser = await prisma.user.findUnique({
      where: { clerkId: auth.userId }
    });
    
    console.log('👤 [8] Admin dans DB:', adminUser ? '✅ Trouvé' : '❌ Non trouvé');
    if (adminUser) {
      console.log('   - UUID:', adminUser.id);
      console.log('   - Email:', adminUser.email);
      console.log('   - Rôle:', adminUser.role);
    }

    if (!adminUser) {
      console.log('❌ [9] Admin non trouvé en base');
      return NextResponse.json(
        { error: 'Admin non trouvé' },
        { status: 404 }
      );
    }

    // ✅ [10] Récupérer l'utilisateur cible
    console.log('🔍 [10] Recherche utilisateur cible avec id:', userId);
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    console.log('👤 [11] Utilisateur cible:', user ? '✅ Trouvé' : '❌ Non trouvé');
    if (user) {
      console.log('   - Email:', user.email);
      console.log('   - Statut actuel:', user.status);
    }

    if (!user) {
      console.log('❌ [12] Utilisateur non trouvé:', userId);
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    console.log('✅ [13] Utilisateur cible trouvé:', user.email);

    let newStatus = user.status;
    let suspendedUntil = null;
    let actionType = '';
    let escalationLevel = null;

    // Appliquer l'action
    console.log('🔧 [14] Action à appliquer:', action);
    
    switch (action) {
      case 'SUSPEND':
        console.log('🔧 [15] CAS SUSPEND');
        if (!duration || !reason) {
          return NextResponse.json(
            { error: 'Durée et raison requises pour la suspension' },
            { status: 400 }
          );
        }
        
        suspendedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        newStatus = 'TEMPORARILY_SUSPENDED';
        actionType = 'SUSPEND_USER';
        
        await prisma.user.update({
          where: { id: userId },
          data: { 
            status: newStatus,
            suspendedUntil
          }
        });
        console.log('✅ [16] Utilisateur suspendu - Nouveau statut:', newStatus);
        break;

      case 'BAN':
        console.log('🔧 [15] CAS BAN');
        if (!reason) {
          return NextResponse.json(
            { error: 'Raison requise pour le bannissement' },
            { status: 400 }
          );
        }
        
        newStatus = 'PERMANENTLY_BANNED';
        actionType = 'BAN_USER';
        
        await prisma.user.update({
          where: { id: userId },
          data: { 
            status: newStatus,
            suspendedUntil: null
          }
        });
        console.log('✅ [16] Utilisateur banni');
        break;

      case 'ACTIVATE':
        console.log('🔧 [15] CAS ACTIVATE');
        newStatus = 'ACTIVE';
        actionType = 'ACTIVATE_USER';
        
        await prisma.user.update({
          where: { id: userId },
          data: { 
            status: newStatus,
            suspendedUntil: null
          }
        });
        console.log('✅ [16] Utilisateur activé');
        break;

      case 'LOCK':
        console.log('🔧 [15] CAS LOCK');
        if (!reason) {
          return NextResponse.json(
            { error: 'Raison requise pour le blocage' },
            { status: 400 }
          );
        }

        newStatus = 'MANUALLY_BLOCKED'
        actionType = 'LOCK_USER';
        
        await prisma.user.update({
          where: { id: userId },
          data: { 
            status: newStatus,
          }
        });
        console.log('✅ [16] Utilisateur bloqué');
        break;

      case 'UNLOCK':
        console.log('🔧 [15] CAS UNLOCK');
        newStatus = 'ACTIVE';
        actionType = 'UNLOCK_USER';
        
        await prisma.user.update({
          where: { id: userId },
          data: { 
            status: newStatus,
            failedLoginAttempts: 0
          }
        });
        console.log('✅ [16] Utilisateur débloqué');
        break;

      case 'ESCALATE':
        console.log('🔧 [15] CAS ESCALATE');
        if (!level || !reason) {
          return NextResponse.json(
            { error: 'Niveau et raison requis pour l\'escalade' },
            { status: 400 }
          );
        }
        
        escalationLevel = level;
        actionType = 'ESCALATE_USER';
        
        if (level === 2) {
          suspendedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          newStatus = 'TEMPORARILY_SUSPENDED';
        } else if (level === 3) {
          newStatus = 'PERMANENTLY_BANNED';
        }
        
        await prisma.user.update({
          where: { id: userId },
          data: { 
            status: newStatus,
            suspendedUntil,
            escalationLevel: level
          }
        });
        console.log('✅ [16] Escalade appliquée - Niveau:', level);
        break;

      case 'NOTE':
        console.log('🔧 [15] CAS NOTE');
        if (!content) {
          return NextResponse.json(
            { error: 'Contenu requis pour la note' },
            { status: 400 }
          );
        }
        
        actionType = 'ADD_NOTE';
        
         await prisma.adminNote.create({
    data: {
      targetUserId: userId,     
      authorId: adminUser.id,    
      content: content,          
      isPrivate: true 
    }
        });
        console.log('✅ [16] Note ajoutée');
        break;

      case 'WARNING':
        console.log('🔧 [15] CAS WARNING');
        if (!reason) {
          return NextResponse.json(
            { error: 'Raison requise pour l\'avertissement' },
            { status: 400 }
          );
        }
        
        actionType = 'WARNING';
        newStatus = user.status;
        console.log('✅ [16] Avertissement configuré');
        break;

      default:
        console.log('❌ [15] Action invalide:', action);
        return NextResponse.json(
          { error: 'Action invalide' },
          { status: 400 }
        );
    }

    // ✅ [17] CRÉATION DE L'ACTION - LA PARTIE CRITIQUE
    console.log('💾 [17] Tentative création UserAction avec:');
    console.log('   - userId:', userId);
    console.log('   - actionType:', actionType);
    console.log('   - performedBy (UUID admin):', adminUser.id); // ✅ C'EST ÇA LA CLÉ !
    console.log('   - reason:', reason || null);
    console.log('   - motif:', motif || null);
    console.log('   - previousStatus:', user.status);
    console.log('   - newStatus:', newStatus !== user.status ? newStatus : null);

    try {
      const userAction = await prisma.userAction.create({
        data: {
          userId,
          actionType,
          performedBy: adminUser.id, // ✅ UTILISEZ L'UUID, PAS LE CLERK ID !
          reason: reason || null,
          motif: motif || null,
          duration: duration || null,
          level: escalationLevel,
          content: content || null,
          previousStatus: user.status,
          newStatus: newStatus !== user.status ? newStatus : null,
          suspendedUntil,
        }
      });
      
      console.log('✅ [18] USERACTION CRÉÉE AVEC SUCCÈS !');
      console.log('   - ID:', userAction.id);
      console.log('   - Créée à:', userAction.createdAt);
      
      // ✅ [19] Vérification : compter le nombre total d'actions
      const totalActions = await prisma.userAction.count();
      console.log(`📊 [19] Total actions en base après création: ${totalActions}`);
      
    } catch (createError) {
      console.error('❌ [18] ERREUR CRÉATION USERACTION:');
      console.error('   - Message:', createError.message);
      console.error('   - Stack:', createError.stack);
      // Ne pas cacher l'erreur ! Retournez-la au client
      return NextResponse.json(
        { error: 'Erreur création action: ' + createError.message },
        { status: 500 }
      );
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          adminId: adminUser.id, // ✅ Utilisez l'UUID ici aussi
          action: actionType,
          actionType: 'USER_ACTION',
          targetType: 'USER',
          targetId: userId,
          details: {
            duration,
            level: escalationLevel,
            reason,
            motif
          } as Prisma.JsonValue,
          motif: motif || reason || null,
        },
      });
      console.log('✅ [20] Audit log créé');
    } catch (auditError) {
      console.error('❌ [20] ERREUR audit log:', auditError);
    }

    if (notify) {
      console.log(`📧 [21] Notification à envoyer pour ${user.email}`);
    }

    console.log('✅ [22] FIN POST ACTION - Succès complet');
    return NextResponse.json({ 
      success: true,
      message: `Action ${action} effectuée avec succès`
    });

  } catch (error) {
    console.error('❌ [CATASTROPHE] ERREUR NON GÉRÉE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    );
  }
}