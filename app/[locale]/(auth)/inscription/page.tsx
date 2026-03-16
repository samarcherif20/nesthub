"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { EyeOff, Eye, Loader2 } from "lucide-react";
import { TfiEmail } from "react-icons/tfi";
import { RiLockPasswordLine } from "react-icons/ri";
import { MdOutlineDangerous } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { MdOutlineHomeWork } from "react-icons/md";
import { TbMapPinSearch } from "react-icons/tb";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { FaRegCheckCircle } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { CiLock } from "react-icons/ci";
import { FaCheckCircle } from "react-icons/fa";
import { FaAddressCard } from "react-icons/fa";
import { BsFillCreditCard2BackFill } from "react-icons/bs";
import { MdAccountCircle } from "react-icons/md";
import { MdOutlineCameraAlt } from "react-icons/md";
import { MdVerified } from "react-icons/md";
import { FaGavel } from "react-icons/fa6";
import { TiCloudStorage } from "react-icons/ti";











// ============================================================
// Composant d'alerte personnalisée (Email)
// ============================================================
const SuccessAlert = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: -50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.9 }}
    transition={{ type: "spring", damping: 20 }}
    className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm"
  >
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-white/20 backdrop-blur-lg">
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
        <CheckCircle className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">Email envoyé ! ✅</p>
        <p className="text-xs text-white/90">{message}</p>
      </div>
      <button 
        onClick={onClose}
        className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
      >
        ✕
      </button>
    </div>
  </motion.div>
);

