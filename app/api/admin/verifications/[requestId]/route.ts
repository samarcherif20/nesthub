import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuth, isAuthError } from '@/lib/auth-admin';
import { Prisma } from '@prisma/client';

interface RouteParams {
  params: {
    requestId: string;
  };
}

interface ActionBody {
  action: 'VALIDATE' | 'REJECT';
  rejectionMotif?: string;
  adminComment?: string;
}

interface CinExtractedData {
  cinNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  [key: string]: unknown;
}

// GET - Détail d'une demande
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = getAdminAuth(request);
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id: params.requestId },
      include: {
        user: {
          include: {
            stats: true,
            verificationRequests: {
              orderBy: { submittedAt: 'desc' },
              take: 5,
            }
          }
        }
      }
    });

    if (!verificationRequest) {
      return NextResponse.json(
        { error: 'Demande non trouvée' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(verificationRequest);

  } catch (error) {
    console.error('Error fetching verification:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}

// PATCH - Traiter une demande
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = getAdminAuth(request);
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    const body = await request.json() as ActionBody;
    const { action, rejectionMotif, adminComment } = body;

    if (!action || !['VALIDATE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide' },
        { status: 400 }
      );
    }

    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id: params.requestId },
      include: { user: true }
    });

    if (!verificationRequest) {
      return NextResponse.json(
        { error: 'Demande non trouvée' }, 
        { status: 404 }
      );
    }

    if (verificationRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cette demande a déjà été traitée' },
        { status: 400 }
      );
    }

    if (action === 'VALIDATE') {
      const extractedData = verificationRequest.extractedData as CinExtractedData | null;
      const cinNumber = extractedData?.cinNumber;

      await prisma.$transaction([
        prisma.verificationRequest.update({
          where: { id: params.requestId },
          data: {
            status: 'VALIDATED',
            reviewedBy: auth.userId,
            reviewedAt: new Date(),
            adminComment,
          }
        }),
        prisma.user.update({
          where: { id: verificationRequest.userId },
          data: {
            isIdentityVerified: true,
            verifiedAt: new Date(),
            cinNumber: cinNumber || null,
            cinData: verificationRequest.extractedData as Prisma.JsonValue,
            status: 'ACTIVE',
          }
        }),
        prisma.userAction.create({
          data: {
            userId: verificationRequest.userId,
            actionType: 'VALIDATE_VERIFICATION',
            performedBy: auth.userId,
            internalNote: adminComment,
          }
        }),
        prisma.auditLog.create({
          data: {
            adminId: auth.userId,
            action: 'VALIDATE_VERIFICATION',
            actionType: 'VERIFICATION',
            targetType: 'VERIFICATION_REQUEST',
            targetId: params.requestId,
          }
        })
      ]);

      return NextResponse.json({ 
        success: true, 
        message: 'Demande validée avec succès'
      });
    }

    if (action === 'REJECT') {
      if (!rejectionMotif) {
        return NextResponse.json(
          { error: 'Le motif de rejet est obligatoire' },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        prisma.verificationRequest.update({
          where: { id: params.requestId },
          data: {
            status: 'REJECTED',
            reviewedBy: auth.userId,
            reviewedAt: new Date(),
            rejectionMotif,
            adminComment,
          }
        }),
        prisma.userAction.create({
          data: {
            userId: verificationRequest.userId,
            actionType: 'REJECT_VERIFICATION',
            performedBy: auth.userId,
            motif: rejectionMotif,
            internalNote: adminComment,
          }
        }),
        prisma.auditLog.create({
          data: {
            adminId: auth.userId,
            action: 'REJECT_VERIFICATION',
            actionType: 'VERIFICATION',
            targetType: 'VERIFICATION_REQUEST',
            targetId: params.requestId,
            motif: rejectionMotif,
          }
        })
      ]);

      return NextResponse.json({ 
        success: true, 
        message: 'Demande rejetée'
      });
    }

    return NextResponse.json(
      { error: 'Action non supportée' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating verification:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    );
  }
}