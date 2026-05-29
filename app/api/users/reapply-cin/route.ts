// app/api/users/reapply-cin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { cinNumber, documentFrontUrl, documentBackUrl, extractedData } = body;

    if (!cinNumber || !documentFrontUrl) {
      return NextResponse.json({ error: "CIN number and document are required" }, { status: 400 });
    }

    // Check if there's an existing REJECTED request
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId: user.id,
        status: "REJECTED",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "No rejected request found to reapply" }, { status: 400 });
    }

    // Create new REAPPLIED request
    const newRequest = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        documentFrontUrl,
        documentBackUrl: documentBackUrl || existingRequest.documentBackUrl,
        extractedData: extractedData || existingRequest.extractedData,
        status: "REAPPLIED",
        submittedAt: new Date(),
        // Keep reference to previous rejection
        rejectionMotif: null,
        adminComment: `Reapplication after rejection: ${existingRequest.rejectionMotif}`,
      },
    });

    // Create action log
    await prisma.verificationAction.create({
      data: {
        requestId: newRequest.id,
        action: "REAPPLY",
        performedBy: user.id,
        previousStatus: "REJECTED",
        newStatus: "REAPPLIED",
        adminComment: "User reapplied after rejection",
      },
    });

    // Create notification for admin
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM_ALERT",
        title: " Nouvelle réapplication CIN",
        content: `L'utilisateur a soumis une nouvelle demande de vérification CIN après rejet.`,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reapplication submitted successfully",
      requestId: newRequest.id,
    });
  } catch (error) {
    console.error("Error in reapply-cin:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}