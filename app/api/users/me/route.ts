import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // 1. Vérifier qui est connecté
    const { userId } = await auth();
    
    // 2. Si personne n'est connecté → erreur
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 3. Chercher l'utilisateur dans la base de données
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // 4. Renvoyer les infos
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}