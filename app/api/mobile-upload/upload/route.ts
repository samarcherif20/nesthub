// app/api/mobile-upload/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { uploadSessions } from "@/lib/upload-sessions";

export async function POST(request: NextRequest) {
  try {
    console.log("📸 Upload reçu");

    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const type = formData.get("type") as string; // 'recto', 'verso', 'selfie'
    const file = formData.get("file") as File;

    console.log("📦 Données:", {
      sessionId,
      type,
      fileName: file?.name,
      fileSize: file?.size,
    });

    if (!sessionId || !type || !file) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 },
      );
    }

    const session = uploadSessions.get(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session expirée" }, { status: 404 });
    }

    // Convertir le fichier en base64 ou buffer pour le stockage temporaire
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Stocker le fichier dans la session (en mémoire)
    if (!session.files) session.files = {};
    session.files[type] = {
      data: buffer.toString("base64"), // Stocker en base64
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    const filesCount = Object.keys(session.files).filter(
      (k) => session.files[k]?.data,
    ).length;
    console.log(`📁 Fichiers reçus: ${filesCount}/3`);

    if (filesCount === 3) {
      session.status = "completed";
      console.log("✅ Tous les fichiers reçus !");
    }

    uploadSessions.set(sessionId, session);

    return NextResponse.json({
      success: true,
      type,
      filesReceived: filesCount,
      totalExpected: 3,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
  }
}
