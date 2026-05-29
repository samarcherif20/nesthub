// app/api/webhook/clerk/session/route.ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_SESSION_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_SESSION_WEBHOOK_SECRET");
  }

  // Vérification signature (identique à ton autre webhook)
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  if (evt.type === "session.created") {
    const { user_id, id: sessionId } = evt.data;
    
    try {
      // Récupérer l'IP et user agent depuis les headers
      const ip = req.headers.get("x-forwarded-for") || "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";

      // Trouver l'utilisateur dans ta DB
      const user = await prisma.user.findUnique({
        where: { clerkId: user_id }
      });

      if (user) {
        // Mettre à jour lastLogin
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });

        // Créer l'historique
        await prisma.userLoginHistory.create({
          data: {
            userId: user.id,
            ipAddress: ip,
            userAgent: userAgent,
            success: true,
          }
        });

        console.log(` Session créée pour ${user.email}`);
      }
    } catch (error) {
      console.error("Error recording session:", error);
    }
  }

  return new Response("OK", { status: 200 });
}