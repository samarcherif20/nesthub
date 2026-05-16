// app/api/webhook/clerk/route.ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent, DeletedObjectJSON } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole, AccountStatus } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";
import { onUserVerified } from "@/lib/risk-scoring";

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
  last_sign_in_at?: number | null;
}

export async function POST(req: Request) {
  // Récupérer le signing secret

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SIGNING_SECRET");
    return NextResponse.json({ error: "No webhook secret" }, { status: 500 });
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
  if (process.env.NODE_ENV === "development") {
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

      return NextResponse.json(
        { success: true, mode: "development" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error processing webhook in dev mode:", error);
      return NextResponse.json(
        { error: "Error processing webhook" },
        { status: 500 },
      );
    }
  }

  // En production, on vérifie la signature
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
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
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 },
    );
  }
}

async function handleUserChange(data: CustomUserData) {
  const {
    id: realClerkId,
    email_addresses,
    phone_numbers,
    username,
    first_name,
    last_name,
    image_url,
    public_metadata,
    last_sign_in_at,
  } = data;

  if (!realClerkId) {
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
    console.error("No email address provided for user", realClerkId);
    return;
  }

  const isEmailVerified =
    email_addresses?.[0]?.verification?.status === "verified";

  try {
    const lastLoginDate = last_sign_in_at ? new Date(last_sign_in_at) : null;
    const isAdmin = role === UserRole.ADMIN;
    const accountStatus = isAdmin
      ? AccountStatus.ACTIVE
      : AccountStatus.PENDING_VALIDATION;
    const isIdentityVerified = isAdmin;
    const verifiedAt = isAdmin ? new Date() : null;

    // ✅ Helper to sync role to Clerk public metadata
    const syncClerkMetadata = async () => {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        await client.users.updateUser(realClerkId, {
          publicMetadata: { role },
        });
        console.log(`✅ Clerk public metadata updated: role=${role}`);
      } catch (clerkError) {
        console.error(
          "⚠️ Failed to update Clerk metadata (non-blocking):",
          clerkError,
        );
      }
    };

    // Find by clerkId first
    let existingUser = await prisma.user.findUnique({
      where: { clerkId: realClerkId },
    });

    // Fallback: find by email (catches sua_xxx → user_xxx transition)
    if (!existingUser) {
      existingUser = await prisma.user.findFirst({
        where: { email },
      });

      if (existingUser) {
        console.log(`🔍 Found existing user by email: ${email}`);
        console.log(`   Old clerkId: ${existingUser.clerkId}`);
        console.log(`   New clerkId: ${realClerkId}`);
      }
    }

    if (existingUser) {
      // Sauvegarder l'ancien statut email pour détecter le changement
      const wasEmailVerified = existingUser.isEmailVerified;
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          clerkId: realClerkId,
          email,
          username: username ?? existingUser.username,
          firstName: first_name ?? existingUser.firstName,
          lastName: last_name ?? existingUser.lastName,
          phoneNumber: phoneNumber ?? existingUser.phoneNumber,
          profilePictureUrl: image_url ?? existingUser.profilePictureUrl,
          preferredLocale,
          role,
          status: accountStatus,
          isEmailVerified,
          isIdentityVerified:
            isIdentityVerified || existingUser.isIdentityVerified,
          verifiedAt: isIdentityVerified ? verifiedAt : existingUser.verifiedAt,
          lastLogin: lastLoginDate,
          updatedAt: new Date(),
        },
      });
      // ✅ Vérifier si l'email vient d'être vérifié
      if (isEmailVerified && !wasEmailVerified) {
        console.log(`📧 Email fraîchement vérifié pour ${existingUser.id}`);
        await onUserVerified(existingUser.id);
      }
      // ✅ Sync role to Clerk public metadata
      await syncClerkMetadata();

      console.log(`✅ User updated successfully!`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   clerkId: ${realClerkId} (was ${existingUser.clerkId})`);
      console.log(`   Email: ${email}`);
      console.log(`   Email verified: ${isEmailVerified}`);
      console.log(`   Status: ${accountStatus}`);
    } else {
      console.log(
        `⚠️ No existing user found for email ${email}, creating new record`,
      );
      await prisma.user.create({
        data: {
          clerkId: realClerkId,
          email,
          username: username ?? null,
          firstName: first_name ?? null,
          lastName: last_name ?? null,
          phoneNumber: phoneNumber ?? null,
          profilePictureUrl: image_url ?? null,
          preferredLocale,
          role,
          status: accountStatus,
          isEmailVerified,
          isIdentityVerified,
          verifiedAt,
          lastLogin: lastLoginDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // ✅ Sync role to Clerk public metadata
      await syncClerkMetadata();

      console.log(`✅ New user created: ${realClerkId}`);
    }
  } catch (error) {
    console.error(`Error upserting user ${realClerkId}:`, error);
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
    } else {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
}
