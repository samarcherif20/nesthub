import { NextRequest, NextResponse } from "next/server";

declare global {
  var __uploadSessions: Map<string, any> | undefined;
}

const getUploadSessions = () => {
  if (!global.__uploadSessions) {
    global.__uploadSessions = new Map();
  }
  return global.__uploadSessions;
};

async function detectImageType(buffer: Buffer): Promise<{ mimeType: string; extension: string }> {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }
  else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { mimeType: 'image/png', extension: 'png' };
  }
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
      return NextResponse.json(
        { error: "Session expirée", success: false },
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

    // ✅ STOCKER EN MÉMOIRE (base64) - PAS D'UPLOAD VERCEL BLOB
    const base64Data = buffer.toString("base64");

    if (!session.files) session.files = {};
    
    // Stocker les données en base64 dans la session
    session.files[type] = {
      data: base64Data,
      name: file.name,
      type: mimeType,
      size: buffer.length,
      extension: extension,
      uploadedAt: new Date().toISOString(),
    };

    const filesCount = Object.keys(session.files).length;

    if (filesCount === 3) {
      session.status = "completed";
      console.log("🎉 Tous les 3 fichiers reçus en mémoire!");
    }

    uploadSessions.set(sessionId, session);

    console.log(`✅ Stockage mémoire réussi: ${type} (${filesCount}/3)`);

    return NextResponse.json({
      success: true,
      type,
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