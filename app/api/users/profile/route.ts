import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type UserType = "tenant" | "owner" | "professional";

interface AvailabilitySlot {
  day: string;
  hours: string;
  enabled: boolean;
}

interface UpdateProfileBody {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  userType: UserType;
  bio: string;
  profession: string;
  languages: string[];
  availability: AvailabilitySlot[];
}

function mapRoleToUserType(role: string): UserType {
  switch (role) {
    case "TENANT":
      return "tenant";
    case "PROPERTY_OWNER":
      return "owner";
    case "BOTH":
      return "professional";
    default:
      return "tenant";
  }
}

function mapUserTypeToRole(userType: UserType): string {
  switch (userType) {
    case "tenant":
      return "TENANT";
    case "owner":
      return "PROPERTY_OWNER";
    case "professional":
      return "BOTH";
    default:
      return "TENANT";
  }
}

function defaultAvailability(): AvailabilitySlot[] {
  return [
    { day: "Lun - Ven", hours: "09:00 - 19:00", enabled: true },
    { day: "Samedi", hours: "10:00 - 15:00", enabled: true },
    { day: "Dimanche", hours: "Fermé", enabled: false },
  ];
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        stats: true,
        verificationRequests: {
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Calculer le trust score
    let trustScore = user.stats?.reliabilityScore || 50;

    // Compter les avis positifs
    const positiveReviews = await prisma.review.count({
      where: {
        targetId: user.id,
        rating: { gte: 4 },
      },
    });

    // Dernière vérification d'identité
    const lastVerification = user.verificationRequests[0];
    const idVerified = user.isIdentityVerified;
    const idVerifiedDate = lastVerification?.processedAt
      ? lastVerification.processedAt.toLocaleDateString("fr-FR")
      : null;

    // Récupérer ou créer les disponibilités
    let availability = defaultAvailability();
    if (user.availability) {
      try {
        availability =
          typeof user.availability === "string"
            ? JSON.parse(user.availability)
            : (user.availability as AvailabilitySlot[]);
      } catch {
        availability = defaultAvailability();
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phone: user.phoneNumber || "",
        phoneVerified: user.isPhoneVerified,
        userType: mapRoleToUserType(user.role),
        bio: user.bio || "",
        profession: user.profession || null,
        languages: user.spokenLanguages || [],
        profilePictureUrl: user.profilePictureUrl,
        availability,
        trustScore,
        memberSince: user.createdAt.getFullYear().toString(),
        positiveReviews,
        idVerified,
        idVerifiedDate,
        emailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("[users/profile] GET Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body: UpdateProfileBody = await req.json();
    console.log(" [API] Données reçues:", JSON.stringify(body, null, 2));

    const {
      firstName,
      lastName,
      username,
      phone,
      userType,
      bio,
      profession,
      languages,
      availability,
    } = body;

    const role = mapUserTypeToRole(userType);

    // Vérifier si le username est déjà pris par un autre utilisateur
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { clerkId },
        },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Ce nom d'utilisateur est déjà pris" },
          { status: 400 },
        );
      }
    }

    console.log(" [API] Availability à sauvegarder:", availability);

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        firstName,
        lastName,
        username,
        phoneNumber: phone,
        role,
        bio,
        profession,
        spokenLanguages: languages,
        availability: JSON.stringify(availability),
      },
    });

    console.log(" [API] Utilisateur mis à jour:", updatedUser.id);
    console.log(" [API] Availability sauvegardée:", updatedUser.availability);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        phone: updatedUser.phoneNumber,
        userType: mapRoleToUserType(updatedUser.role),
        bio: updatedUser.bio,
        profession: updatedUser.profession,
        languages: updatedUser.spokenLanguages,
        availability: availability,
      },
    });
  } catch (error) {
    console.error(" [API] Erreur sauvegarde:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}