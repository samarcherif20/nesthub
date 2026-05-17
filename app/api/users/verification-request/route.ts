import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur depuis la BDD
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true,
        isIdentityVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { documentFrontUrl, documentBackUrl, extractedData, ocrSuccess } = body;

    if (!documentFrontUrl) {
      return NextResponse.json({ error: "Document front URL required" }, { status: 400 });
    }

    // Vérifier si l'utilisateur a déjà une demande en attente
    const existingPending = await prisma.verificationRequest.findFirst({
      where: {
        userId: user.id,
        status: { in: ["PENDING", "REAPPLIED"] },
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "Vous avez déjà une demande en cours de traitement" },
        { status: 400 }
      );
    }

    // Extraire les données OCR
    const cinNumber = extractedData?.cinNumber || null;
    const extractedFirstName = extractedData?.firstName || null;
    const extractedLastName = extractedData?.lastName || null;
    const dateOfBirth = extractedData?.dateOfBirth || null;
    const profession = extractedData?.profession || null;

    // 1. Créer la demande de vérification
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        documentFrontUrl,
        documentBackUrl: documentBackUrl || null,
        extractedData: extractedData || null,
        ocrSuccess: ocrSuccess || false,
        status: "PENDING",
        submittedAt: new Date(),
      },
    });

    // 2. Mettre à jour cinNumber et cinData (JSON) dans la table users
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(cinNumber && { cinNumber }),
        cinData: {
          cinNumber,
          firstName: extractedFirstName,
          lastName: extractedLastName,
          dateOfBirth,
          profession,
          extractedAt: new Date().toISOString(),
          rectoUrl: documentFrontUrl,
          versoUrl: documentBackUrl || null,
        },
      },
    });

    // 3. Récupérer tous les admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    // 4. Créer une notification pour CHAQUE admin
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: "SYSTEM_ALERT",
          title: "🆕 Nouvelle demande de vérification CIN",
          content: `${user.firstName || "Un utilisateur"} ${user.lastName || ""} (${user.email}) a soumis une nouvelle demande de vérification d'identité.`,
          isRead: false,
        })),
      });
    }

    // 5. Notification de confirmation pour l'utilisateur
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM_ALERT",
        title: "✅ Demande de vérification envoyée",
        content: "Votre demande a été soumise avec succès. Un administrateur va la traiter dans les plus brefs délais.",
        isRead: false,
      },
    });

    console.log(`✅ Demande de vérification créée: ${verificationRequest.id}`);
    console.log(`✅ cinData mis à jour pour user: ${user.id}`);
    console.log(`✅ Notifications envoyées à ${admins.length} admin(s)`);

    return NextResponse.json({
      success: true,
      requestId: verificationRequest.id,
      message: "Demande soumise avec succès",
    });
  } catch (error) {
    console.error("Error creating verification request:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}