import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

interface ActionBody {
  action: "VALIDATE" | "REJECT";
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
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    const { requestId } = await params;

    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: {
            stats: true,
          },
        },
        actions: {
          orderBy: { createdAt: "desc" },
        },
        validatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!verificationRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 },
      );
    }

    return NextResponse.json(verificationRequest);
  } catch (error) {
    console.error("Error fetching verification:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Traiter une demande
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as ActionBody;
    const { action, rejectionMotif, adminComment } = body;

    if (!action || !["VALIDATE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const { requestId } = await params;

    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!verificationRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 },
      );
    }

    if (verificationRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette demande a déjà été traitée" },
        { status: 400 },
      );
    }

    let newStatus: "VALIDATED" | "REJECTED";
    let updateData: any = {
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
      processedAt: new Date(),
      adminComment,
    };

    if (action === "VALIDATE") {
      newStatus = "VALIDATED";
      updateData = {
        ...updateData, // ✅ Garde reviewedBy, reviewedAt, processedAt, adminComment
        status: "VALIDATED",
        rejectionMotif: null,
      };

      const extractedData =
        verificationRequest.extractedData as CinExtractedData | null;
      const cinNumber = extractedData?.cinNumber;

      await prisma.$transaction([
        // Mettre à jour la demande
        prisma.verificationRequest.update({
          where: { id: requestId },
          data: updateData,
        }),

        // Mettre à jour l'utilisateur
        prisma.user.update({
          where: { id: verificationRequest.userId },
          data: {
            isIdentityVerified: true,
            verifiedAt: new Date(),
            cinNumber: cinNumber || null,
            cinData: verificationRequest.extractedData as Prisma.JsonValue,
            status: "ACTIVE",
          },
        }),

        // Créer l'action dans VerificationAction
        prisma.verificationAction.create({
          data: {
            requestId,
            action: "VALIDATE",
            performedBy: adminUser.id,
            previousStatus: verificationRequest.status,
            newStatus,
            adminComment,
          },
        }),

        // Créer le log dans UserAction
        prisma.userAction.create({
          data: {
            userId: verificationRequest.userId,
            actionType: "VALIDATE_VERIFICATION",
            performedBy: adminUser.id,
            internalNote: adminComment,
          },
        }),

        // Créer le log dans AuditLog
        prisma.auditLog.create({
          data: {
            adminId: adminUser.id,
            action: "VALIDATE_VERIFICATION",
            actionType: "VERIFICATION",
            targetType: "VERIFICATION_REQUEST",
            targetId: requestId,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Demande validée avec succès",
      });
    }

    if (action === "REJECT") {
      if (!rejectionMotif) {
        return NextResponse.json(
          { error: "Le motif de rejet est obligatoire" },
          { status: 400 },
        );
      }

      newStatus = "REJECTED";
      updateData = {
        ...updateData, // ✅ Garde reviewedBy, reviewedAt, processedAt, adminComment
        status: "REJECTED",
        rejectionMotif: rejectionMotif,
      };

      await prisma.$transaction([
        // Mettre à jour la demande
        prisma.verificationRequest.update({
          where: { id: requestId },
          data: updateData,
        }),

        // Créer l'action dans VerificationAction
        prisma.verificationAction.create({
          data: {
            requestId,
            action: "REJECT",
            performedBy: adminUser.id,
            previousStatus: verificationRequest.status,
            newStatus,
            adminComment,
            rejectionMotif,
          },
        }),

        // Créer le log dans UserAction
        prisma.userAction.create({
          data: {
            userId: verificationRequest.userId,
            actionType: "REJECT_VERIFICATION",
            performedBy: adminUser.id,
            motif: rejectionMotif,
            internalNote: adminComment,
          },
        }),

        // Créer le log dans AuditLog
        prisma.auditLog.create({
          data: {
            adminId: adminUser.id,
            action: "REJECT_VERIFICATION",
            actionType: "VERIFICATION",
            targetType: "VERIFICATION_REQUEST",
            targetId: requestId,
            motif: rejectionMotif,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Demande rejetée",
      });
    }

    return NextResponse.json(
      { error: "Action non supportée" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error updating verification:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
