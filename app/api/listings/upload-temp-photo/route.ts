// app/api/listings/upload-temp-photo/route.ts - CORRIGÉ
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAuth } from "@clerk/nextjs/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 30;

async function createSimpleTextWatermark(
  width: number,
  height: number,
): Promise<Buffer> {
  const fontSize = Math.floor(Math.min(width, height) * 0.045);
  const marginLeft = 20;
  const marginBottom = 30;
  const text = "N E S T H U B";
  const letterSpacing = 6;

  const svgWatermark = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="black" flood-opacity="0.6"/>
        </filter>
      </defs>
      <style>
        .watermark-text {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: ${fontSize}px;
          font-weight: 500;
          letter-spacing: ${letterSpacing}px;
          fill: #D1D5DB;
          opacity: 0.85;
          filter: url(#shadow);
        }
      </style>
      <text x="${marginLeft}" y="${height - marginBottom}" class="watermark-text">
        ${text}
      </text>
    </svg>
  `;
  return Buffer.from(svgWatermark);
}

async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const { width = 1200, height = 800 } = metadata;
  const watermarkBuffer = await createSimpleTextWatermark(width, height);
  return await image
    .composite([{ input: watermarkBuffer, top: 0, left: 0, blend: "over" }])
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    // ✅ CORRECTION: Le frontend envoie "file", pas "photos"
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucune photo" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Format non supporté" },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Photo trop lourde (max 10MB)" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileExt = file.type === "image/png" ? "png" : "jpg";
    const fileName = `listings/temp/${clerkId}-${timestamp}-${randomId}`;

    const watermarkedBuffer = await addWatermark(buffer);
    const optimizedBuffer = await sharp(watermarkedBuffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();

    const thumbnailBuffer = await sharp(buffer)
      .resize(400, 400, { fit: "cover" })
      .jpeg({ quality: 60 })
      .toBuffer();

    // app/api/listings/upload-temp-photo/route.ts - CORRECTION
    const [mainBlob, thumbBlob] = await Promise.all([
      put(`${fileName}.${fileExt}`, optimizedBuffer, {
        access: "private", // ← Change "public" en "private"
        contentType: fileExt === "png" ? "image/png" : "image/jpeg",
        addRandomSuffix: true,
      }),
      put(`${fileName}-thumb.${fileExt}`, thumbnailBuffer, {
        access: "private", // ← Change "public" en "private"
        contentType: fileExt === "png" ? "image/png" : "image/jpeg",
        addRandomSuffix: true,
      }),
    ]);

    console.log("✅ Photo uploadée avec succès:", mainBlob.url);

    return NextResponse.json({
      success: true,
      url: mainBlob.url,
      thumbnailUrl: thumbBlob.url,
    });
  } catch (error) {
    console.error("[POST /api/listings/upload-temp-photo] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
