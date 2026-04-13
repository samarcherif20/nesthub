// app/api/users/sessions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(req);
    const { id: sessionId } = await params;

    console.log("[DEBUG DELETE] Starting deletion for session:", sessionId);
    console.log("[DEBUG DELETE] Clerk ID:", clerkId);

    if (!clerkId) {
      console.log("[DEBUG DELETE] No clerkId found");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const clerk = await clerkClient();

    console.log("[DEBUG DELETE] Fetching session:", sessionId);

    // Vérifier que la session appartient à l'utilisateur
    const session = await clerk.sessions.getSession(sessionId);

    console.log(
      "[DEBUG DELETE] Session found:",
      session.id,
      "User:",
      session.userId,
    );

    if (session.userId !== clerkId) {
      console.log(
        "[DEBUG DELETE] Unauthorized - session userId:",
        session.userId,
        "clerkId:",
        clerkId,
      );
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier qu'on ne supprime pas la session actuelle
    const currentSessionId = req.headers.get("x-session-id");
    if (sessionId === currentSessionId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre session actuelle" },
        { status: 400 },
      );
    }

    // Révoquer la session
    console.log("[DEBUG DELETE] Revoking session:", sessionId);
    await clerk.sessions.revokeSession(sessionId);

    console.log("[DEBUG DELETE] Session revoked successfully");

    return NextResponse.json({
      success: true,
      message: "Session révoquée avec succès",
    });
  } catch (error: any) {
    console.error("[DELETE /api/users/sessions/:id] Erreur:", error);

    if (error.status === 404) {
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 404 },
      );
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
