// app/api/users/verification-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        verificationRequests: {
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
        identityVerification: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const lastRequest = user.verificationRequests[0];

    // Récupérer les URLs des documents si disponibles
    const documentFrontUrl =
      lastRequest?.documentFrontUrl ||
      user.identityVerification?.documentFrontUrl;
    const documentBackUrl =
      lastRequest?.documentBackUrl ||
      user.identityVerification?.documentBackUrl;
    const selfieUrl = lastRequest?.selfieUrl;

    return NextResponse.json({
      idVerified: user.isIdentityVerified,
      emailVerified: user.isEmailVerified,
      phoneVerified: user.phoneVerified,
      cinNumber: user.cinNumber,
      verificationStatus: lastRequest?.status || "PENDING",
      verificationDate: lastRequest?.processedAt || null,
      canResubmit: lastRequest?.status === "REJECTED",
      rejectionReason:
        lastRequest?.rejectionReason || lastRequest?.rejectionMotif || null,
      documents: {
        front: documentFrontUrl,
        back: documentBackUrl,
        selfie: selfieUrl,
      },
      submittedAt: lastRequest?.submittedAt || null,
    });
  } catch (error) {
    console.error("[users/verification-status] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
