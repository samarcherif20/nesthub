// app/api/listings/[id]/qrcode/route.ts
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const baseUrl =
      searchParams.get("baseUrl") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const locale = searchParams.get("locale") || "fr";
    const withGradient = searchParams.get("gradient") !== "false";
    const withLogo = searchParams.get("logo") !== "false";

    // URL de l'annonce
    const url = `${baseUrl}/${locale}/dashboard/owner/listings/${id}`;
    const size = 400;

    // 1. Générer le QR code
    const qrSvg = await QRCode.toString(url, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#ffffff" },
      type: "svg",
    });

    // 2. Convertir SVG en PNG
    let qrBuffer = await sharp(Buffer.from(qrSvg)).png().toBuffer();

    // 3. Appliquer le dégradé si demandé
    if (withGradient) {
      const gradientBuffer = await createGradientOverlay(size, size);
      qrBuffer = await sharp(qrBuffer)
        .composite([{ input: gradientBuffer, blend: "multiply" }])
        .png()
        .toBuffer();
    }

    // 4. Ajouter le logo au centre
    let finalBuffer = qrBuffer;
    if (withLogo) {
      finalBuffer = await addLogoToQRCode(qrBuffer, size);
    }

    // 5. Convertir le buffer en base64 pour le retour JSON
    const base64Image = finalBuffer.toString("base64");
    const qrCodeDataUrl = `data:image/png;base64,${base64Image}`;

    // Retourner du JSON (compatible avec ton modal qui attend res.json())
    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl,
      url: url,
    });
  } catch (error) {
    console.error("[GET /api/listings/:id/qrcode] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du QR code" },
      { status: 500 },
    );
  }
}

// Fonction pour créer un overlay de dégradé
async function createGradientOverlay(
  width: number,
  height: number,
): Promise<Buffer> {
  const svgGradient = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.85" />
          <stop offset="33%" stop-color="#7c3aed" stop-opacity="0.85" />
          <stop offset="66%" stop-color="#06b6d4" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#00c6fb" stop-opacity="0.85" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `;

  return sharp(Buffer.from(svgGradient)).png().toBuffer();
}

// Fonction pour trouver le logo
function findLogoPath(): string | null {
  const possiblePaths = [
    path.join(process.cwd(), "public", "logo", "logo.png"),
    path.join(process.cwd(), "public", "logo", "logo.svg"),
    path.join(process.cwd(), "public", "logo.png"),
    path.join(process.cwd(), "public", "nesthub-logo.png"),
    path.join(process.cwd(), "public", "favicon.png"),
    path.join(process.cwd(), "public", "favicon.ico"),
  ];

  for (const logoPath of possiblePaths) {
    if (fs.existsSync(logoPath)) {
      return logoPath;
    }
  }
  return null;
}

// Fonction pour ajouter un logo au centre du QR code
async function addLogoToQRCode(qrBuffer: Buffer, size: number): Promise<Buffer> {
  try {
    const logoPath = findLogoPath();

    if (!logoPath) {
      console.log("Logo non trouvé, génération sans logo");
      return qrBuffer;
    }

    const logoSize = 80;
    const logoPadding = 10;
    const innerSize = logoSize + logoPadding * 2;
    const position = (size - innerSize) / 2;

    // Vérifier les dimensions du logo
    const logoMetadata = await sharp(logoPath).metadata();
    const finalLogoSize = Math.min(
      logoSize,
      logoMetadata.width || logoSize,
      logoMetadata.height || logoSize,
    );

    // Créer un masque blanc pour le centre
    const whiteCircle = await sharp({
      create: {
        width: innerSize,
        height: innerSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    let result = qrBuffer;

    // Appliquer le fond blanc
    result = await sharp(result)
      .composite([
        {
          input: whiteCircle,
          top: Math.round(position),
          left: Math.round(position),
        },
      ])
      .png()
      .toBuffer();

    // Ajouter le logo
    result = await sharp(result)
      .composite([
        {
          input: logoPath,
          top: Math.round(position + logoPadding),
          left: Math.round(position + logoPadding),
          width: finalLogoSize,
          height: finalLogoSize,
          fit: "contain",
        },
      ])
      .png()
      .toBuffer();

    return result;
  } catch (error) {
    console.error("Erreur lors de l'ajout du logo:", error);
    return qrBuffer;
  }
}