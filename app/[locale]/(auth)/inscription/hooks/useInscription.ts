import { useState, useEffect, useCallback } from "react";
import { useSignUp, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ValidationPatterns } from "@/lib/utils";

export function useInscription() {
  const t = useTranslations("Inscription");
  const locale = useLocale();

  const { isLoaded, signUp, setActive } = useSignUp();
  const { signOut } = useClerk();
  const { isLoaded: isUserLoaded, user } = useUser();
  const router = useRouter();
  const { theme } = useTheme();
  const [governorate, setGovernorate] = useState("");
  const [delegation, setDelegation] = useState("");
  const [gender, setGender] = useState("");

  // TOUS LES ÉTATS
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showWhatsappAlert, setShowWhatsappAlert] = useState(false);
  const [whatsappAlertMessage, setWhatsappAlertMessage] = useState("");
  const [cinData, setCinData] = useState<any>(null);

  // URLs des documents uploadés
  const [cinRectoUrl, setCinRectoUrl] = useState<string | null>(null);
  const [cinVersoUrl, setCinVersoUrl] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );

  // Étape 2 - Identité
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [touchedStep2, setTouchedStep2] = useState({
    firstName: false,
    lastName: false,
    phoneNumber: false,
  });

  // Étape 1 - Compte
  const [role, setRole] = useState<"landlord" | "tenant" | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Étape 4 - Documents
  const [cinRecto, setCinRecto] = useState<File | null>(null);
  const [cinVerso, setCinVerso] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [dateNaissance, setDateNaissance] = useState("");
  const [cinNumber, setCinNumber] = useState("");
  const [profession, setProfession] = useState("");
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [documentType, setDocumentType] = useState<"cin" | "passport">("cin");

  // États pour le PASSEPORT
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportUrl, setPassportUrl] = useState<string | null>(null);
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiryDate, setPassportExpiryDate] = useState("");
  const [passportCountry, setPassportCountry] = useState("");
  // Étape 3 - WhatsApp
  const [whatsappCode, setWhatsappCode] = useState("");
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState("");

  // Modals & UI
  const [showOcrConfirm, setShowOcrConfirm] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperSide, setCropperSide] = useState<"recto" | "verso">("recto");
  const [showWelcome, setShowWelcome] = useState(false);

  // Validation d'unicité
  const [emailError, setEmailError] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  // Upload CIN
  const [isUploadingCIN, setIsUploadingCIN] = useState(false);
  const [uploadCINError, setUploadCINError] = useState("");

  // Utilisateur
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [phoneNumberResourceId, setPhoneNumberResourceId] = useState<
    string | null
  >(null);
  // Ajoute ces états vers la ligne ~180, après les autres useState
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isMobileUploading, setIsMobileUploading] = useState(false);

  // FONCTION RESET
  const resetForm = useCallback(() => {
    console.log(" Reset complet du formulaire...");

    setRole(null);
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPasswordStrength(0);
    setCurrentStep(1);
    setFormError("");
    setTouched({
      username: false,
      email: false,
      password: false,
      confirmPassword: false,
    });
    setAcceptTerms(false);
    setShowPassword(false);
    setShowConfirmPassword(false);

    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setBio("");
    setTouchedStep2({
      firstName: false,
      lastName: false,
      phoneNumber: false,
    });
    setGovernorate("");
    setDelegation("");
    setGender("");

    setWhatsappCode("");
    setWhatsappError("");
    setIsWhatsappLoading(false);

    setCinRecto(null);
    setCinVerso(null);
    setProfilePhoto(null);
    setDateNaissance("");
    setCinNumber("");
    setProfession("");
    setIsOcrLoading(false);

    setCinRectoUrl(null);
    setCinVersoUrl(null);
    setProfilePictureUrl(null);
    setCinData(null);

    setIsUploadingCIN(false);
    setUploadCINError("");

    setDocumentType("cin");
    setPassportFile(null);
    setPassportUrl(null);
    setPassportNumber("");
    setPassportExpiryDate("");
    setPassportCountry("");

    setEmailError("");
    setUsernameError("");
    setPhoneError("");
    setFormError("");

    setShowOcrConfirm(false);
    setShowWelcome(false);
    setShowSuccessAlert(false);
    setShowWhatsappAlert(false);

    localStorage.removeItem("nesthub_inscription_draft_v2");
    localStorage.removeItem("currentUserId");
    setCurrentUserId(null);

    console.log(" Reset terminé");
  }, []);

  // FONCTION OCR

  const handleOCR = useCallback(async (file: File, side: "recto" | "verso") => {
    try {
      setIsOcrLoading(true);
      console.log(` OCR ${side} démarré pour:`, file.name);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("side", side);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn(` OCR ${side} échoué:`, data.error);
        toast.warning(t("ocr.notAvailable", { side }), {
          description: t("ocr.fillManually"),
        });
        return null;
      }

      console.log(` OCR ${side} réussi:`, data);

      if (side === "recto") {
        if (data.firstName && !firstName) setFirstName(data.firstName);
        if (data.lastName && !lastName) setLastName(data.lastName);
        if (data.dateOfBirth && !dateNaissance)
          setDateNaissance(data.dateOfBirth);
        if (data.cinNumber && !cinNumber) setCinNumber(data.cinNumber);
      } else if (side === "verso") {
        if (data.profession && !profession) setProfession(data.profession);
      }

      toast.success(t("ocr.success", { side }), {
        description: t("ocr.extractedSuccess"),
      });

      return data.extracted || null;
    } catch (error) {
      console.error(` Erreur OCR ${side}:`, error);
      toast.error(t("ocr.errorTitle", { side }), {
        description:
          error instanceof Error ? error.message : t("ocr.fillManually"),
      });
      return null;
    } finally {
      setIsOcrLoading(false);
    }
  }, []);

  // VALIDATION D'UNICITÉ
  const checkEmailExists = async (emailValue: string): Promise<boolean> => {
    if (!emailValue || !ValidationPatterns.isEmail(emailValue)) return false;
    try {
      const response = await fetch(
        `/api/users/by-email/${encodeURIComponent(emailValue)}`,
      );
      if (response.status === 404) return false;
      if (response.ok) {
        const userData = await response.json();
        const currentId = localStorage.getItem("currentUserId");
        return userData.id !== currentId;
      }
      return false;
    } catch (error) {
      console.error("Erreur vérification email:", error);
      return false;
    }
  };

  const checkUsernameExists = async (
    usernameValue: string,
  ): Promise<boolean> => {
    if (!usernameValue || !ValidationPatterns.isUsername(usernameValue))
      return false;
    try {
      const response = await fetch(
        `/api/users/by-username/${encodeURIComponent(usernameValue)}`,
      );
      if (response.status === 404) return false;
      if (response.ok) {
        const userData = await response.json();
        const currentId = localStorage.getItem("currentUserId");
        return userData.id !== currentId;
      }
      return false;
    } catch (error) {
      console.error("Erreur vérification username:", error);
      return false;
    }
  };

  const checkPhoneExists = async (phoneValue: string): Promise<boolean> => {
    if (!phoneValue) return false;
    try {
      const response = await fetch(
        `/api/users/by-phone/${encodeURIComponent(phoneValue)}`,
      );
      if (response.status === 404) return false;
      if (response.ok) {
        const userData = await response.json();
        const currentId = localStorage.getItem("currentUserId");
        return userData.id !== currentId;
      }
      return false;
    } catch (error) {
      console.error("Erreur vérification téléphone:", error);
      return false;
    }
  };

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const validateEmailUniqueness = useCallback(
    debounce(async (value: string) => {
      if (!value) {
        setEmailError("");
        return;
      }
      if (!ValidationPatterns.isEmail(value)) {
        setEmailError(t("errors.emailInvalid"));
        return;
      }
      setIsCheckingEmail(true);
      const exists = await checkEmailExists(value);
      setIsCheckingEmail(false);
      if (exists) {
        setEmailError(t("errors.emailAlreadyExists"));
      } else {
        setEmailError("");
      }
    }, 500),
    [t],
  );

  const validateUsernameUniqueness = useCallback(
    debounce(async (value: string) => {
      if (!value) {
        setUsernameError("");
        return;
      }
      if (!ValidationPatterns.isUsername(value)) {
        setUsernameError(t("errors.usernameInvalid"));
        return;
      }
      setIsCheckingUsername(true);
      const exists = await checkUsernameExists(value);
      setIsCheckingUsername(false);
      if (exists) {
        setUsernameError(t("errors.usernameAlreadyExists"));
      } else {
        setUsernameError("");
      }
    }, 500),
    [t],
  );

  const validatePhoneUniqueness = useCallback(
    debounce(async (value: string) => {
      if (!value) {
        setPhoneError("");
        return;
      }
      const formattedPhone = `+216${value}`;
      if (value.length < 8) return;
      setIsCheckingPhone(true);
      const exists = await checkPhoneExists(formattedPhone);
      setIsCheckingPhone(false);
      if (exists) {
        setPhoneError(t("errors.phoneAlreadyExists"));
      } else {
        setPhoneError("");
      }
    }, 500),
    [t],
  );

  // EFFETS
  useEffect(() => {
    setMounted(true);
    const savedUserId = localStorage.getItem("currentUserId");
    if (savedUserId) {
      setCurrentUserId(savedUserId);
      console.log("ID restauré depuis localStorage:", savedUserId);
    }

    const params = new URLSearchParams(window.location.search);
    const clerkStatus = params.get("__clerk_status");
    const error = params.get("error");

    // Handle invalid link error
    if (error === "invalid_link") {
      toast.error(t("errors.linkInvalid"), {
        description: t("errors.linkInvalidDescription"),
      });
      window.history.replaceState({}, "", `/${locale}/inscription`);
      return;
    }

    // Handle expired link error
    if (error === "link_expired") {
      toast.error(t("errors.linkExpired"), {
        description: t("errors.linkExpiredDescription"),
      });
      window.history.replaceState({}, "", `/${locale}/inscription`);
      return;
    }

    // Handle successful verification
    if (params.get("verified") === "true" || clerkStatus === "verified") {
      console.log(" Email vérifié - Passage à l'étape 2");
      setCurrentStep(2);
      setPendingVerification(false);
      window.history.replaceState({}, "", `/${locale}/inscription`);
      toast.success(t("alerts.emailVerified"), {
        description: t("alerts.continueInscription"),
      });
    }
  }, [locale, t]);

  useEffect(() => {
    if (isUserLoaded && user && user.id) {
      const tempId = localStorage.getItem("currentUserId");
      if (tempId && tempId !== user.id && tempId.startsWith("sua_")) {
        console.log("Real Clerk user detected! Syncing ID...");
        fetch("/api/users/update-clerk-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldClerkId: tempId,
            newClerkId: user.id,
          }),
        })
          .then(() => {
            localStorage.setItem("currentUserId", user.id);
            setCurrentUserId(user.id);
            console.log("Database updated with real Clerk ID:", user.id);
          })
          .catch(console.error);
      }
    }
  }, [isUserLoaded, user]);

  useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 8) {
      validatePhoneUniqueness(phoneNumber);
    } else {
      setPhoneError("");
    }
  }, [phoneNumber, validatePhoneUniqueness]);
  // Ajoute ce useEffect pour surveiller les changements de cinData
  useEffect(() => {
    if (cinData && Object.keys(cinData).length > 0) {
      console.log(" cinData CHANGÉ dans le modal:", cinData);
      // Force un petit délai pour que React ait le temps de re-rendre
      setTimeout(() => {
        console.log(
          " Modal devrait maintenant afficher:",
          cinData.firstName,
          cinData.lastName,
        );
      }, 100);
    }
  }, [cinData]);
  const handleUploadCIN = async (): Promise<boolean> => {
    const userId = currentUserId || localStorage.getItem("currentUserId");
    if (!userId) {
      setUploadCINError(t("errors.userNotFound"));
      toast.error(t("errors.error"), { description: t("errors.userNotFound") });
      return false;
    }

    setIsUploadingCIN(true);
    setUploadCINError("");

    try {
      //  CAS 1: PASSEPORT
      if (documentType === "passport") {
        // Vérifier qu'on a les fichiers nécessaires
        if (!passportFile && !passportUrl) {
          setUploadCINError(t("errors.passportRequired"));
          toast.error(t("errors.error"), {
            description: t("errors.passportRequired"),
          });
          return false;
        }

        let finalPassportFile = passportFile;
        let finalProfileFile = profilePhoto;

        // CAS MOBILE: on a des URLs, pas des fichiers
        if (passportUrl && !passportFile) {
          console.log(" Upload mobile détecté (passeport)");
          const urlToFile = async (
            url: string,
            filename: string,
          ): Promise<File> => {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], filename, { type: blob.type });
          };

          const [passportFileConverted, profileFileConverted] =
            await Promise.all([
              urlToFile(passportUrl, "passport.jpg"),
              profilePictureUrl
                ? urlToFile(profilePictureUrl, "selfie.jpg")
                : Promise.resolve(null),
            ]);

          finalPassportFile = passportFileConverted;
          finalProfileFile = profileFileConverted;
        }

        // Validation finale
        if (!finalPassportFile) {
          setUploadCINError(t("errors.passportFileMissing"));
          return false;
        }

        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("documentType", "passport");
        formData.append("passportFile", finalPassportFile);
        if (finalProfileFile) formData.append("profilePhoto", finalProfileFile);

        const res = await fetch("/api/registration/upload-document", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur upload");

        // Sauvegarder les URLs
        if (data.urls?.passport) setPassportUrl(data.urls.passport);
        if (data.urls?.profilePhoto)
          setProfilePictureUrl(data.urls.profilePhoto);

        // Créer les données extraites
        if (data.extracted) {
          const imageUrl = data.urls?.passport || passportUrl;

          const newDocumentData = {
            documentType: "PASSPORT",
            passportNumber: data.extracted.passportNumber || null,
            firstName: data.extracted.firstName || null,
            lastName: data.extracted.lastName || null,
            dateOfBirth: data.extracted.dateOfBirth || null,
            expiryDate: data.extracted.expiryDate || null,
            sex: data.extracted.sex || null,
            profession: data.extracted.profession || null,
            cinNumber: data.extracted.cinNumber || null,
            country: data.extracted.country || null,
            extractedAt: new Date().toISOString(),
            documentUrl: imageUrl,
            passportUrl: imageUrl,
            imageUrl: imageUrl,
          };

          setCinData(newDocumentData);
          setShowOcrConfirm(true);

          // Remplir automatiquement les champs

          if (data.extracted.dateOfBirth && !dateNaissance)
            setDateNaissance(data.extracted.dateOfBirth);
          if (data.extracted.passportNumber && !passportNumber)
            setPassportNumber(data.extracted.passportNumber);
          if (data.extracted.expiryDate && !passportExpiryDate)
            setPassportExpiryDate(data.extracted.expiryDate);
          if (data.extracted.sex && !gender) setGender(data.extracted.sex);
          if (data.extracted.profession && !profession)
            setProfession(data.extracted.profession);
          if (data.extracted.country && !passportCountry)
            setPassportCountry(data.extracted.country);
          if (data.extracted.cinNumber && !cinNumber)
            setCinNumber(data.extracted.cinNumber);
        }
        toast.success(t("passport.analyzed"), {
          description: data.extracted?.passportNumber
            ? t("passport.numberDetected", {
                number: data.extracted.passportNumber,
              })
            : t("passport.uploadSuccess"),
        });

        return true;
      }

      //  CAS 2: CIN
      if (documentType === "cin") {
        //  CAS 2.1: UPLOAD MOBILE
        if (cinRectoUrl && cinVersoUrl && profilePictureUrl) {
          console.log(
            "Upload mobile détecté - conversion des URLs en fichiers",
          );

          const urlToFile = async (
            url: string,
            filename: string,
          ): Promise<File> => {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], filename, { type: blob.type });
          };

          const [rectoFile, versoFile, profileFile] = await Promise.all([
            urlToFile(cinRectoUrl, "recto.jpg"),
            urlToFile(cinVersoUrl, "verso.jpg"),
            urlToFile(profilePictureUrl, "selfie.jpg"),
          ]);

          const formData = new FormData();
          formData.append("userId", userId);
          formData.append("documentType", "cin");
          formData.append("cinRecto", rectoFile);
          formData.append("cinVerso", versoFile);
          formData.append("profilePhoto", profileFile);

          const res = await fetch("/api/registration/upload-document", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Erreur upload");

          if (data.urls?.profilePhoto)
            setProfilePictureUrl(data.urls.profilePhoto);
          if (data.urls?.cinRecto) setCinRectoUrl(data.urls.cinRecto);
          if (data.urls?.cinVerso) setCinVersoUrl(data.urls.cinVerso);

          if (data.extracted) {
            const newCinData = {
              firstName: data.extracted.firstName || null,
              lastName: data.extracted.lastName || null,
              cinNumber: data.extracted.cinNumber || null,
              dateOfBirth: data.extracted.dateOfBirth || null,
              profession: data.extracted.profession || null,
              extractedAt: new Date().toISOString(),
              documentType: "CIN",
              rectoUrl: data.urls?.cinRecto || cinRectoUrl,
              versoUrl: data.urls?.cinVerso || cinVersoUrl,
            };

            setCinData(newCinData);
            setShowOcrConfirm(true);

            if (data.extracted.dateOfBirth && !dateNaissance)
              setDateNaissance(data.extracted.dateOfBirth);
            if (data.extracted.cinNumber && !cinNumber)
              setCinNumber(data.extracted.cinNumber);
            if (data.extracted.profession && !profession)
              setProfession(data.extracted.profession);
          }

          toast.success(t("documents.analyzed"), {
            description: data.extracted
              ? t("cin.numberDetected", {
                  number: data.extracted.cinNumber ?? "?",
                })
              : t("documents.uploadSuccess"),
          });

          return true;
        }

        //  CAS 2.2: UPLOAD DESKTOP
        if (!cinRecto || !cinVerso || !profilePhoto) {
          setUploadCINError(t("errors.threeFilesRequired"));
          toast.error(t("errors.error"), {
            description: t("errors.threeFilesRequired"),
          });
          return false;
        }

        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("documentType", "cin");
        formData.append("cinRecto", cinRecto);
        formData.append("cinVerso", cinVerso);
        formData.append("profilePhoto", profilePhoto);

        const res = await fetch("/api/registration/upload-document", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur upload");

        if (data.urls?.profilePhoto)
          setProfilePictureUrl(data.urls.profilePhoto);
        if (data.urls?.cinRecto) setCinRectoUrl(data.urls.cinRecto);
        if (data.urls?.cinVerso) setCinVersoUrl(data.urls.cinVerso);

        if (data.extracted) {
          const newCinData = {
            firstName: data.extracted.firstName || null,
            lastName: data.extracted.lastName || null,
            cinNumber: data.extracted.cinNumber || null,
            dateOfBirth: data.extracted.dateOfBirth || null,
            profession: data.extracted.profession || null,
            extractedAt: new Date().toISOString(),
            documentType: "CIN",
            rectoUrl: data.urls?.cinRecto || null,
            versoUrl: data.urls?.cinVerso || null,
          };

          setCinData(newCinData);
          setShowOcrConfirm(true);

          if (data.extracted.dateOfBirth && !dateNaissance)
            setDateNaissance(data.extracted.dateOfBirth);
          if (data.extracted.cinNumber && !cinNumber)
            setCinNumber(data.extracted.cinNumber);
          if (data.extracted.profession && !profession)
            setProfession(data.extracted.profession);
        }

        toast.success(t("documents.analyzed"));
        return true;
      }

      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setUploadCINError(msg);
      toast.error("Erreur upload", { description: msg });
      return false;
    } finally {
      setIsUploadingCIN(false);
    }
  };

  // WHATSAPP
  const handleSendWhatsApp = async () => {
    if (!governorate) {
      toast.error(t("errors.governorateRequired"));
      return;
    }
    if (!delegation) {
      toast.error(t("errors.delegationRequired"));
      return;
    }
    if (!phoneNumber) {
      setFormError(t("errors.phoneRequired"));
      return;
    }

    const userId = currentUserId || localStorage.getItem("currentUserId");

    if (!userId) {
      setFormError(t("errors.userNotFound"));
      return;
    }

    setIsWhatsappLoading(true);
    setWhatsappError("");

    try {
      const formattedPhoneNumber = `+216${phoneNumber}`;
      console.log("Envoi du numéro:", formattedPhoneNumber);
      console.log("User ID:", userId);

      await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          firstName,
          lastName,
          bio,
          phoneNumber: formattedPhoneNumber,
        }),
      });

      const response = await fetch("/api/users/add-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          phoneNumber: formattedPhoneNumber,
        }),
      });

      const data = await response.json();
      console.log("Réponse API:", data);

      if (!response.ok) {
        throw new Error(data.error || "Erreur d'envoi");
      }

      setPhoneNumberResourceId(data.phoneNumberId);
      setWhatsappAlertMessage(t("whatsapp.codeSent", { phone: phoneNumber }));
      setShowWhatsappAlert(true);
    } catch (error: any) {
      console.error("Erreur WhatsApp:", error);
      setWhatsappError(error.message || "Erreur d'envoi du code");
    } finally {
      setIsWhatsappLoading(false);
    }
  };

  const handleVerifyWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (whatsappCode.length !== 6) {
      setWhatsappError(t("errors.codeRequired"));
      return;
    }

    setIsWhatsappLoading(true);
    setWhatsappError("");

    try {
      const userId = currentUserId || localStorage.getItem("currentUserId");

      if (!userId || !phoneNumber) {
        throw new Error("Informations manquantes");
      }

      const response = await fetch("/api/users/verify-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          phoneNumber: `+216${phoneNumber}`,
          code: whatsappCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep(4);
      } else {
        throw new Error(data.error || t("errors.invalidCode"));
      }
    } catch (error: any) {
      console.error("Erreur vérification:", error);
      setWhatsappError(error.message || t("errors.invalidCode"));
    } finally {
      setIsWhatsappLoading(false);
    }
  };

  // VALIDATION
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const checkPasswordStrength = (value: string) => {
    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^A-Za-z0-9]/.test(value)) strength++;
    setPasswordStrength(strength);
  };

  const getStrengthText = () => {
    if (passwordStrength <= 1) return t("weak");
    if (passwordStrength === 2) return t("medium");
    if (passwordStrength === 3) return t("good");
    return t("strong");
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-yellow-500";
    if (passwordStrength === 3) return "bg-blue-400";
    return "bg-green-400";
  };

  const validateUsername = (value: string): string | undefined => {
    if (!value.trim()) return t("errors.usernameRequired");
    if (value.length < 3 || value.length > 20)
      return t("errors.usernameInvalid");
    if (!/^[a-zA-Z0-9]+$/.test(value)) return t("usernameInfo");
    return undefined;
  };

  const validateEmailField = (value: string): string | undefined => {
    if (!value.trim()) return t("errors.emailRequired");
    if (!isValidEmail(value)) return t("errors.emailInvalid");
    return undefined;
  };

  const validatePasswordField = (value: string): string | undefined => {
    if (!value) return t("errors.passwordRequired");
    if (value.length < 8) return t("errors.passwordTooShort");
    return undefined;
  };

  const validateConfirmPassword = (value: string): string | undefined => {
    if (!value) return t("errors.confirmPasswordRequired");
    if (value !== password) return t("errors.passwordsDoNotMatch");
    return undefined;
  };

  const validateForm = async () => {
    const usernameErrorVal = validateUsername(username);
    const emailErrorVal = validateEmailField(email);
    const passwordErrorVal = validatePasswordField(password);
    const confirmErrorVal = validateConfirmPassword(confirmPassword);

    if (!role) {
      setFormError(t("errors.chooseRole"));
      return false;
    }

    if (
      usernameErrorVal ||
      emailErrorVal ||
      passwordErrorVal ||
      confirmErrorVal
    ) {
      setFormError(t("required"));
      return false;
    }

    if (passwordStrength < 2) {
      setFormError(t("passwordStrength"));
      return false;
    }

    setIsCheckingEmail(true);
    const emailExists = await checkEmailExists(email);
    setIsCheckingEmail(false);

    if (emailExists) {
      setEmailError(t("errors.emailAlreadyExists"));
      setFormError(t("errors.emailAlreadyExists"));
      return false;
    } else {
      setEmailError("");
    }

    setIsCheckingUsername(true);
    const usernameExists = await checkUsernameExists(username);
    setIsCheckingUsername(false);

    if (usernameExists) {
      setUsernameError(t("errors.usernameAlreadyExists"));
      setFormError(t("errors.usernameAlreadyExists"));
      return false;
    } else {
      setUsernameError("");
    }

    return true;
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("1 - handleSubmit démarré");

    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    console.log("2 - Validation du formulaire");
    const isValid = await validateForm();
    if (!isValid) {
      console.log("Formulaire invalide, arrêt");
      return;
    }

    console.log("3 - Formulaire valide");
    setFormError("");
    setIsLoading(true);

    try {
      console.log("4 - Vérification signUp");
      if (!signUp) {
        throw new Error("Clerk non initialisé");
      }

      console.log("5 - Création Clerk avec:", { email, username });
      const signUpAttempt = await signUp.create({
        emailAddress: email,
        password: password,
        username: username,
      });

      console.log("signUpAttempt complet:", {
        id: signUpAttempt.id,
        createdUserId: signUpAttempt.createdUserId,
        status: signUpAttempt.status,
      });

      const temporaryClerkId = signUpAttempt.id;
      if (!temporaryClerkId) {
        throw new Error(
          "Impossible de récupérer l'ID de la tentative d'inscription",
        );
      }

      const userIdToUse = temporaryClerkId;

      let uploadedProfilePictureUrl = null;
      if (profilePhoto) {
        try {
          const formData = new FormData();
          formData.append("file", profilePhoto);
          formData.append("userId", userIdToUse);
          formData.append("type", "profile");

          const uploadRes = await fetch("/api/users/upload-photo", {
            method: "POST",
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedProfilePictureUrl = uploadData.url;
            setProfilePictureUrl(uploadedProfilePictureUrl);
            console.log("Photo uploadée:", uploadedProfilePictureUrl);
          }
        } catch (err) {
          console.error("Erreur upload photo:", err);
        }
      }

      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userIdToUse,
          email,
          username,
          role,
          preferredLocale: locale,
          profilePictureUrl: uploadedProfilePictureUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur création");
      }

      setCurrentUserId(userIdToUse);
      localStorage.setItem("currentUserId", userIdToUse);
      localStorage.setItem("pendingEmail", email);
      localStorage.setItem("pendingUsername", username);
      localStorage.setItem("pendingPassword", password);
      localStorage.setItem("pendingRole", role ?? "");
      localStorage.setItem("preferred-language", locale);

      const verifyUrl = `${window.location.origin}/${locale}/inscription/verify-catch`;
      console.log(" Verification URL:", verifyUrl);

      await signUp.prepareEmailAddressVerification({
        strategy: "email_link",
        redirectUrl: verifyUrl,
      });

      setAlertMessage(t("alerts.verificationLinkSent", { email }));
      setShowSuccessAlert(true);
    } catch (error: any) {
      console.error("ERREUR DÉTAILLÉE:", error);
      const errorMessage =
        error?.errors?.[0]?.message || error?.message || t("required");
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLE CONFIRM IDENTITY
  const handleConfirmIdentity = async () => {
    //  Vérifier que les données OCR sont disponibles
    if (!cinData || !cinData.firstName) {
      toast.error(t("ocr.missingData"), {
        description: t("ocr.analyzeFirst"),
      });
      return;
    }

    setIsUploadingCIN(true);
    setUploadCINError("");

    const tempId = currentUserId || localStorage.getItem("currentUserId");

    try {
      //  Les URLs sont déjà dans cinData (créées pendant handleUploadCIN)
      const uploadedProfilePictureUrl =
        cinData.profilePictureUrl || profilePictureUrl;

      let uploadedRectoUrl = null;
      let uploadedVersoUrl = null;
      let uploadedPassportUrl = null;

      if (documentType === "passport") {
        uploadedPassportUrl = cinData.passportUrl || passportUrl;
      } else {
        uploadedRectoUrl = cinData.rectoUrl || cinRectoUrl;
        uploadedVersoUrl = cinData.versoUrl || cinVersoUrl;
      }

      const cinDataToSave = {
        // Champs communs
        firstName: cinData.firstName,
        lastName: cinData.lastName,
        cinNumber: cinData.cinNumber || cinNumber,
        dateOfBirth: cinData.dateOfBirth || dateNaissance,
        profession: cinData.profession || profession,
        extractedAt: new Date().toISOString(),
        documentType:
          cinData.documentType ||
          (documentType === "passport" ? "PASSPORT" : "CIN"),
        // URLs
        rectoUrl: uploadedRectoUrl,
        versoUrl: uploadedVersoUrl,
        passportUrl: uploadedPassportUrl,
        // Champs spécifiques au passeport
        passportNumber: cinData.passportNumber || null,
        expiryDate: cinData.expiryDate || null,
        sex: cinData.sex || null,
        country: cinData.country || null,
      };

      console.log(" Envoi des données au serveur:", {
        firstNameFrancais: firstName,
        lastNameFrancais: lastName,
        cinDataArabe: cinDataToSave,
      });
      // Juste avant le fetch, ajoute :
      console.log(" Vérification cinData avant envoi:", {
        firstNameArabe: cinData.firstName,
        lastNameArabe: cinData.lastName,
        cinNumber: cinData.cinNumber,
        dateOfBirth: cinData.dateOfBirth,
        profession: cinData.profession,
      });
      //  Envoi au serveur avec les valeurs FRANÇAISES + ARABES
      const completeProfileRes = await fetch("/api/users/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: tempId,
          firstName: firstName || "",
          lastName: lastName || "",
          dateNaissance: dateNaissance || cinData?.dateOfBirth || "",
          cinNumber: cinNumber || cinData?.cinNumber || "",
          bio: bio || "",
          profession: profession || cinData?.profession || "",
          phoneNumber: `+216${phoneNumber}`,
          governorate: governorate || "",
          delegation: delegation || "",
          gender: gender || "Non spécifié",
          howFound: "inscription",
          cinRectoUrl: uploadedRectoUrl || "",
          cinVersoUrl: uploadedVersoUrl || "",
          passportUrl: uploadedPassportUrl || "",
          profilePictureUrl: uploadedProfilePictureUrl || "",
          cinData: cinDataToSave,
          documentType: documentType,
        }),
      });

      if (!completeProfileRes.ok) {
        const errorData = await completeProfileRes.json();
        console.error(" Erreur complete-profile:", errorData);
        throw new Error(errorData.error || "Erreur lors de l'enregistrement");
      }

      const completeProfileData = await completeProfileRes.json();
      console.log(" Complete-profile réussi:", completeProfileData);

      //  Mise à jour Clerk ID si nécessaire
      if (isUserLoaded && user?.id && tempId && tempId !== user.id) {
        try {
          await fetch("/api/users/update-clerk-id", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldClerkId: tempId, newClerkId: user.id }),
          });
          localStorage.setItem("currentUserId", user.id);
          setCurrentUserId(user.id);
        } catch (syncErr) {
          console.warn(" Sync Clerk ID échoué (non bloquant):", syncErr);
        }
      }

      toast.success(
        completeProfileData.message || "Profil complété avec succès !",
      );
      localStorage.removeItem("redirectAfterLogin");

      //  Fermer le modal et montrer le welcome
      setShowOcrConfirm(false);
      setShowWelcome(true);
    } catch (error) {
      console.error(" Erreur handleConfirmIdentity:", error);
      toast.error(t("errors.confirmationError"), {
        description: error instanceof Error ? error.message : t("errors.retry"),
      });
      setUploadCINError(
        error instanceof Error ? error.message : "Erreur inconnue",
      );
    } finally {
      setIsUploadingCIN(false);
    }
  };

  // HANDLE GO TO COMPLETE PROFILE & DASHBOARD
  const handleGoToCompleteProfile = async () => {
    localStorage.removeItem("redirectAfterLogin");

    setShowWelcome(false);
    localStorage.removeItem("pendingEmail");
    localStorage.removeItem("pendingUsername");
    localStorage.removeItem("pendingPassword");
    localStorage.removeItem("pendingRole");

    router.push(`/${locale}/complete-profile`);
  };

  const handleGoToDashboard = async () => {
    setShowWelcome(false);
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("pendingEmail");
    localStorage.removeItem("pendingUsername");
    localStorage.removeItem("pendingPassword");
    localStorage.removeItem("pendingRole");
    await signOut();
    router.push(`/${locale}/dashboard`);
  };

  const validateStep2 = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = t("errors.firstNameRequired");
    }
    if (!lastName.trim()) {
      errors.lastName = t("errors.lastNameRequired");
    }
    if (!phoneNumber || phoneNumber.length < 8) {
      errors.phoneNumber = t("errors.phoneTooShort");
    }
    if (!governorate) {
      errors.governorate = t("errors.governorateRequired");
    }
    if (!delegation) {
      errors.delegation = t("errors.delegationRequired");
    }

    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  }, [firstName, lastName, phoneNumber, governorate, delegation, t]);

  // À ajouter dans useInscription
  const handleAnalyzeDocuments = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await handleUploadCIN();
      if (success) {
        console.log(" Upload réussi");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, handleUploadCIN]);

  return {
    t,
    mounted,
    theme,
    currentStep,
    setCurrentStep,
    showSuccessAlert,
    setShowSuccessAlert,
    alertMessage,
    showWhatsappAlert,
    setShowWhatsappAlert,
    whatsappAlertMessage,
    showOcrConfirm,
    setShowOcrConfirm,
    showCropper,
    setShowCropper,
    cropperSide,
    setCropperSide,
    showWelcome,
    setShowWelcome,
    formError,
    setFormError,
    role,
    setRole,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordStrength,
    isLoading,
    pendingVerification,
    touched,
    handleBlur,
    handleSubmit,
    checkPasswordStrength,
    getStrengthText,
    getStrengthColor,
    validateUsername,
    validateEmailField,
    validatePasswordField,
    validateConfirmPassword,
    emailError,
    usernameError,
    phoneError,
    isCheckingEmail,
    isCheckingUsername,
    isCheckingPhone,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phoneNumber,
    setPhoneNumber,
    bio,
    setBio,
    touchedStep2,
    setTouchedStep2,
    isWhatsappLoading,
    whatsappError,
    handleSendWhatsApp,
    whatsappCode,
    setWhatsappCode,
    handleVerifyWhatsApp,
    cinRecto,
    setCinRecto,
    cinVerso,
    setCinVerso,
    profilePhoto,
    setProfilePhoto,
    dateNaissance,
    setDateNaissance,
    cinNumber,
    setCinNumber,
    profession,
    setProfession,
    isOcrLoading,
    handleOCR,
    handleUploadCIN,
    handleConfirmIdentity,
    isUploadingCIN,
    uploadCINError,
    cinData,
    handleGoToCompleteProfile,
    handleGoToDashboard,
    isUserLoaded,
    user,
    setCurrentUserId,
    currentUserId,
    acceptTerms,
    setAcceptTerms,
    governorate,
    setGovernorate,
    delegation,
    setDelegation,
    gender,
    setGender,
    cinRectoUrl,
    setCinRectoUrl,
    cinVersoUrl,
    setCinVersoUrl,
    profilePictureUrl,
    setProfilePictureUrl,
    resetForm,
    setCinData,
    sessionId,
    setSessionId,
    qrUrl,
    setQrUrl,
    uploadProgress,
    setUploadProgress,
    showQRCode,
    setShowQRCode,
    isMobileUploading,
    setIsMobileUploading,
    documentType,
    setDocumentType,
    passportFile,
    setPassportFile,
    passportUrl,
    setPassportUrl,
    passportNumber,
    setPassportNumber,
    passportExpiryDate,
    setPassportExpiryDate,
    passportCountry,
    setPassportCountry,
    step2Errors,
    validateStep2,
    handleAnalyzeDocuments,
  };
}
