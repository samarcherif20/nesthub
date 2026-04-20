import { NextResponse } from "next/server";
import { getModelStatus } from "@/lib/ai-moderation";

export async function GET() {
  const status = await getModelStatus();
  return NextResponse.json(status);
}
