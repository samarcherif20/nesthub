// app/api/webhook/clerk/route.ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent, DeletedObjectJSON } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole, AccountStatus } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

interface CustomPublicMetadata {
  role?: "TENANT" | "PROPERTY_OWNER" | "ADMIN";
  preferredLocale?: string;
  phoneNumber?: string;
}

interface CustomUserData {
  id: string;
  email_addresses?: Array<{
    email_address: string;
    id: string;
    verification?: {
      status: string;
    };
  }>;
  phone_numbers?: Array<{ phone_number: string }>;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  username?: string | null;
  public_metadata: CustomPublicMetadata;
  private_metadata?: Record<string, unknown>;
  unsafe_metadata?: Record<string, unknown>;
  created_at?: number;
  updated_at?: number;
}

export async function POST(req: Request) {
  // Récupérer le signing secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SIGNING_SECRET to .env");
  }

  // Récupérer les headers
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  // Récupérer le payload
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // ✅ SOLUTION: En développement, on ignore la vérification
  if (process.env.NODE_ENV === 'development') {
    console.log("🔧 Mode développement: vérification webhook ignorée");
    console.log("📦 Payload reçu:", payload);
    
    // Traiter directement le payload
    try {
      const eventType = payload.type;
      const eventData = payload.data;
      
      switch (eventType) {
        case "user.created":
        case "user.updated":
          await handleUserChange(eventData);
          break;
        case "user.deleted":
          await handleUserDeleted(eventData);
          break;
        default:
          console.log(`Unhandled event type: ${eventType}`);
      }
      
      return new Response("Webhook processed successfully (dev mode)", { status: 200 });
    } catch (error) {
      console.error("Error processing webhook in dev mode:", error);
      return new Response("Error processing webhook", { status: 500 });
    }
  }

  // En production, on vérifie la signature
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

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

  // Traiter l'événement
  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created":
      case "user.updated":
        await handleUserChange(evt.data as unknown as CustomUserData);
        break;
      case "user.deleted":
        await handleUserDeleted(evt.data as DeletedObjectJSON);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
}

// Le reste des fonctions (handleUserChange, handleUserDeleted) reste identique
async function handleUserChange(data: CustomUserData) {
  const {
    id,
    email_addresses,
    phone_numbers,
    username,
    first_name,
    last_name,
    image_url,
    public_metadata,
  } = data;

  if (!id) {
    console.error("No user ID provided");
    return;
  }

  let role: UserRole = UserRole.TENANT;

  if (public_metadata?.role) {
    switch (public_metadata.role) {
      case "PROPERTY_OWNER":
        role = UserRole.PROPERTY_OWNER;
        break;
      case "ADMIN":
        role = UserRole.ADMIN;
        break;
      default:
        role = UserRole.TENANT;
    }
  }

  const phoneNumber =
    public_metadata?.phoneNumber || phone_numbers?.[0]?.phone_number;

  const preferredLocale = public_metadata?.preferredLocale || "fr";

  const email = email_addresses?.[0]?.email_address;

  if (!email) {
    console.error("No email address provided for user", id);
    return;
  }

  const isEmailVerified =
    email_addresses?.[0]?.verification?.status === "verified";

  try {
    await prisma.user.upsert({
      where: { clerkId: id },
      update: {
        email,
        username: username ?? null,
        firstName: first_name ?? null,
        lastName: last_name ?? null,
        phoneNumber: phoneNumber ?? null,
        profilePictureUrl: image_url ?? null,
        preferredLocale,
        isEmailVerified,
        updatedAt: new Date(),
      },
      create: {
        clerkId: id,
        email,
        username: username ?? null,
        firstName: first_name ?? null,
        lastName: last_name ?? null,
        phoneNumber: phoneNumber ?? null,
        profilePictureUrl: image_url ?? null,
        preferredLocale,
        role,
        status: AccountStatus.PENDING_VALIDATION,
        isEmailVerified,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ User ${id} synced with role: ${role}`);
    console.log(`   Email: ${email}`);
    console.log(`   Username: ${username || 'Non fourni'}`);
    console.log(`   Locale: ${preferredLocale}`);
  } catch (error) {
    console.error(`Error upserting user ${id}:`, error);
    throw error;
  }
}

async function handleUserDeleted(data: DeletedObjectJSON) {
  const { id } = data;

  if (!id) {
    console.error("No user ID provided for deletion");
    return;
  }

  try {
    await prisma.user.delete({
      where: { clerkId: id },
    });
    console.log(`✅ User ${id} deleted from database`);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        console.log(`User ${id} not found in database, skipping deletion`);
      } else {
        console.error(`Error deleting user ${id}:`, error);
        throw error;
      }
    }
  }
}