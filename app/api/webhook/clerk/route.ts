import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No webhook secret" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── User créé dans Clerk (après vérification email) ──
  if (evt.type === "user.created") {
    const { id, email_addresses, username } = evt.data;
    const email = email_addresses[0]?.email_address;

    try {
      // Mettre à jour le user existant (créé avec sua_xxx)
      // ou créer s'il n'existe pas
      const existing = await prisma.user.findFirst({
        where: { email },
      });

      if (existing) {
        // Mettre à jour le clerkId avec le vrai ID
        await prisma.user.update({
          where: { email },
          data: { 
            clerkId: id,
            isEmailVerified: true,
          },
        });

        // Mettre à jour aussi les OtpCodes qui utilisaient l'ancien ID
        await prisma.otpCode.updateMany({
          where: { userId: existing.id },
          data: { userId: existing.id },
        });

        console.log("✅ Webhook: clerkId mis à jour pour", email);
      }
    } catch (error) {
      console.error("❌ Webhook erreur:", error);
    }
  }

  return NextResponse.json({ success: true });
}