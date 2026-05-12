import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Stockage global des sessions (partagé avec l'API session)
declare global {
  // eslint-disable-next-line no-var
  var __uploadSessions: Map<string, any> | undefined;
}

const getUploadSessions = () => {
  if (!global.__uploadSessions) {
    global.__uploadSessions = new Map();
  }
  return global.__uploadSessions;
};

async function detectImageType(buffer: Buffer): Promise<{ mimeType: string; extension: string }> {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }
  // PNG: 89 50 4E 47
  else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { mimeType: 'image/png', extension: 'png' };
  }
  // Default to JPEG
  else {
    console.log("⚠️ Type non détecté, fallback à JPEG");
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const uploadSessions = getUploadSessions();
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const type = formData.get("type") as string;
    const file = formData.get("file") as File;

    console.log("📸 Upload reçu:", { 
      sessionId, 
      type, 
      fileName: file?.name, 
      fileType: file?.type,
      fileSize: file?.size 
    });

    if (!sessionId || !type || !file) {
      return NextResponse.json(
        { error: "Paramètres manquants", success: false },
        { status: 400 },
      );
    }

    const session = uploadSessions.get(sessionId);

    if (!session) {
      console.log("❌ Session non trouvée:", sessionId);
      console.log(`📦 Sessions disponibles: ${uploadSessions.size}`);
      return NextResponse.json(
        {
          error: "Session expirée. Veuillez re-scanner le QR code.",
          success: false,
        },
        { status: 404 },
      );
    }

    if (session.expiresAt < Date.now()) {
      uploadSessions.delete(sessionId);
      return NextResponse.json(
        { error: "Session expirée (60 minutes)", success: false },
        { status: 410 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const { mimeType, extension } = await detectImageType(buffer);
    
    console.log(`📸 Type détecté: ${mimeType} (${extension}) pour ${type}`);

    const timestamp = Date.now();
    
    // ✅ CORRECTION: Utiliser "private" au lieu de "public"
    const blob = await put(
      `mobile-uploads/${sessionId}/${type}-${timestamp}.${extension}`,
      buffer,
      {
        access: "private", // ← Changé de "public" à "private"
        addRandomSuffix: true,
        contentType: mimeType,
      },
    );

    if (!session.files) session.files = {};
    session.files[type] = {
      url: blob.url,
      name: file.name,
      type: mimeType,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
    };

    const filesCount = Object.keys(session.files).length;

    if (filesCount === 3) {
      session.status = "completed";
      console.log("🎉 Tous les 3 fichiers reçus!");
    }

    uploadSessions.set(sessionId, session);

    console.log(`✅ Upload réussi: ${type} (${filesCount}/3) - URL: ${blob.url}`);

    return NextResponse.json({
      success: true,
      type,
      url: blob.url,
      mimeType,
      filesReceived: filesCount,
      totalExpected: 3,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'upload", success: false },
      { status: 500 },
    );
  }
}

export async function GET() {
  const uploadSessions = getUploadSessions();
  return NextResponse.json({
    message: "API upload fonctionne",
    sessionsCount: uploadSessions.size,
  });
}