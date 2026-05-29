// app/api/users/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// GET - Afficher l'image
export async function GET(req: NextRequest) {
  try {
    const blobUrl = req.nextUrl.searchParams.get("url");

    if (!blobUrl) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    //  Vérifier si c'est une image uploadée depuis le mobile (inscription)
    const isMobileUpload = blobUrl.includes("mobile-uploads/");

    // Pour les avatars normaux, vérifier l'authentification Clerk
    if (!isMobileUpload) {
      const { userId: clerkId } = getAuth(req);
      if (!clerkId) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }
    }

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
  } catch (error) {
    console.error("[users/avatar] GET Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Uploader une nouvelle photo de profil (inspiré de upload-cin)
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    // Vérifier le type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez JPG ou PNG." },
        { status: 400 },
      );
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 5MB)" },
        { status: 400 },
      );
    }

    console.log(" Upload avatar pour clerkId:", clerkId);

    // Lire le buffer
    const fileBuf = await file.arrayBuffer().then((b) => Buffer.from(b));

    // Upload vers Vercel Blob (comme dans upload-cin)
    const ts = Date.now();
    const blob = await put(`users/${clerkId}/avatar-${ts}`, fileBuf, {
      access: "private", // Même configuration que upload-cin
      contentType: file.type,
      addRandomSuffix: true,
    });

    console.log(" Upload avatar réussi:", blob.url);

    // Récupérer l'ancienne photo pour la supprimer plus tard
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { profilePictureUrl: true },
    });

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { clerkId },
      data: { profilePictureUrl: blob.url },
    });

    // Supprimer l'ancienne photo (si elle existe et n'est pas de Clerk)
    if (
      user?.profilePictureUrl &&
      !user.profilePictureUrl.includes("clerk.com")
    ) {
      try {
        // Extraire le pathname de l'URL
        const oldUrl = new URL(user.profilePictureUrl);
        const oldPathname = oldUrl.pathname;
        await del(oldPathname);
        console.log(" Ancienne avatar supprimée:", oldPathname);
      } catch (err) {
        console.log(" Impossible de supprimer l'ancienne image:", err);
      }
    }

    return NextResponse.json({
      success: true,
      profilePictureUrl: blob.url,
    });
  } catch (error) {
    console.error("[users/avatar] POST Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'upload" },
      { status: 500 },
    );
  }
}

// DELETE - Supprimer la photo de profil
export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { profilePictureUrl: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Supprimer le blob si ce n'est pas une image Clerk
    if (
      user.profilePictureUrl &&
      !user.profilePictureUrl.includes("clerk.com")
    ) {
      try {
        const url = new URL(user.profilePictureUrl);
        const pathname = url.pathname;
        await del(pathname);
        console.log("🗑️ Avatar supprimée:", pathname);
      } catch (err) {
        console.log("⚠️ Impossible de supprimer l'image:", err);
      }
    }

    // Mettre à null dans la base
    await prisma.user.update({
      where: { clerkId },
      data: { profilePictureUrl: null },
    });

    return NextResponse.json({
      success: true,
      message: "Photo de profil supprimée",
    });
  } catch (error) {
    console.error("[users/avatar] DELETE Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
