// app/api/users/complete-profile/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log(" Body reçu:", body);

    const {
      userId,
      firstName,
      lastName,
      dateNaissance,
      cinNumber,
      profession,
      bio,
      phoneNumber,
      languages,
      gender,
      governorate,
      delegation,
      howFound,
      rib,
      bankName,
      accountHolder,
      cinRectoUrl,
      cinVersoUrl,
      cinData,
      profilePictureUrl,
      acceptsForeigners,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findFirst({
      where: { clerkId: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phoneNumber || undefined,
        bio: bio || undefined,
        spokenLanguages: languages || [],
        profession: profession || undefined,
        cinNumber: cinNumber || undefined,
        dateOfBirth: dateNaissance ? new Date(dateNaissance) : undefined,
        governorate: governorate || undefined,
        delegation: delegation || undefined,
        gender: gender || undefined,
        howFound: howFound || undefined,
        rib: rib || undefined,
        bankName: bankName || undefined,
        accountHolder: accountHolder || undefined,
        profilePictureUrl: profilePictureUrl || undefined,
        cinData: cinData || undefined,
        isEmailVerified: true,
        acceptsForeigners:
          acceptsForeigners !== undefined ? acceptsForeigners : null,

        status: "PENDING_VALIDATION",
      },
    });

    console.log(" Utilisateur mis à jour:", {
      id: updatedUser.id,
      role: updatedUser.role,
      gender: updatedUser.gender,
      hasCinData: !!updatedUser.cinData,
    });

    // 1. Create/Update IdentityVerification
    if (cinNumber || dateNaissance) {
      await prisma.identityVerification.upsert({
        where: { userId: updatedUser.id },
        update: {
          submissionDate: new Date(),
          status: "PENDING",
          documentFrontUrl: cinRectoUrl || cinData?.rectoUrl || null,
          documentBackUrl: cinVersoUrl || cinData?.versoUrl || null,
          adminComment: `CIN: ${cinNumber || "N/A"} | Né(e) le: ${dateNaissance || "N/A"}`,
        },
        create: {
          userId: updatedUser.id,
          submissionDate: new Date(),
          status: "PENDING",
          documentFrontUrl: cinRectoUrl || cinData?.rectoUrl || null,
          documentBackUrl: cinVersoUrl || cinData?.versoUrl || null,
          adminComment: `CIN: ${cinNumber || "N/A"} | Né(e) le: ${dateNaissance || "N/A"}`,
        },
      });
    }

    // 2. Create VerificationRequest for admin dashboard
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId: updatedUser.id,
        documentFrontUrl: cinRectoUrl || cinData?.rectoUrl || "",
        documentBackUrl: cinVersoUrl || cinData?.versoUrl || "",
        selfieUrl: profilePictureUrl || null,
        extractedData: {
          firstName,
          lastName,
          cinNumber,
          dateOfBirth: dateNaissance,
          profession,
          governorate,
          delegation,
        },
        status: "PENDING",
        submittedAt: new Date(),
      },
    });

    console.log(" VerificationRequest créée:", verificationRequest.id);

    //  NOTIFICATION 1: Pour l'utilisateur

    // Vérifier si une notification similaire existe déjà et n'est pas lue
    const existingUserNotification = await prisma.notification.findFirst({
      where: {
        userId: updatedUser.id,
        type: "SYSTEM_ALERT",
        title: " Profil en attente de validation",
        isRead: false,
      },
    });

    if (!existingUserNotification) {
      await prisma.notification.create({
        data: {
          userId: updatedUser.id,
          type: "SYSTEM_ALERT",
          title: " Profil en attente de validation",
          content: `Bonjour ${firstName || ""} ${lastName || ""}, votre profil a été soumis avec succès. Nos équipes vont vérifier vos informations dans les plus brefs délais. Vous serez notifié dès que votre compte sera activé.`,
          channels: ["IN_APP"],
          data: {
            status: "PENDING_VALIDATION",
            verificationRequestId: verificationRequest.id,
            submittedAt: new Date().toISOString(),
          },
          isRead: false,
          sentAt: new Date(),
        },
      });
      console.log(" Notification utilisateur créée");
    } else {
      console.log(" Notification utilisateur déjà existante, ignorée");
    }

    //  NOTIFICATION 2: Pour les admins

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    for (const admin of admins) {
      // Vérifier si une notification similaire existe déjà pour cette demande
      const existingAdminNotification = await prisma.notification.findFirst({
        where: {
          userId: admin.id,
          type: "SYSTEM_ALERT",
          title: " Nouvelle demande de vérification",
          isRead: false,
          data: {
            path: ["verificationRequestId"],
            equals: verificationRequest.id,
          },
        },
      });

      if (!existingAdminNotification) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "SYSTEM_ALERT",
            title: " Nouvelle demande de vérification",
            content: `L'utilisateur ${firstName || ""} ${lastName || ""} (${updatedUser.email}) a soumis son profil pour validation. Veuillez vérifier ses documents.`,
            channels: ["IN_APP", "EMAIL"],
            data: {
              type: "VERIFICATION_REQUEST",
              userId: updatedUser.id,
              userName: `${firstName} ${lastName}`,
              userEmail: updatedUser.email,
              verificationRequestId: verificationRequest.id,
              submittedAt: new Date().toISOString(),
            },
            isRead: false,
            sentAt: new Date(),
          },
        });
      }
    }

    console.log(` Notifications envoyées (ou ignorées si déjà existantes)`);

    return NextResponse.json({
      success: true,
      message:
        "Profil complété avec succès. En attente de validation par l'admin.",
      user: updatedUser,
      verificationRequestId: verificationRequest.id,
    });
  } catch (error: any) {
    console.error(" Erreur complete-profile:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
