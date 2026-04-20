const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function debugUser() {
  const clerkId = "user_3BfqQwYb8XYIhVkre3uwArv3fZs";
  
  console.log("🔍 Recherche avec clerkId exact:", clerkId);
  
  // Recherche exacte
  const userByClerkId = await prisma.user.findUnique({
    where: { clerkId: clerkId },
  });
  
  if (userByClerkId) {
    console.log("✅ TROUVÉ par clerkId:", {
      id: userByClerkId.id,
      clerkId: userByClerkId.clerkId,
      email: userByClerkId.email,
      firstName: userByClerkId.firstName,
    });
  } else {
    console.log("❌ NON trouvé par clerkId");
    
    // Chercher tous les utilisateurs pour voir la structure
    const allUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
      }
    });
    
    console.log("\n📋 Utilisateurs dans la DB:");
    allUsers.forEach(u => {
      console.log(`  - clerkId: "${u.clerkId}", id: ${u.id}, email: ${u.email}`);
    });
  }
  
  await prisma.$disconnect();
}

debugUser();