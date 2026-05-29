// scripts/sync-clerk-users.ts
import { prisma } from "../lib/prisma";
import { UserRole, AccountStatus } from "@prisma/client";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

// Définir un type pour les rôles Clerk qui correspond exactement à Prisma
type ClerkRole = "TENANT" | "PROPERTY_OWNER" | "ADMIN";

// Mapping type-safe entre Clerk et Prisma
const roleMapping: Record<ClerkRole, UserRole> = {
  TENANT: UserRole.TENANT,
  PROPERTY_OWNER: UserRole.PROPERTY_OWNER,
  ADMIN: UserRole.ADMIN,
};

interface ClerkUser {
  id: string;
  email_addresses: Array<{
    email_address: string;
    verification: { status: string };
  }>;
  phone_numbers: Array<{ phone_number: string }>;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  public_metadata: {
    role?: ClerkRole;
    preferredLocale?: string;
    phoneNumber?: string;
  };
  created_at: number;
  updated_at: number;
}

async function syncClerkUsers() {
  console.log(" Début de la synchronisation...");

  if (!CLERK_SECRET_KEY) {
    console.error(" CLERK_SECRET_KEY n'est pas défini");
    return;
  }

  try {
    const response = await fetch("https://api.clerk.com/v1/users?limit=100", {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`);
    }

    const users: ClerkUser[] = await response.json();
    console.log(` ${users.length} utilisateurs trouvés`);

    let synced = 0;

    for (const user of users) {
      const email = user.email_addresses[0]?.email_address;
      if (!email) continue;

      const clerkRole = user.public_metadata?.role || "TENANT";
      const role = roleMapping[clerkRole]; // ← TypeScript est content !

      const userData = {
        clerkId: user.id,
        email,
        username: user.username || null,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        phoneNumber: user.public_metadata?.phoneNumber || null,
        profilePictureUrl: user.image_url || null,
        preferredLocale: user.public_metadata?.preferredLocale || "fr",
        role, // ← TypeScript sait que c'est UserRole
        status: AccountStatus.PENDING_VALIDATION,
        isEmailVerified:
          user.email_addresses[0]?.verification?.status === "verified",
        updatedAt: new Date(),
      };

      await prisma.user.upsert({
        where: { clerkId: user.id },
        update: userData,
        create: userData,
      });

      console.log(` ${user.username || email} synchronisé (${role})`);
      synced++;
    }

    console.log(` ${synced} utilisateurs synchronisés !`);
  } catch (error) {
    console.error(" Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncClerkUsers();
