import { PrismaClient } from "@prisma/client";

// TypeScript : étend l'objet global pour stocker Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// CRÉER OU RÉUTILISER PRISMA
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// DÉVELOPPEMENT : STOCKER GLOBALEMENT
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
