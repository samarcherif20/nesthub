// app/api/users/cin-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { 
        id: true,
        isIdentityVerified: true,  
        verifiedAt: true,          
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    //  CRITICAL: If user is already verified, return VALIDATED immediately
    if (user.isIdentityVerified === true) {
      return NextResponse.json({
        status: "VALIDATED",
        rejectionReason: null,
        canReapply: false,
        requestId: null,
        submittedAt: user.verifiedAt,
        isIdentityVerified: true,
      });
    }

    // Only check verification requests if user is NOT verified
    const latestRequest = await prisma.verificationRequest.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        rejectionMotif: true,
        createdAt: true,
        extractedData: true,
      },
    });

    // Determine status and if user can reapply
    let status = null;
    let canReapply = false;
    let rejectionReason = null;

    if (latestRequest) {
      if (latestRequest.status === "PENDING") {
        status = "PENDING";
        canReapply = false;
      } else if (latestRequest.status === "REJECTED") {
        status = "REJECTED";
        canReapply = true;
        rejectionReason = latestRequest.rejectionMotif;
      } else if (latestRequest.status === "VALIDATED") {
        status = "VALIDATED";
        canReapply = false;
      } else if (latestRequest.status === "REAPPLIED") {
        status = "PENDING"; // REAPPLIED means waiting for admin review
        canReapply = false;
      }
    }

    return NextResponse.json({
      status: status,
      rejectionReason: rejectionReason,
      canReapply: canReapply,
      requestId: latestRequest?.id || null,
      submittedAt: latestRequest?.createdAt || null,
      isIdentityVerified: false,
    });
  } catch (error) {
    console.error("Error getting CIN status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}