import { useState, useEffect, useCallback } from "react";
import { useSignUp, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ValidationPatterns } from "@/lib/utils";

// Helper function to get current locale from URL
const getCurrentLocale = () => {
  if (typeof window === "undefined") return "fr";

  const pathname = window.location.pathname;
  const segments = pathname.split("/").filter(Boolean);

  const validLocales = ["fr", "en", "ar", "de", "es", "it"];

  if (segments[0] && validLocales.includes(segments[0])) {
    return segments[0];
  }

  return localStorage.getItem("preferred-language") || "fr";
};

export function useInscription() {
  const t = useTranslations("Inscription");
  const { isLoaded, signUp, setActive } = useSignUp();
  const { signOut } = useClerk();
  const { isLoaded: isUserLoaded, user } = useUser();
  const router = useRouter();
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showWhatsappAlert, setShowWhatsappAlert] = useState(false);
  const [whatsappAlertMessage, setWhatsappAlertMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [touchedStep2, setTouchedStep2] = useState({
    firstName: false,
    lastName: false,
    phoneNumber: false,
  });
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
  const [cinRecto, setCinRecto] = useState<File | null>(null);
  const [cinVerso, setCinVerso] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [dateNaissance, setDateNaissance] = useState("");
  const [cinNumber, setCinNumber] = useState("");
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [whatsappCode, setWhatsappCode] = useState("");
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [phoneNumberResource, setPhoneNumberResource] = useState<any>(null);
  const [phoneNumberResourceId, setPhoneNumberResourceId] = useState<
    string | null
  >(null);
  const [showOcrConfirm, setShowOcrConfirm] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperSide, setCropperSide] = useState<"recto" | "verso">("recto");
  const [showWelcome, setShowWelcome] = useState(false);

  // ============================================
  // ÉTATS POUR LA VALIDATION D'UNICITÉ
  // ============================================
  const [emailError, setEmailError] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  // ============================================
  // FONCTIONS DE VÉRIFICATION D'UNICITÉ
  // ============================================

  // Vérifier si l'email existe déjà
  const checkEmailExists = async (emailValue: string): Promise<boolean> => {
    if (!emailValue || !ValidationPatterns.isEmail(emailValue)) return false;

    try {
      const response = await fetch(
        `/api/users/by-email/${encodeURIComponent(emailValue)}`,
      );

      if (response.status === 404) {
        return false; // Email non trouvé, donc disponible
      }

      if (response.ok) {
        const userData = await response.json();
        const currentId = localStorage.getItem("currentUserId");
        // Si c'est le même utilisateur (en mode édition), on autorise
        return userData.id !== currentId;
      }

      return false;
    } catch (error) {
      console.error("Erreur vérification email:", error);
      return false;
    }
  };

  // Vérifier si le username existe déjà
  const checkUsernameExists = async (
    usernameValue: string,
  ): Promise<boolean> => {
    if (!usernameValue || !ValidationPatterns.isUsername(usernameValue))
      return false;

    try {
      const response = await fetch(
        `/api/users/by-username/${encodeURIComponent(usernameValue)}`,
      );

      if (response.status === 404) {
        return false;
      }

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

  // Vérifier si le téléphone existe déjà
  const checkPhoneExists = async (phoneValue: string): Promise<boolean> => {
    if (!phoneValue) return false;

    try {
      const response = await fetch(
        `/api/users/by-phone/${encodeURIComponent(phoneValue)}`,
      );

      if (response.status === 404) {
        return false;
      }

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

  // Debounce simple
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Validation email en temps réel
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

  // Validation username en temps réel
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

  // ✅ Validation téléphone en temps réel (CORRIGÉE)
  const validatePhoneUniqueness = useCallback(
    debounce(async (value: string) => {
      if (!value) {
        setPhoneError("");
        return;
      }

      const formattedPhone = `+216${value}`;

      //  NE PAS définir phoneError pour les erreurs de format
      // Laisse ces erreurs être gérées par l'UI directement
      if (value.length < 8) {
        //  Ne pas setPhoneError ici - on utilise une erreur séparée
        return;
      }

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

  // ============================================
  // EFFETS POUR LA VALIDATION EN TEMPS RÉEL
  // ============================================

  useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 8) {
      validatePhoneUniqueness(phoneNumber);
    } else if (phoneNumber && phoneNumber.length < 8) {
      //  Ne pas setPhoneError ici non plus - l'UI gère directement
      // setPhoneError(t("errors.phoneTooShort")); // Supprimé
    } else {
      setPhoneError("");
    }
  }, [phoneNumber, validatePhoneUniqueness, t]);

  // ============================================
  // RESTE DU CODE (CONSERVÉ)
  // ============================================

  useEffect(() => {
    setMounted(true);

    const savedUserId = localStorage.getItem("currentUserId");
    if (savedUserId) {
      setCurrentUserId(savedUserId);
      console.log(" ID restauré depuis localStorage:", savedUserId);
    }

    const params = new URLSearchParams(window.location.search);
    const currentLocale = getCurrentLocale();

    if (params.get("verified") === "true") {
      console.log(" verified=true detected");
      setCurrentStep(2);
      window.history.replaceState({}, "", `/${currentLocale}/inscription`);
      toast.success("Email vérifié !", {
        description: "Continuez votre inscription.",
      });
    }

    if (params.get("error") === "link_expired") {
      toast.error("Lien expiré", {
        description: "Le lien de vérification a expiré. Veuillez recommencer.",
      });
      window.history.replaceState({}, "", `/${currentLocale}/inscription`);
    }
  }, []);

  // Ajouter l'effet pour détecter quand l'utilisateur Clerk est créé
  useEffect(() => {
    if (isUserLoaded && user && user.id) {
      const tempId = localStorage.getItem("currentUserId");
      if (tempId && tempId !== user.id && tempId.startsWith("sua_")) {
        console.log(" Real Clerk user detected! Syncing ID...");
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
            console.log(" Database updated with real Clerk ID:", user.id);
          })
          .catch(console.error);
      }
    }
  }, [isUserLoaded, user]);

  // Remplace handleOCR par ceci
  const [isUploadingCIN, setIsUploadingCIN] = useState(false);
  const [uploadCINError, setUploadCINError] = useState("");

  const handleUploadCIN = async (): Promise<boolean> => {
    if (!cinRecto || !cinVerso || !profilePhoto) {
      setUploadCINError("Veuillez uploader les 3 fichiers");
      return false;
    }

    const userId = currentUserId || localStorage.getItem("currentUserId");
    if (!userId) {
      setUploadCINError("ID utilisateur introuvable");
      return false;
    }

    setIsUploadingCIN(true);
    setUploadCINError("");

    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("cinRecto", cinRecto);
      formData.append("cinVerso", cinVerso);
      formData.append("profilePhoto", profilePhoto);

      const res = await fetch("/api/registration/upload-cin", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur upload");

      // Pré-remplir les champs avec ce que Vision a extrait
      if (data.extracted?.firstName) setFirstName(data.extracted.firstName);
      if (data.extracted?.lastName) setLastName(data.extracted.lastName);
      if (data.extracted?.dateOfBirth)
        setDateNaissance(data.extracted.dateOfBirth);
      if (data.extracted?.cinNumber) setCinNumber(data.extracted.cinNumber);

      toast.success("Documents uploadés !", {
        description: data.ocrSuccess
          ? `CIN détecté : ${data.cinNumber || "en attente validation"}`
          : "Upload réussi, données à confirmer manuellement.",
      });

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setUploadCINError(msg);
      toast.error("Erreur upload", { description: msg });
      return false;
    } finally {
      setIsUploadingCIN(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!phoneNumber) {
      setFormError("Veuillez entrer votre numéro de téléphone");
      return;
    }

    const userId = currentUserId || localStorage.getItem("currentUserId");

    if (!userId) {
      setFormError("ID utilisateur non trouvé");
      return;
    }

    setIsWhatsappLoading(true);
    setWhatsappError("");

    try {
      const formattedPhoneNumber = `+216${phoneNumber}`;
      console.log(" Envoi du numéro:", formattedPhoneNumber);
      console.log(" User ID:", userId);

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
      console.log(" Réponse API:", data);

      if (!response.ok) {
        throw new Error(data.error || "Erreur d'envoi");
      }

      setPhoneNumberResourceId(data.phoneNumberId);
      setWhatsappAlertMessage(
        `Un code de vérification a été envoyé sur WhatsApp au +216 ${phoneNumber}`,
      );
      setShowWhatsappAlert(true);
    } catch (error: any) {
      console.error(" Erreur WhatsApp:", error);
      setWhatsappError(error.message || "Erreur d'envoi du code");
    } finally {
      setIsWhatsappLoading(false);
    }
  };

  const handleVerifyWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (whatsappCode.length !== 6) {
      setWhatsappError("Code à 6 chiffres requis");
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
        throw new Error(data.error || "Code invalide");
      }
    } catch (error: any) {
      console.error(" Erreur vérification:", error);
      setWhatsappError(error.message || "Code invalide");
    } finally {
      setIsWhatsappLoading(false);
    }
  };

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

    // Validation des formats de base
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

    // VALIDATION D'UNICITÉ EMAIL - au moment du clic
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

    //  VALIDATION D'UNICITÉ USERNAME - au moment du clic
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

  console.log(" 1 - handleSubmit démarré");

  setTouched({
    username: true,
    email: true,
    password: true,
    confirmPassword: true,
  });

  console.log(" 2 - Validation du formulaire");
  const isValid = await validateForm();
  if (!isValid) {
    console.log("Formulaire invalide, arrêt");
    return;
  }

  console.log(" 3 - Formulaire valide");
  setFormError("");
  setIsLoading(true);

  try {
    console.log(" 4 - Vérification signUp");
    if (!signUp) {
      console.log(" 4b - signUp est undefined !");
      throw new Error("Clerk non initialisé");
    }

    console.log(" 5 - Création Clerk avec:", { email, username });
    const signUpAttempt = await signUp.create({
      emailAddress: email,
      password: password,
      username: username,
    });

    console.log(" signUpAttempt complet:", {
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
    const currentLocale = getCurrentLocale();

    // ✅ Déclarer et uploader la photo ici
    let profilePictureUrl = null;
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
          profilePictureUrl = uploadData.url;
          console.log("✅ Photo uploadée:", profilePictureUrl);
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
        preferredLocale: currentLocale,
        profilePictureUrl, // ✅ Maintenant défini
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
    localStorage.setItem("preferred-language", currentLocale);

    const verifyUrl = `${window.location.origin}/${currentLocale}/inscription/verify-catch`;
    console.log("📧 Verification URL:", verifyUrl);

    await signUp.prepareEmailAddressVerification({
      strategy: "email_link",
      redirectUrl: verifyUrl,
    });

    setAlertMessage(`Un lien de vérification a été envoyé à ${email}`);
    setShowSuccessAlert(true);
  } catch (error: any) {
    console.error(" ERREUR DÉTAILLÉE:", error);
    console.error(" Message:", error?.message);
    console.error(" Errors:", error?.errors);

    const errorMessage =
      error?.errors?.[0]?.message || error?.message || t("required");
    setFormError(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const handleConfirmIdentity = async () => {
    // 1. Upload CIN + Vision OCR
    const uploadOk = await handleUploadCIN();
    if (!uploadOk) return; // stoppe si l'upload a échoué

    // 2. Complete profile (données texte)
    const tempId = currentUserId || localStorage.getItem("currentUserId");
    try {
      await fetch("/api/users/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: tempId,
          firstName,
          lastName,
          dateNaissance,
          cinNumber,
          address,
          bio,
          phoneNumber: `+216${phoneNumber}`,
        }),
      });

      // Sync Clerk ID si nécessaire
      if (isUserLoaded && user?.id && tempId && tempId !== user.id) {
        await fetch("/api/users/update-clerk-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldClerkId: tempId, newClerkId: user.id }),
        });
        localStorage.setItem("currentUserId", user.id);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error("Erreur complete-profile:", error);
    } finally {
      setShowOcrConfirm(false);
      setShowWelcome(true);
    }
  };

  const handleGoToCompleteProfile = async () => {
    setShowWelcome(false);
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("pendingEmail");
    localStorage.removeItem("pendingUsername");
    localStorage.removeItem("pendingPassword");
    localStorage.removeItem("pendingRole");
    await signOut();
    const currentLocale = getCurrentLocale();
    router.push(`/${currentLocale}/complete-profile`);
  };

  const handleGoToDashboard = async () => {
    setShowWelcome(false);
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("pendingEmail");
    localStorage.removeItem("pendingUsername");
    localStorage.removeItem("pendingPassword");
    localStorage.removeItem("pendingRole");
    await signOut();
    const currentLocale = getCurrentLocale();
    router.push(`/${currentLocale}/dashboard`);
  };

  return {
    // meta
    t,
    mounted,
    theme,
    // step
    currentStep,
    setCurrentStep,
    // alerts
    showSuccessAlert,
    setShowSuccessAlert,
    alertMessage,
    showWhatsappAlert,
    setShowWhatsappAlert,
    whatsappAlertMessage,
    // modals
    showOcrConfirm,
    setShowOcrConfirm,
    showCropper,
    setShowCropper,
    cropperSide,
    setCropperSide,
    showWelcome,
    setShowWelcome,
    // form errors
    formError,
    setFormError,
    // step 1
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
    // Validation d'unicité
    emailError,
    usernameError,
    phoneError,
    isCheckingEmail,
    isCheckingUsername,
    isCheckingPhone,
    // step 2
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phoneNumber,
    setPhoneNumber,
    address,
    setAddress,
    bio,
    setBio,
    touchedStep2,
    setTouchedStep2,
    isWhatsappLoading,
    whatsappError,
    handleSendWhatsApp,
    // step 3
    whatsappCode,
    setWhatsappCode,
    handleVerifyWhatsApp,
    // step 4
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
    isOcrLoading,
    handleUploadCIN,
    handleConfirmIdentity,
    // welcome
    handleGoToCompleteProfile,
    handleGoToDashboard,
    // clerk user
    isUserLoaded,
    user,
    setCurrentUserId,
    currentUserId,
    acceptTerms,
    setAcceptTerms,
    isUploadingCIN,
    uploadCINError,
  };
}
