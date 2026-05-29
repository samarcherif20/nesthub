import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const type = formData.get("type") as string; 

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Fichier et userId requis" },
        { status: 400 }
      );
    }

    // Convertir en base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    // Config selon le type
    const folder = `nesthub/${type === "profile" ? "profiles" : "cin"}/${userId}`;
    const transformation = type === "profile" 
      ? [{ width: 400, height: 400, crop: "fill", gravity: "face" }]
      : [{ width: 1200, height: 800, crop: "fit" }];

    // Upload vers Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder,
      public_id: `${type}-${Date.now()}`,
      transformation,
    });

    console.log(` ${type} uploadée:`, uploadResponse.secure_url);

    // Sauvegarder l'URL dans Prisma selon le type
    if (type === "profile") {
      await prisma.user.update({
        where: { clerkId: userId },
        data: { profilePictureUrl: uploadResponse.secure_url },
      });
    } else if (type === "cin_recto") {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });
      if (user) {
        await prisma.identityVerification.upsert({
          where: { userId: user.id },
          update: { documentFrontUrl: uploadResponse.secure_url },
          create: {
            userId: user.id,
            documentFrontUrl: uploadResponse.secure_url,
            status: "PENDING",
          },
        });
      }
    } else if (type === "cin_verso") {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });
      if (user) {
        await prisma.identityVerification.upsert({
          where: { userId: user.id },
          update: { documentBackUrl: uploadResponse.secure_url },
          create: {
            userId: user.id,
            documentBackUrl: uploadResponse.secure_url,
            status: "PENDING",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url,
      type,
    });

  } catch (error: any) {
    console.error(" Erreur upload photo:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}