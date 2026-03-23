import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Récupérer l'userId envoyé depuis le frontend
    const { userId } = await req.json();
    
    console.log("📦 API verify-email - Données reçues:", { userId });

    // Vérifier que l'userId est présent
    if (!userId) {
      return NextResponse.json(
        { error: "userId requis" },
        { status: 400 }
      );
    }

    // Mettre à jour l'utilisateur dans la base de données
    // On utilise clerkId car c'est le champ qui contient l'ID Clerk
    const user = await prisma.user.update({
      where: { 
        clerkId: userId  // ← On utilise clerkId comme identifiant
      },
      data: {
        isEmailVerified: true,  // ← Passage de false à true
      },
    });

    console.log("✅ Email marqué comme vérifié pour l'utilisateur:", user.id);
    
    // Retourner une réponse de succès
    return NextResponse.json({ 
      success: true, 
      user 
    });
    
  } catch (error: any) {
    console.error("❌ Erreur API verify-email:", error);
    
    // Si l'utilisateur n'est pas trouvé
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }
    
    // Erreur générique
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}