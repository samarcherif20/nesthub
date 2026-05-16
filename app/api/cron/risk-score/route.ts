// app/api/cron/risk-score/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dailyRiskScoreUpdate } from "@/lib/risk-scoring";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    await dailyRiskScoreUpdate();
    return NextResponse.json({ success: true, message: "Cron exécuté" });
  } catch (error) {
    console.error("[CRON] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}