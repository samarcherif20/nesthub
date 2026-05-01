// app/api/disputes/evidence/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// GET - Afficher une preuve
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    const blobUrl = req.nextUrl.searchParams.get("url");

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!blobUrl) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    // Si l'URL est déjà une URL complète (Blob)
    if (blobUrl.startsWith("http")) {
      const response = await fetch(blobUrl, {
        headers: {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        },
      });

      if (!response.ok) {
        return NextResponse.json({ error: "Image non trouvée" }, { status: 404 });
      }

      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Si l'URL est locale (/uploads/...)
    if (blobUrl.startsWith("/uploads/")) {
      const filename = blobUrl.replace("/uploads/", "");
      const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${blobUrl}`;
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        return NextResponse.json({ error: "Image non trouvée" }, { status: 404 });
      }

      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  } catch (error) {
    console.error("[disputes/evidence] GET Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}