// app/api/listings/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

//  FONCTION POUR GÉNÉRER UNE IMAGE PLACEHOLDER EN SVG (élégante)
function generatePlaceholderSVG(title: string = "NESTHUB"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:#bfdbfe;stop-opacity:0.1" />
      </linearGradient>
      <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="1" fill="white" opacity="0.1" />
      </pattern>
    </defs>
    
    <!-- Fond -->
    <rect width="100%" height="100%" fill="url(#grad)" />
    <rect width="100%" height="100%" fill="url(#dots)" />
    
    <!-- Formes décoratives -->
    <circle cx="450" cy="80" r="120" fill="url(#grad2)" />
    <circle cx="120" cy="320" r="100" fill="url(#grad2)" />
    
    
    
    <!-- Texte NestHub -->
    <text x="300" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" opacity="0.9">NestHub</text>
    <text x="300" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#93c5fd" opacity="0.8">Image non disponible</text>
    
    <!-- Petite ligne décorative -->
    <line x1="250" y1="300" x2="350" y2="300" stroke="white" stroke-width="1" opacity="0.3" />
  </svg>`;
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    let blobUrl = req.nextUrl.searchParams.get("url");

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!blobUrl) {
      // Retourner l'image placeholder SVG
      const svg = generatePlaceholderSVG();
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Décoder l'URL
    let finalUrl = blobUrl;
    let previousUrl = "";
    let loopCount = 0;

    while (previousUrl !== finalUrl && loopCount < 10) {
      previousUrl = finalUrl;
      try {
        finalUrl = decodeURIComponent(finalUrl);
      } catch (e) {
        break;
      }
      loopCount++;
    }

    // Extraire l'URL réelle si c'est un appel récursif
    let extractionCount = 0;
    while (finalUrl.includes("/api/listings/image") && extractionCount < 5) {
      const match = finalUrl.match(/url=([^&]+)/);
      if (match && match[1]) {
        finalUrl = decodeURIComponent(match[1]);
      } else {
        break;
      }
      extractionCount++;
    }

    // Nettoyer les caractères encodés
    finalUrl = finalUrl
      .replace(/%2F/g, "/")
      .replace(/%3A/g, ":")
      .replace(/%3F/g, "?")
      .replace(/%3D/g, "=")
      .replace(/%26/g, "&");

    // Vérifier que l'URL est valide
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      const svg = generatePlaceholderSVG();
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Récupérer l'image
    let response = await fetch(finalUrl);

    // Si échec, essayer avec le token (s'il existe)
    if (!response.ok && process.env.BLOB_READ_WRITE_TOKEN) {
      response = await fetch(finalUrl, {
        headers: {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        },
      });
    }

    // Si toujours échec, retourner le placeholder SVG
    if (!response.ok) {
      console.error("[listings/image] Échec fetch:", response.status);
      const svg = generatePlaceholderSVG();
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[listings/image] Erreur:", error);
    const svg = generatePlaceholderSVG();
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
}
