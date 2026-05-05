// app/api/verification-requests/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { documentFrontUrl, documentBackUrl, extractedData } = body;

    if (!documentFrontUrl || !documentBackUrl) {
      return NextResponse.json(
        { error: "documentFrontUrl et documentBackUrl requis" },
        { status: 400 },
      );
    }

    // Vérifier s'il existe déjà une demande PENDING
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Une demande de vérification est déjà en cours" },
        { status: 400 },
      );
    }

    // Créer la demande de vérification
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        documentFrontUrl,
        documentBackUrl,
        extractedData: extractedData || {},
        ocrSuccess: !!extractedData?.cinNumber,
        status: "PENDING",
        submittedAt: new Date(),
      },
    });

    // 🔔 Notifier l'utilisateur
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM_ALERT",
        title: "Demande de vérification envoyée",
        content:
          "Vos documents ont été soumis avec succès. Un administrateur va les vérifier sous 24-48h.",
        isRead: false,
      },
    });

    // 🔔 Notifier TOUS les admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "SYSTEM_ALERT",
          title: "🆕 Nouvelle demande de vérification",
          content: `${user.firstName || ""} ${user.lastName || ""} (${user.email}) a soumis une nouvelle demande de vérification d'identité.`,
          isRead: false,
          createdAt: new Date(),
        })),
      });

      console.log(`✅ ${admins.length} notifications envoyées aux admins`);
    }

    return NextResponse.json({
      success: true,
      verificationRequest: {
        id: verificationRequest.id,
        status: verificationRequest.status,
        submittedAt: verificationRequest.submittedAt,
      },
    });
  } catch (error) {
    console.error("❌ Erreur création verification request:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de la demande" },
      { status: 500 },
    );
  }
}

// GET - Récupérer le statut de la demande de l'utilisateur courant
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const verificationRequest = await prisma.verificationRequest.findFirst({
      where: { userId: user.id },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        processedAt: true,
        rejectionReason: true,
        adminComment: true,
      },
    });

    return NextResponse.json({
      hasRequest: !!verificationRequest,
      verificationRequest,
    });
  } catch (error) {
    console.error("❌ Erreur récupération statut:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
