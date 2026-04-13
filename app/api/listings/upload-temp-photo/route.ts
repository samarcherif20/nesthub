// app/api/listings/upload-temp-photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAuth } from "@clerk/nextjs/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 30;

interface WatermarkOptions {
  text?: string;
  position?:
    | "bottom-left"
    | "bottom-right"
    | "top-left"
    | "top-right"
    | "center";
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  letterSpacing?: number;
  textColor?: string;
  showLine?: boolean;
  lineColor?: string;
  opacity?: number;
  margin?: number;
}

async function addWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {},
): Promise<Buffer> {
  const {
    text = "NESTHUB",
    position = "bottom-left",
    fontSize = 0.045,
    fontFamily = "'Helvetica Neue', 'Montserrat', 'Arial', sans-serif",
    fontWeight = "300",
    letterSpacing = 6,
    textColor = "#FFFFFF",
    showLine = true,
    lineColor = "#FFFFFF",
    opacity = 0.9,
    margin = 28,
  } = options;

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  const { width = 1200, height = 800 } = metadata;
  const calculatedFontSize = Math.floor(width * fontSize);

  let x: number;
  let y: number;
  let textAnchor: "start" | "end" = "start";
  let lineX1: number;
  let lineX2: number;

  const textWidth = calculatedFontSize * (text.length * 0.55);
  const lineY = height - margin - calculatedFontSize - 8;

  switch (position) {
    case "bottom-left":
      x = margin;
      y = height - margin;
      textAnchor = "start";
      lineX1 = margin;
      lineX2 = margin + textWidth;
      break;
    case "bottom-right":
      x = width - margin;
      y = height - margin;
      textAnchor = "end";
      lineX1 = width - margin - textWidth;
      lineX2 = width - margin;
      break;
    case "top-left":
      x = margin;
      y = margin + calculatedFontSize;
      textAnchor = "start";
      lineX1 = margin;
      lineX2 = margin + textWidth;
      break;
    case "top-right":
      x = width - margin;
      y = margin + calculatedFontSize;
      textAnchor = "end";
      lineX1 = width - margin - textWidth;
      lineX2 = width - margin;
      break;
    default:
      x = width / 2;
      y = height / 2;
      textAnchor = "middle";
      lineX1 = width / 2 - textWidth / 2;
      lineX2 = width / 2 + textWidth / 2;
  }

  const textOpacity = Math.min(Math.max(opacity, 0), 1);

  const svgWatermark = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${textColor}; stop-opacity:${textOpacity}" />
          <stop offset="100%" style="stop-color:${textColor}; stop-opacity:${textOpacity * 0.8}" />
        </linearGradient>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${lineColor}; stop-opacity:0" />
          <stop offset="40%" style="stop-color:${lineColor}; stop-opacity:${textOpacity * 0.6}" />
          <stop offset="60%" style="stop-color:${lineColor}; stop-opacity:${textOpacity * 0.6}" />
          <stop offset="100%" style="stop-color:${lineColor}; stop-opacity:0" />
        </linearGradient>
      </defs>
      
      ${
        showLine
          ? `
      <line 
        x1="${lineX1}" 
        y1="${lineY}" 
        x2="${lineX2}" 
        y2="${lineY}" 
        stroke="url(#lineGradient)"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      `
          : ""
      }
      
      <text 
        x="${x}" 
        y="${y}" 
        font-family="${fontFamily}" 
        font-size="${calculatedFontSize}" 
        font-weight="${fontWeight}"
        fill="url(#textGradient)"
        text-anchor="${textAnchor}"
        letter-spacing="${letterSpacing}"
      >
        ${text}
      </text>
    </svg>
  `;

  return await image
    .composite([
      {
        input: Buffer.from(svgWatermark),
        top: 0,
        left: 0,
        blend: "over",
      },
    ])
    .toBuffer(); // ✅ NE PAS RECOMPRESSER ICI
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("photos") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucune photo" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Format non supporté" },
        { status: 400 },
      );
    }

    // ✅ AUGMENTER LA LIMITE À 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Photo trop lourde (max 15MB)" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileExt = file.type === "image/png" ? "png" : "jpg";
    const fileName = `listings/temp/${clerkId}-${timestamp}-${randomId}`;

    // ✅ APPLIQUER LE WATERMARK SANS RECOMPRESSION
    const watermarkedBuffer = await addWatermark(buffer, {
      text: "NESTHUB",
      position: "bottom-left",
      fontSize: 0.045,
      fontFamily: "'Helvetica Neue', 'Montserrat', 'Arial', sans-serif",
      fontWeight: "300",
      letterSpacing: 6,
      textColor: "#FFFFFF",
      showLine: true,
      lineColor: "#FFFFFF",
      opacity: 0.9,
      margin: 28,
    });

    // ✅ OPTIMISATION AVEC HAUTE QUALITÉ
    // On garde la taille originale ou on la réduit intelligemment
    const optimizedBuffer = await sharp(watermarkedBuffer)
      .resize(1920, 1920, {
        fit: "inside",
        withoutEnlargement: true, // Ne pas agrandir si l'image est plus petite
      })
      .jpeg({
        quality: 92, // ✅ QUALITÉ MAXIMALE (92 au lieu de 82)
        progressive: true, // Chargement progressif
        mozjpeg: true, // Meilleure compression
      })
      .png({
        quality: 95, // ✅ Haute qualité pour PNG
        compressionLevel: 6, // Bon équilibre qualité/taille
      })
      .webp({
        quality: 90, // ✅ Haute qualité pour WebP
        lossless: false,
      })
      .toBuffer();

    // ✅ MINIATURE DE HAUTE QUALITÉ
    const thumbnailBuffer = await sharp(buffer)
      .resize(800, 800, {
        fit: "cover",
        position: "center",
      })
      .jpeg({
        quality: 85, // ✅ Miniature de bonne qualité
        progressive: true,
      })
      .toBuffer();

    // Déterminer le bon content type
    const isPng = file.type === "image/png";
    const isWebP = file.type === "image/webp";
    const finalExt = isPng ? "png" : isWebP ? "webp" : "jpg";
    const contentType = isPng
      ? "image/png"
      : isWebP
        ? "image/webp"
        : "image/jpeg";

    // Upload sur Vercel Blob
    const [mainBlob, thumbBlob] = await Promise.all([
      put(`${fileName}.${finalExt}`, optimizedBuffer, {
        access: "private",
        contentType: contentType,
        addRandomSuffix: true,
      }),
      put(`${fileName}-thumb.${finalExt}`, thumbnailBuffer, {
        access: "private",
        contentType: contentType,
        addRandomSuffix: true,
      }),
    ]);

    console.log("✅ Photo watermarkée (haute qualité):", mainBlob.url);
    console.log(
      `📊 Taille originale: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(
      `📊 Taille optimisée: ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)} MB`,
    );

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
