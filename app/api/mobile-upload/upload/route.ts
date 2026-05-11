import { NextRequest, NextResponse } from "next/server";
import { uploadSessions } from "@/lib/upload-sessions";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const type = formData.get("type") as string;
    const file = formData.get("file") as File;

    console.log("📸 Upload reçu:", { sessionId, type, fileName: file?.name });

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

    // Upload vers Vercel Blob
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    // ✅ Déterminer l'extension selon le type MIME
    const extension =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : "jpg";

    const blob = await put(
      `mobile-uploads/${sessionId}/${type}-${timestamp}.${extension}`,
      buffer,
      {
        access: "private",
        addRandomSuffix: true,
        contentType: file.type || "image/jpeg", // ✅ FORCER le contentType
      },
    );

    if (!session.files) session.files = {};
    session.files[type] = {
      url: blob.url,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    const filesCount = Object.keys(session.files).length;

    if (filesCount === 3) {
      session.status = "completed";
    }

    uploadSessions.set(sessionId, session);

    console.log("✅ Upload réussi:", type, filesCount);

    return NextResponse.json({
      success: true,
      type,
      url: blob.url,
      filesReceived: filesCount,
      totalExpected: 3,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", success: false },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "API upload fonctionne",
    sessionsCount: uploadSessions.size,
  });
}