// ============================================================
// Composant d'alerte WhatsApp
// ============================================================
const WhatsAppAlert = ({ message, onConfirm, onClose }: { message: string; onConfirm: () => void; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div 
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-green-500/20"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-icons text-green-500 text-3xl">whatsapp</span>
        </div>
        <h3 className="text-xl font-bold mb-2">Code envoyé !</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {message}
        </p>
        <button
          onClick={onConfirm}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all"
        >
          J'ai reçu le code
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default function InscriptionPage() {
  const t = useTranslations("Inscription");
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  
  // États pour l'alerte WhatsApp
  const [showWhatsappAlert, setShowWhatsappAlert] = useState(false);
  const [whatsappAlertMessage, setWhatsappAlertMessage] = useState("");
  
  // États pour l'étape 2 (identité)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  // Validation étape 2
  const [touchedStep2, setTouchedStep2] = useState({
    firstName: false,
    lastName: false,
    phoneNumber: false,
  });

  // États du formulaire
  const [role, setRole] = useState<"landlord" | "tenant" | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // États UI
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
  
  // États pour l'étape 4 (documents)
  const [cinRecto, setCinRecto] = useState<File | null>(null);
  const [cinVerso, setCinVerso] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [dateNaissance, setDateNaissance] = useState("");
  const [cinNumber, setCinNumber] = useState("");
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  // États pour le code WhatsApp (Étape 3)
  const [whatsappCode, setWhatsappCode] = useState("");
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // Pour stocker la ressource du numéro de téléphone
  const [phoneNumberResource, setPhoneNumberResource] = useState<any>(null);
  // Après tes autres useState
  const [phoneNumberResourceId, setPhoneNumberResourceId] = useState<string | null>(null);
  const [showOcrConfirm, setShowOcrConfirm] = useState(false);

  // ============================================================
  // useEffect
  // ============================================================
  useEffect(() => {
    setMounted(true);
    
    // Restaure l'ID utilisateur depuis localStorage
    const savedUserId = localStorage.getItem("currentUserId");
    if (savedUserId) {
      setCurrentUserId(savedUserId);
      console.log("🔄 ID restauré depuis localStorage:", savedUserId);
    }
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('verify') === 'true') {
      toast.success("Email vérifié !", {
        description: "Votre email a été confirmé. Continuez votre inscription."
      });
      markEmailAsVerified();
      setCurrentStep(2);
      
      window.history.replaceState({}, '', '/fr/inscription');
    }
  }, []);

  // ============================================================
  // Fonctions OCR
  // ============================================================
  // ✅ APRÈS — remplace par ça
const handleOCR = async (file: File, side: 'recto' | 'verso') => {
  if (side !== 'recto') {
    toast.success("Verso ajouté !", {
      description: "La face arrière a été traitée."
    });
    return;
  }

  setIsOcrLoading(true);

  try {
    const formData = new FormData();
    formData.append("file", file);  // ← "file" pas "image"

    const response = await fetch("/api/ocr", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("✅ OCR résultat:", data);

    if (!data.success) {
      throw new Error(data.error || "Erreur OCR");
    }

    const { parsed } = data;  // ← utilise data.parsed

    if (parsed.firstName) setFirstName(parsed.firstName);
    if (parsed.lastName) setLastName(parsed.lastName);
    if (parsed.birthDate) setDateNaissance(parsed.birthDate);
    if (parsed.cinNumber) setCinNumber(parsed.cinNumber);

    toast.success("OCR terminé !", {
      description: "Les informations ont été extraites avec succès."
    });

  } catch (error) {
    console.error("❌ OCR erreur:", error);
    toast.error("Erreur OCR", {
      description: "Impossible d'extraire les informations. Remplissez manuellement."
    });
  } finally {
    setIsOcrLoading(false);
  }
};

  // ============================================================
  // Fonctions WhatsApp
  // ============================================================
  const handleSendWhatsApp = async () => {
    if (!phoneNumber) {
      setFormError("Veuillez entrer votre numéro de téléphone");
      return;
    }
    
    // Récupère l'ID utilisateur
    const userId = currentUserId || localStorage.getItem("currentUserId");
    
    if (!userId) {
      setFormError("ID utilisateur non trouvé");
      return;
    }
    
    setIsWhatsappLoading(true);
    setWhatsappError("");
    
    try {
      const formattedPhoneNumber = `+216${phoneNumber}`;
      console.log("📤 Envoi du numéro:", formattedPhoneNumber);
      console.log("👤 User ID:", userId);
      
      // Appeler l'API backend
      const response = await fetch("/api/users/add-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          phoneNumber: formattedPhoneNumber,
        }),
      });
  
      const data = await response.json();
      console.log("📥 Réponse API:", data);
  
      if (!response.ok) {
        throw new Error(data.error || "Erreur d'envoi");
      }
      
      // Stocker l'ID de la ressource téléphone
      setPhoneNumberResourceId(data.phoneNumberId);
      
      // TODO: Ici, tu devras implémenter l'envoi du code WhatsApp
      // via l'API WhatsApp Business
      
      setWhatsappAlertMessage(`Un code de vérification a été envoyé sur WhatsApp au +216 ${phoneNumber}`);
      setShowWhatsappAlert(true);
      
    } catch (error: any) {
      console.error("❌ Erreur WhatsApp:", error);
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
      // Récupère l'ID utilisateur
      const userId = currentUserId || localStorage.getItem("currentUserId");
      
      if (!userId || !phoneNumber) {
        throw new Error("Informations manquantes");
      }
      
      // Appeler l'API pour vérifier le code
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
  
      if (!response.ok) {
        throw new Error(data.error || "Code invalide");
      }
      
      // Vérification réus sie
      setCurrentStep(4); // Passe à l'étape 4 (OCR)
      
    } catch (error: any) {
      console.error("❌ Erreur vérification:", error);
      setWhatsappError(error.message || "Code invalide");
    } finally {
      setIsWhatsappLoading(false);
    }
  };
  // ============================================================
  // Fonctions de validation
  // ============================================================
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
    if (passwordStrength === 3) return "bg-blue-500";
    return "bg-primary";
  };

  const validateUsername = (value: string): string | undefined => {
    if (!value.trim()) return t("errors.usernameRequired");
    if (value.length < 3 || value.length > 20) return t("errors.usernameInvalid");
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

  const validateForm = () => {
    const usernameError = validateUsername(username);
    const emailError = validateEmailField(email);
    const passwordError = validatePasswordField(password);
    const confirmError = validateConfirmPassword(confirmPassword);

    if (!role) {
      setFormError(t("errors.chooseRole"));
      return false;
    }
    if (usernameError || emailError || passwordError || confirmError) {
      setFormError(t("required"));
      return false;
    }
    if (passwordStrength < 2) {
      setFormError(t("passwordStrength"));
      return false;
    }
    return true;
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  // ============================================================
// Fonction pour marquer l'email comme vérifié dans la base
// ============================================================
const markEmailAsVerified = async () => {
  const userId = currentUserId || localStorage.getItem("currentUserId");
  if (!userId) {
    console.log("⚠️ Pas d'userId trouvé pour marquer l'email comme vérifié");
    return;
  }

  try {
    console.log("📤 Marque l'email comme vérifié pour userId:", userId);
    const response = await fetch("/api/users/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la mise à jour");
    }

    const data = await response.json();
    console.log("✅ Email marqué comme vérifié dans la base:", data);
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
};

  // ============================================================
  // handleSubmit (Étape 1 - Email)
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🔴 1 - handleSubmit démarré");
    
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    console.log("🔴 2 - Validation du formulaire");
    if (!validateForm()) {
      console.log("🔴 2b - Formulaire invalide, arrêt");
      return;
    }
    
    console.log("🔴 3 - Formulaire valide");
    setFormError("");
    setIsLoading(true);

    try {
      console.log("🔴 4 - Vérification signUp");
      if (!signUp) {
        console.log("🔴 4b - signUp est undefined !");
        throw new Error("Clerk non initialisé");
      }

      console.log("🔴 5 - Création Clerk avec:", { email, username });
      const signUpAttempt = await signUp.create({
        emailAddress: email,
        password: password,
        username: username,
      });
      console.log("🔍 signUpAttempt complet:", {
        id: signUpAttempt.id,
        createdUserId: signUpAttempt.createdUserId,
        status: signUpAttempt.status,
      });

      console.log("🔴 5b - Réponse Clerk:", signUpAttempt);
      console.log("🔴 6 - Clerk créé, ID:", signUpAttempt.createdUserId);

      await signUp.update({
        publicMetadata: { role: role },
      });

      console.log("🔴 7 - Préparation appel API");
      
      
      const userIdToUse = signUpAttempt.createdUserId || signUpAttempt.id;
      console.log("🔴 8 - ID utilisé:", userIdToUse);
      
      console.log("🔴 9 - Envoi fetch à /api/users/create");
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userIdToUse,
          email,
          username,
          role,
        }),
      });

      console.log("🔴 10 - Réponse reçue, status:", response.status);
      const data = await response.json();
      console.log("🔴 11 - Données réponse:", data);

      if (!response.ok) {
        throw new Error(data.error || "Erreur création");
      }

      console.log("✅ SUCCÈS - Utilisateur créé en base !");
      setCurrentUserId(userIdToUse);  // ← Utilise le même ID que pour la base
      localStorage.setItem("currentUserId", userIdToUse);
      console.log("💾 ID sauvegardé dans localStorage:", userIdToUse);
      // Envoi de l'email de vérification
      await signUp.prepareEmailAddressVerification({
        strategy: "email_link",
        redirectUrl: `${window.location.origin}/fr/inscription?verify=true`,
      });

      setAlertMessage(`Un lien de vérification a été envoyé à ${email}`);
      setShowSuccessAlert(true);

    } catch (error: any) {
      console.error("❌ ERREUR DÉTAILLÉE:", JSON.stringify(error, null, 2));
      console.error("❌ Message:", error?.message);
      console.error("❌ Errors:", JSON.stringify(error?.errors, null, 2));
      
      const errorMessage = error?.errors?.[0]?.message || error?.message || t("required");
      setFormError(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // Rendu conditionnel (loading)
  // ============================================================
  if (!mounted) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
        <div className="w-full flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  // ============================================================
  // Rendu principal
  // ============================================================
  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-[min(100%,480px)] sm:max-w-[520px] md:max-w-[560px] lg:max-w-[600px] mx-auto">
        
        {/* Logo */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6 justify-center">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14">
            <Image
              src="/logo/logo.png"
              alt="NestHub Logo"
              fill
              className="object-contain scale-[3.75] translate-y-2.75"
            />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-400 via-sky-600 to-purple-500 text-transparent bg-clip-text">
            N E S T H U B
          </h2>
        </div>

        {/* Stepper avec dégradé NestHub */}
<div className="mb-8">
  {/* Ligne des étapes avec icônes */}
  <div className="flex items-center justify-between px-2 mb-4">
    {/* Étape 1 - Compte */}
    <div className="flex items-center gap-2">
      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
        currentStep >= 1 
          ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30" 
          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
      }`}>
        {currentStep > 1 ? (
          <span className="material-icons text-sm"><FaCheck />

          </span>
        ) : (
          "1"
        )}
      </span>
      <span className={`text-sm font-semibold ${
        currentStep >= 1 ? "text-slate-900 dark:text-white" : "text-slate-500"
      }`}>
        Compte
      </span>
    </div>

    {/* Ligne de connexion 1-2 */}
    <div className={`flex-1 h-0.5 mx-4 ${
      currentStep > 1 
        ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" 
        : "bg-slate-200 dark:bg-slate-800"
    }`}></div>

    {/* Étape 2 - Identité */}
    <div className="flex items-center gap-2">
      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
        currentStep >= 2 
          ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30" 
          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
      }`}>
        {currentStep > 2 ? (
          <span className="material-icons text-sm"><FaCheck />

          </span>
        ) : (
          "2"
        )}
      </span>
      <span className={`text-sm font-semibold ${
        currentStep >= 2 ? "text-slate-900 dark:text-white" : "text-slate-500"
      }`}>
        Identité
      </span>
    </div>

    {/* Ligne de connexion 2-3 */}
    <div className={`flex-1 h-0.5 mx-4 ${
      currentStep > 2 
        ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" 
        : "bg-slate-200 dark:bg-slate-800"
    }`}></div>

    {/* Étape 3 - Code */}
    <div className="flex items-center gap-2">
      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
        currentStep >= 3 
          ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30" 
          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
      }`}>
        {currentStep > 3 ? (
          <span className="material-icons text-sm"><FaCheck />

          </span>
        ) : (
          "3"
        )}
      </span>
      <span className={`text-sm font-semibold ${
        currentStep >= 3 ? "text-slate-900 dark:text-white" : "text-slate-500"
      }`}>
        Code
      </span>
    </div>

    {/* Ligne de connexion 3-4 */}
    <div className={`flex-1 h-0.5 mx-4 ${
      currentStep > 3 
        ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" 
        : "bg-slate-200 dark:bg-slate-800"
    }`}></div>

    {/* Étape 4 - Documents */}
    <div className="flex items-center gap-2">
      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
        currentStep >= 4 
          ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30" 
          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
      }`}>
        4
      </span>
      <span className={`text-sm font-semibold ${
        currentStep >= 4 ? "text-slate-900 dark:text-white" : "text-slate-500"
      }`}>
        Documents
      </span>
    </div>
  </div>

  

 
</div>

        {/* Alertes */}
        <AnimatePresence>
          {showSuccessAlert && (
            <SuccessAlert 
              message={alertMessage} 
              onClose={() => setShowSuccessAlert(false)} 
            />
          )}
          
          {showWhatsappAlert && (
            <WhatsAppAlert
              message={whatsappAlertMessage}
              onConfirm={() => {
                setShowWhatsappAlert(false);
                setCurrentStep(3);
              }}
              onClose={() => setShowWhatsappAlert(false)}
            />
          )}
        </AnimatePresence>

        {/* Message d'erreur général */}
        {formError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs sm:text-sm flex items-center gap-2">
            <MdOutlineDangerous className="shrink-0" size={18} />
            <span>{formError}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ============================================================ */}
          {/* ÉTAPE 1 : COMPTE (EMAIL) */}
          {/* ============================================================ */}
          {currentStep === 1 && !pendingVerification && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 md:p-6 rounded-xl shadow-2xl backdrop-blur-sm"
            >
              <div className="mb-4 sm:mb-5">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">{t("title")}</h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {t("step1Description")}
                </p>
              </div>

              {/* Sélection du rôle */}
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  {t("chooseRole")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("landlord")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out ${
                      role === "landlord" 
                        ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white border-transparent shadow-lg shadow-blue-500/30" 
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-blue-500/20"
                    } active:bg-gradient-to-r active:from-blue-500 active:via-purple-500 active:to-indigo-500 active:text-white active:border-transparent active:shadow-lg active:shadow-blue-500/30 active:scale-[0.98]`}
                  >
                    <MdOutlineHomeWork className="text-base sm:text-lg" />
                    {t("roleLandlord")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("tenant")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out ${
                      role === "tenant" 
                        ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white border-transparent shadow-lg shadow-blue-500/30" 
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-blue-500/20"
                    } active:bg-gradient-to-r active:from-blue-500 active:via-purple-500 active:to-indigo-500 active:text-white active:border-transparent active:shadow-lg active:shadow-blue-500/30 active:scale-[0.98]`}
                  >
                    <TbMapPinSearch className="text-sm sm:text-base" />
                    {t("roleTenant")}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("username")}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 font-bold">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onBlur={() => handleBlur('username')}
                      placeholder={t("username")}
                      className={`w-full pl-8 pr-8 py-2 sm:py-2.5 text-sm bg-gray-50 dark:bg-white/5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white ${
                        touched.username && validateUsername(username)
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-200 dark:border-white/10"
                      }`}
                      disabled={isLoading}
                    />
                    {username && !validateUsername(username) && (
  <span className="absolute inset-y-0 right-3 flex items-center">
    <FaRegCheckCircle className="text-green-500 text-sm sm:text-base" />
  </span>
)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{t("usernameInfo")}</p>
                  {touched.username && validateUsername(username) && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <MdOutlineDangerous size={12} />
                      {validateUsername(username)}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("professionalEmail")}
                  </label>
                  <div className="relative">
                    <TfiEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder="contact@exemple.com"
                      className={`w-full pl-9 pr-3 py-2 sm:py-2.5 text-sm bg-gray-50 dark:bg-white/5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white ${
                        touched.email && validateEmailField(email)
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-200 dark:border-white/10"
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {touched.email && validateEmailField(email) && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <MdOutlineDangerous size={12} />
                      {validateEmailField(email)}
                    </p>
                  )}
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("password")}
                  </label>
                  <div className="relative">
                    <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        checkPasswordStrength(e.target.value);
                      }}
                      onBlur={() => handleBlur('password')}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-9 py-2 sm:py-2.5 text-sm bg-gray-50 dark:bg-white/5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white ${
                        touched.password && validatePasswordField(password)
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-200 dark:border-white/10"
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>

                  {/* Force meter */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 rounded-full transition-all ${
                              level <= passwordStrength 
                                ? getStrengthColor() 
                                : "bg-slate-200 dark:bg-slate-700"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className={`text-[10px] ${
                          passwordStrength >= 3 ? "text-primary" : "text-slate-500"
                        }`}>
                          {t("strength")} : {getStrengthText()}
                        </p>
                        <p className="text-[10px] text-slate-500">{t("passwordInfo")}</p>
                      </div>
                    </div>
                  )}

                  {touched.password && validatePasswordField(password) && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <MdOutlineDangerous size={12} />
                      {validatePasswordField(password)}
                    </p>
                  )}
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("confirmPassword")}
                  </label>
                  <div className="relative">
                    <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-9 py-2 sm:py-2.5 text-sm bg-gray-50 dark:bg-white/5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white ${
                        touched.confirmPassword && validateConfirmPassword(confirmPassword)
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-200 dark:border-white/10"
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                  {touched.confirmPassword && validateConfirmPassword(confirmPassword) && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <MdOutlineDangerous size={12} />
                      {validateConfirmPassword(confirmPassword)}
                    </p>
                  )}
                </div>

                <div id="clerk-captcha" />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white font-bold rounded-xl 
                    flex items-center justify-center gap-2 text-sm
                    transition-all duration-300 ease-in-out
                    hover:shadow-lg hover:shadow-blue-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      {t("continue")}...
                    </>
                  ) : (
                    t("continue")
                  )}
                </button>
              </form>

              {/* Lien connexion */}
              <p className="mt-4 text-center text-xs text-slate-600 dark:text-slate-400">
                {t("alreadyHaveAccount")}{" "}
                <Link href="/fr/login" className="text-primary font-bold hover:underline">
                  {t("login")}
                </Link>
              </p>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* ÉTAPE 2 : IDENTITÉ (prénom, nom, téléphone) - GARDÉE */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-xl shadow-2xl backdrop-blur-sm"
            >
              {/* En-tête avec confidentialité */}
              <div className="mb-5">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">Vérification de l'identité</h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Étape 2 sur 4 : Identité réelle (Privée)</p>
              </div>

              {/* Notice de confidentialité */}
              <div className="bg-primary/10 border border-primary/20 p-4 flex items-start gap-3 mb-5">
                <span className="material-icons text-primary mt-0.5">verified_user</span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Confidentialité garantie</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Votre identité réelle est confidentielle et ne sera pas partagée publiquement.</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Section 1: Private Identity */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons text-xs text-primary">lock</span>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Informations Personnelles</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Prénom réel</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() => setTouchedStep2({...touchedStep2, firstName: true})}
                        placeholder="ex: Sinda"
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nom réel</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() => setTouchedStep2({...touchedStep2, lastName: true})}
                        placeholder="ex: Ben hssin"
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Numéro de téléphone</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <div className="flex items-center gap-2 border-r border-slate-300 dark:border-slate-700 pr-3">
                          <div className="w-5 h-3.5 bg-[#C8102E] relative overflow-hidden flex items-center justify-center rounded-sm">
                            <div className="w-1.5 h-1.5 rounded-full border border-white flex items-center justify-center">
                              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">+216</span>
                        </div>
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          setPhoneNumber(digits);
                        }}
                        onBlur={() => setTouchedStep2({...touchedStep2, phoneNumber: true})}
                        placeholder="27 929 630"
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-24 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Adresse de résidence</label>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Optionnel</span>
                    </div>
                    <div className="relative">
                      
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Entrez votre adresse complète"
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-11 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                      />
                    </div>
                  </div>
                  {phoneNumber && phoneNumber.length >= 8 && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl"
  >
    <p className="text-xs text-slate-500 mb-2 text-center">
      ⚠️ Avant de continuer, activez WhatsApp :
    </p>

    <a
      href="https://wa.me/14155238886?text=join%20earn-visit"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all text-sm"
    >
      <span>📱</span>
      Activer WhatsApp en 1 clic
    </a>

    <p className="text-[10px] text-slate-400 text-center mt-2">
      Clique → WhatsApp s'ouvre → clique Envoyer → reviens ici
    </p>
  </motion.div>
)}

                 

                </div>

                {/* Divider */}
                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>

                {/* Section 2: Public Profile */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons text-xs text-slate-400">public</span>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Profil Public</h2>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Bio publique</label>
                      <span className="text-[10px] text-slate-500 font-bold">{bio.length} / 300</span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 300))}
                      placeholder="Décrivez votre expérience immobilière ou ce que vous recherchez..."
                      rows={4}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="order-2 sm:order-1 flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span className="material-icons text-sm">Retour</span>
                    
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!firstName || !lastName || !phoneNumber) {
                        setFormError("Veuillez remplir tous les champs obligatoires");
                        return;
                      }
                      handleSendWhatsApp(); // Envoie le code WhatsApp
                    }}
                    className="order-1 sm:order-2 w-full sm:w-auto px-10 py-3 bg-primary hover:bg-primary/90 text-background-dark font-bold rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                  >
                    
                    <span className="material-icons group-hover:translate-x-1 transition-transform">Continuer</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* ÉTAPE 3 : CODE WHATSAPP */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-xl shadow-2xl backdrop-blur-sm"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="material-icons text-green-500 text-3xl"><CiLock /></span>
                </div>
                <h2 className="text-xl font-bold mb-1">Code de vérification</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Nous avons envoyé un code à 6 chiffres au <br />
                  <span className="text-green-500 font-medium">+216 {phoneNumber}</span>
                </p>
              </div>

              {whatsappError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                  <MdOutlineDangerous size={18} />
                  <span>{whatsappError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyWhatsApp} className="space-y-4">
              <div className="flex gap-3 justify-center my-4">
  {[0, 1, 2, 3, 4, 5].map((index) => (
    <input
      key={index}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={whatsappCode[index] || ""}
      onChange={(e) => {
        const val = e.target.value.replace(/\D/g, "");
        if (!val) {
          setWhatsappCode((prev) => {
            const arr = prev.split("");
            arr[index] = "";
            return arr.join("");
          });
          return;
        }
        const newCode = whatsappCode.split("");
        newCode[index] = val[val.length - 1];
        setWhatsappCode(newCode.join(""));
        // Focus next input
        const next = document.getElementById(`otp-${index + 1}`);
        if (next) (next as HTMLInputElement).focus();
      }}
      onKeyDown={(e) => {
        if (e.key === "Backspace" && !whatsappCode[index]) {
          const prev = document.getElementById(`otp-${index - 1}`);
          if (prev) (prev as HTMLInputElement).focus();
        }
      }}
      id={`otp-${index}`}
      className="w-12 h-14 text-center text-xl font-bold bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/30 outline-none transition-all"
      disabled={isWhatsappLoading}
      autoFocus={index === 0}
    />
  ))}
</div>
<p className="text-xs text-center text-slate-500 mt-2">
  Entrez les 6 chiffres reçus sur WhatsApp
</p>

                <button
                  type="submit"
                  disabled={isWhatsappLoading || whatsappCode.length !== 6}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isWhatsappLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Vérification en cours...
                    </>
                  ) : (
                    "Vérifier le code"
                  )}
                </button>

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <span className="material-icons text-sm">Retour</span>
                    
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                    disabled={isWhatsappLoading}
                  >
                    Renvoyer le code
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* ÉTAPE 4 : OCR (Documents) */}
          {/* ============================================================ */}
          {currentStep === 4 && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-xl shadow-2xl backdrop-blur-sm"
            >
              {/* En-tête */}
              <div className="mb-5">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">Vérification d'identité</h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Étape 4 sur 4 : Téléchargez vos documents officiels (OCR automatique)
                </p>
              </div>

              {/* Notification de succès */}
              <div className="mb-6 flex items-center gap-3 bg-[#1E90FF]/10 border border-[#1E90FF]/20 p-4 rounded-xl">
                <span className="material-icons text-[#1E90FF]"><FaCheckCircle />
</span>
                <p className="font-semibold text-[#1E90FF]">
                  Documents analysés avec succès ! Les informations ont été pré-remplies.
                </p>
              </div>

              {/* Grille principale */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Colonne gauche : Upload CIN */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Grille Recto/Verso */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recto CIN */}
                    <div className="bg-gray-50 dark:bg-white/5 border-2 border-dashed border-[#1E90FF]/20 rounded-xl p-6 flex flex-col items-center text-center group hover:border-[#1E90FF]/50 transition-all cursor-pointer">
                      <div className="w-16 h-16 bg-[#1E90FF]/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-icons text-[#1E90FF] text-3xl"><FaAddressCard />
</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2">CIN Recto</h3>
                      <p className="text-sm opacity-60 mb-4">Face avant de votre carte d'identité</p>
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        <span className="px-2 py-1 bg-[#1E90FF]/5 text-[10px] font-bold uppercase rounded border border-[#1E90FF]/20">Max 5MB</span>
                        <span className="px-2 py-1 bg-[#1E90FF]/5 text-[10px] font-bold uppercase rounded border border-[#1E90FF]/20">JPG, PNG, PDF</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        id="cin-recto"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCinRecto(file);
                            handleOCR(file, 'recto');
                          }
                        }}
                      />
                      <label
                        htmlFor="cin-recto"
                        className="w-full bg-[#1E90FF]/20 hover:bg-[#1E90FF] hover:text-[#0B1E3F] text-[#1E90FF] px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer block text-center"
                      >
                        Choisir un fichier
                      </label>
                    </div>

                    {/* Verso CIN */}
                    <div className="bg-gray-50 dark:bg-white/5 border-2 border-dashed border-[#1E90FF]/20 rounded-xl p-6 flex flex-col items-center text-center group hover:border-[#1E90FF]/50 transition-all cursor-pointer">
                      <div className="w-16 h-16 bg-[#1E90FF]/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-icons text-[#1E90FF] text-3xl"><BsFillCreditCard2BackFill />
</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2">CIN Verso</h3>
                      <p className="text-sm opacity-60 mb-4">Face arrière de votre carte d'identité</p>
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        <span className="px-2 py-1 bg-[#1E90FF]/5 text-[10px] font-bold uppercase rounded border border-[#1E90FF]/20">Max 5MB</span>
                        <span className="px-2 py-1 bg-[#1E90FF]/5 text-[10px] font-bold uppercase rounded border border-[#1E90FF]/20">JPG, PNG, PDF</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        id="cin-verso"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCinVerso(file);
                            handleOCR(file, 'verso');
                          }
                        }}
                      />
                      <label
                        htmlFor="cin-verso"
                        className="w-full bg-[#1E90FF]/20 hover:bg-[#1E90FF] hover:text-[#0B1E3F] text-[#1E90FF] px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer block text-center"
                      >
                        Choisir un fichier
                      </label>
                    </div>
                  </div>

                  {/* Champs extraits par OCR */}
                  <div className="bg-[#1E90FF]/5 p-6 rounded-xl border border-[#1E90FF]/10">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-icons text-[#1E90FF]">auto_awesome</span>
                      <h4 className="font-bold">Informations extraites automatiquement</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nom (OCR)</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent outline-none transition"
                          placeholder="Détecté automatiquement"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Prénom (OCR)</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent outline-none transition"
                          placeholder="Détecté automatiquement"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Date de naissance</label>
                        <input
                          type="date"
                          value={dateNaissance}
                          onChange={(e) => setDateNaissance(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Numéro CIN</label>
                        <input
                          type="text"
                          value={cinNumber}
                          onChange={(e) => setCinNumber(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent outline-none transition"
                          placeholder="00000000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Colonne droite : Photo & Sécurité */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Photo de profil */}
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-[#1E90FF]/10 flex flex-col items-center">
                    <h3 className="font-bold mb-4 text-center">Photo de Profil</h3>
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-full border-4 border-[#1E90FF]/30 flex items-center justify-center bg-[#1E90FF]/5 overflow-hidden group-hover:border-[#1E90FF] transition-all">
                        <span className="material-icons text-[#1E90FF] text-5xl opacity-40"><MdAccountCircle />
</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="profile-photo"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setProfilePhoto(file);
                        }}
                      />
                      <label
                        htmlFor="profile-photo"
                        className="absolute bottom-0 right-0 bg-[#1E90FF] text-[#0B1E3F] w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <span className="material-icons text-sm"><MdOutlineCameraAlt />

</span>
                      </label>
                    </div>
                    <p className="mt-4 text-xs text-center opacity-60">
                      Votre visage doit être clairement visible, sans lunettes de soleil ni chapeau.
                    </p>
                  </div>

                  {/* Badges de sécurité */}
                  <div className="bg-[#1E90FF]/5 rounded-xl p-4 border border-[#1E90FF]/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1E90FF]/10 flex items-center justify-center">
                        <span className="material-icons text-[#1E90FF] text-lg"><MdVerified />
</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold">Cryptage AES-256</p>
                        <p className="text-[10px] opacity-60 uppercase">Niveau bancaire</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1E90FF]/10 flex items-center justify-center">
                        <span className="material-icons text-[#1E90FF] text-lg"><FaGavel />
</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold">Conforme RGPD</p>
                        <p className="text-[10px] opacity-60 uppercase">Protection des données</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1E90FF]/10 flex items-center justify-center">
                        <span className="material-icons text-[#1E90FF] text-lg"><TiCloudStorage />
</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold">Stockage Sécurisé</p>
                        <p className="text-[10px] opacity-60 uppercase">Cloud souverain</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#1E90FF]/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <span className="material-icons text-sm">arrow_back</span>
                  Étape précédente
                </button>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <span className="text-[10px] opacity-50 font-medium">
                    Vos données sont traitées uniquement pour vérification
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOcrConfirm(true)}
                    className="px-8 py-3 bg-[#1E90FF] hover:bg-[#3EAFFF] text-[#0B1E3F] font-bold rounded-xl transition-all shadow-lg shadow-[#1E90FF]/20 flex items-center gap-2"
                  >
                    Terminer
                    <span className="material-icons text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal confirmation OCR */}
        {showOcrConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-[#1E90FF]/20"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#1E90FF]/10 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-[#1E90FF] text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Vérification des données</h3>
                  <p className="text-xs text-slate-500">Confirmez les informations extraites par OCR</p>
                </div>
              </div>

              {/* Info Banner */}
              <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex gap-2">
                <span className="text-blue-500 text-sm mt-0.5">ℹ️</span>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Les champs surlignés ont été extraits automatiquement. Vérifiez qu'ils correspondent à votre document.
                </p>
              </div>

              {/* Champs OCR */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prénom</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1E90FF] outline-none"
                    />
                    {firstName && <FaCheckCircle className="absolute right-3 top-2.5 text-emerald-500 text-sm" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nom</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1E90FF] outline-none"
                    />
                    {lastName && <FaCheckCircle className="absolute right-3 top-2.5 text-emerald-500 text-sm" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date de naissance</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateNaissance}
                      onChange={(e) => setDateNaissance(e.target.value)}
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1E90FF] outline-none"
                    />
                    {dateNaissance && <FaCheckCircle className="absolute right-3 top-2.5 text-emerald-500 text-sm" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Numéro CIN</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cinNumber}
                      onChange={(e) => setCinNumber(e.target.value)}
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1E90FF] outline-none"
                    />
                    {cinNumber && <FaCheckCircle className="absolute right-3 top-2.5 text-emerald-500 text-sm" />}
                  </div>
                </div>
              </div>

              {/* Security Banner */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-5">
                <MdVerified className="text-emerald-500 text-xl shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Vos données sont chiffrées et stockées selon les normes RGPD.
                </p>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOcrConfirm(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOcrConfirm(false);
                    router.push("/fr/dashboard");
                  }}
                  className="flex-1 bg-[#1E90FF] hover:bg-[#3EAFFF] text-white font-bold py-2.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1E90FF]/20"
                >
                  <MdVerified className="text-lg" />
                  Confirmer l'identité
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-4 sm:mt-6 pt-3 text-[10px] text-slate-400 dark:text-slate-600 flex flex-wrap justify-center gap-3 sm:gap-4 border-t border-slate-100 dark:border-slate-800/50">
          <Link href="/fr/cgu" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">
            {t("termsOfUse")}
          </Link>
          <Link href="/fr/privacy" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">
            {t("privacyPolicy")}
          </Link>
          <Link href="/fr/faq" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">
            {t("help")}
          </Link>
          <span className="text-slate-300 dark:text-slate-700">© 2026 NESTHUB</span>
        </div>

        {/* Security Message */}
        <p className="mt-3 text-center text-[10px] text-slate-400 dark:text-slate-600 max-w-xs mx-auto">
          {t("securityMessage")}
        </p>
      </div>

      {/* Decoration Gradients */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
}