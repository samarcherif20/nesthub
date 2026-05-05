"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { EyeOff, Eye, Loader2, CheckCircle } from "lucide-react";
import { TfiEmail } from "react-icons/tfi";
import { RiLockPasswordLine } from "react-icons/ri";
import {
  MdOutlineDangerous,
  MdVerified,
  MdAccountCircle,
  MdOutlineCameraAlt,
  MdLockOutline,
  MdReportGmailerrorred,
  MdOutlineAlternateEmail,
  MdOutlineArrowForwardIos,
  MdOutlineLocationOn,
  MdMarkEmailRead,
  MdPendingActions,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { MdOutlineHomeWork } from "react-icons/md";
import { TbMapPinSearch } from "react-icons/tb";
import {
  FaRegCheckCircle,
  FaCheckCircle,
  FaCheck,
  FaWhatsapp,
  FaGavel,
  FaUsers,
  FaRegUser,
} from "react-icons/fa";
import { FaAddressCard } from "react-icons/fa";
import { BsFillCreditCard2BackFill } from "react-icons/bs";
import { GiPartyPopper } from "react-icons/gi";
import { IoChevronBackSharp } from "react-icons/io5";
import { LuBadgeInfo } from "react-icons/lu";
import { TiCloudStorage } from "react-icons/ti";
import { RiUserFollowFill } from "react-icons/ri";
import ImageCropper from "@/components/ui/ImageCropper";
import { useInscription } from "./hooks/useInscription";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";

// ── Alert components ──
const SuccessAlert = ({
  message,
  onClose,
  t,
}: {
  message: string;
  onClose: () => void;
  t: any;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.9 }}
    transition={{ type: "spring", damping: 20 }}
    className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm"
  >
    <div className="bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-white/20 backdrop-blur-lg">
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
        <CheckCircle className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{t("alerts.emailSent")}</p>
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

const WhatsAppAlert = ({
  message,
  onConfirm,
  onClose,
  t,
}: {
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  t: any;
}) => (
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
          <span className="material-icons text-green-500 text-3xl">
            <FaWhatsapp />
          </span>
        </div>
        <h3 className="text-xl font-bold mb-2">{t("alerts.codeSentTitle")}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {message}
        </p>
        <button
          onClick={onConfirm}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all"
        >
          {t("alerts.gotCode")}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default function InscriptionPage() {
  const {
    t,
    mounted,
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
    formError,
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
    setProfilePhoto,
    dateNaissance,
    setDateNaissance,
    cinNumber,
    setCinNumber,
    profession,        // ← AJOUTER CETTE LIGNE
    setProfession,
    // ← ajoute ces 3
    isUploadingCIN,
    uploadCINError, 
    handleUploadCIN,
    handleConfirmIdentity,
    handleGoToCompleteProfile,
    handleGoToDashboard,
    setShowWelcome,
    isUserLoaded,
    user,
    setCurrentUserId,
    currentUserId,
    emailError,
    usernameError,
    phoneError,
    isCheckingEmail,
    isCheckingUsername,
    isCheckingPhone,
    acceptTerms,
    setAcceptTerms,
    profilePhoto,
    governorate,
    setGovernorate,
    delegation,
    setDelegation,
  } = useInscription();

  

  const router = useRouter();


  // États pour l'erreur générale avec timer
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showGeneralError, setShowGeneralError] = useState(false);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);

  // Timer pour masquer l'erreur après 5 secondes
  useEffect(() => {
    if (generalError) {
      const timer = setTimeout(() => {
        setGeneralError(null);
        setShowGeneralError(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [generalError]);

  // Surveiller les erreurs du formulaire
  useEffect(() => {
    if (formError) {
      setGeneralError(formError);
      setShowGeneralError(true);
    }
  }, [formError]);

  // Surveiller les erreurs d'unicité
  useEffect(() => {
    if (emailError) {
      setGeneralError(emailError);
      setShowGeneralError(true);
    }
  }, [emailError]);

  useEffect(() => {
    if (usernameError) {
      setGeneralError(usernameError);
      setShowGeneralError(true);
    }
  }, [usernameError]);

  useEffect(() => {
    if (phoneError) {
      setGeneralError(phoneError);
      setShowGeneralError(true);
    }
  }, [phoneError]);

  useEffect(() => {
    if (whatsappError) {
      setGeneralError(whatsappError);
      setShowGeneralError(true);
    }
  }, [whatsappError]);
  
  // ✅ AJOUTEZ CETTE FONCTION handleOCR
const handleOCR = async (file: File, side: "recto" | "verso") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("side", side);

  try {
    const response = await fetch("/api/ocr", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("📦 Réponse OCR complète:", data);  // ← AJOUTEZ CETTE LIGNE

    if (data.success && data.extracted) {
      console.log("📝 Données extraites:", data.extracted);  // ← AJOUTEZ CETTE LIGNE
      
      if (data.extracted.firstName) setFirstName(data.extracted.firstName);
      if (data.extracted.lastName) setLastName(data.extracted.lastName);
      if (data.extracted.cinNumber) setCinNumber(data.extracted.cinNumber);
      if (data.extracted.dateOfBirth) setDateNaissance(data.extracted.dateOfBirth);
      if (data.extracted.profession) setProfession(data.extracted.profession);

      toast.success("CIN détecté !", {
        description: "Les informations ont été extraites automatiquement",
      });
    } else {
      console.log("Aucune donnée OCR extraite ou erreur", data);
    }
  } catch (error) {
    console.error("Erreur OCR:", error);
    toast.error("Erreur OCR", {
      description: "Impossible de lire la carte d'identité",
    });
  }
};

  if (!mounted) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
        <div className="w-full flex items-center justify-center">
          <LoadingSpinner className="animate-spin h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-[min(100%,480px)] sm:max-w-130 md:max-w-140 lg:max-w-[600px] mx-auto">
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
          <div className="flex items-start justify-between px-2 gap-2">
            {/* Étape 1 - Informations de connexion */}
            <div className="flex flex-col items-center gap-1 min-w-20">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                  currentStep >= 1
                    ? "bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {currentStep > 1 ? <FaCheck className="text-xs" /> : "1"}
              </span>
              <span
                className={`text-xs font-medium text-center whitespace-nowrap ${
                  currentStep >= 1
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500"
                }`}
              >
                {t("step1Title")}
              </span>
            </div>

            {/* Ligne de connexion 1-2 */}
            <div
              className={`w-20 h-0.5 mt-4 ${
                currentStep > 1
                  ? "bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500"
                  : "bg-slate-200 dark:bg-slate-800"
              }`}
            ></div>

            {/* Étape 2 - Identité réelle */}
            <div className="flex flex-col items-center gap-1 min-w-20">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                  currentStep >= 2
                    ? "bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {currentStep > 2 ? <FaCheck className="text-xs" /> : "2"}
              </span>
              <span
                className={`text-xs font-medium text-center whitespace-nowrap ${
                  currentStep >= 2
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500"
                }`}
              >
                {t("step2Title")}
              </span>
            </div>

            {/* Ligne de connexion 2-3 */}
            <div
              className={`w-20 h-0.5 mt-4 ${
                currentStep > 2
                  ? "bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500"
                  : "bg-slate-200 dark:bg-slate-800"
              }`}
            ></div>

            {/* Étape 3 - Vérification WhatsApp */}
            <div className="flex flex-col items-center gap-1 min-w-20">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                  currentStep >= 3
                    ? "bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {currentStep > 3 ? <FaCheck className="text-xs" /> : "3"}
              </span>
              <span
                className={`text-xs font-medium text-center whitespace-nowrap ${
                  currentStep >= 3
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500"
                }`}
              >
                {t("step3Title")}
              </span>
            </div>

            {/* Ligne de connexion 3-4 */}
            <div
              className={`w-20 h-0.5 mt-4 ${
                currentStep > 3
                  ? "bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500"
                  : "bg-slate-200 dark:bg-slate-800"
              }`}
            ></div>

            {/* Étape 4 - Documents d'identité */}
            <div className="flex flex-col items-center gap-1 min-w-20">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                  currentStep >= 4
                    ? "bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}
              >
                4
              </span>
              <span
                className={`text-xs font-medium text-center whitespace-nowrap ${
                  currentStep >= 4
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500"
                }`}
              >
                {t("step4Title")}
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
              t={t}
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
              t={t}
            />
          )}
        </AnimatePresence>

        {/* Message d'erreur général - style comme le login */}
        {showGeneralError && generalError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-sm border border-red-200 dark:border-red-800"
          >
            <MdReportGmailerrorred className="shrink-0" size={18} />
            <span className="flex-1">{generalError}</span>
            <button
              onClick={() => {
                setShowGeneralError(false);
                setGeneralError(null);
              }}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* ÉTAPE 1 : COMPTE (EMAIL) */}
          {currentStep === 1 && !pendingVerification && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 md:p-5 rounded-xl shadow-2xl backdrop-blur-sm max-h-[85vh] overflow-y-auto"
            >
              <div className="mb-3 sm:mb-4 md:mb-5">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                  {t("title")}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {t("step1Description")}
                </p>
              </div>

              {/* Sélection du rôle */}
              <div className="mb-3 sm:mb-4">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  {t("chooseRole")} <span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("landlord")}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out cursor-pointer ${
                      role === "landlord"
                        ? "bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500 text-black border-transparent shadow-lg shadow-blue-500/30"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-linear-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 hover:text-black hover:border-transparent hover:shadow-lg hover:shadow-blue-500/20"
                    } active:bg-linear-to-r active:from-blue-500 active:via-purple-500 active:to-indigo-500 active:text-black active:border-transparent active:shadow-lg active:shadow-blue-500/30 active:scale-[0.98]`}
                  >
                    <MdOutlineHomeWork className="text-sm sm:text-base" />
                    {t("roleLandlord")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("tenant")}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out cursor-pointer ${
                      role === "tenant"
                        ? "bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500 text-black border-transparent shadow-lg shadow-blue-500/30"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-linear-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 hover:text-black hover:border-transparent hover:shadow-lg hover:shadow-blue-500/20"
                    } active:bg-linear-to-r active:from-blue-500 active:via-purple-500 active:to-indigo-500 active:text-black active:border-transparent active:shadow-lg active:shadow-blue-500/30 active:scale-[0.98]`}
                  >
                    <TbMapPinSearch className="text-xs sm:text-sm" />
                    {t("roleTenant")}
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-2.5 sm:space-y-3 md:space-y-4"
              >
                {/* Username */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("username")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <MdOutlineAlternateEmail className="text-sm sm:text-base" />
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onBlur={() => handleBlur("username")}
                      placeholder={t("username")}
                      className={`w-full pl-8 pr-8 py-1.5 sm:py-2.5 text-sm bg-gray-50 dark:bg-white/5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white ${
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("usernameInfo")}
                  </p>
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
                    {t("professionalEmail")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <TfiEmail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={14}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur("email")}
                      placeholder="contact@exemple.com"
                      className={`w-full pl-9 pr-3 py-1.5 sm:py-2.5 text-sm bg-gray-50 dark:bg-white/5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white ${
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

                {/* Mot de passe et Confirmation en ligne */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Mot de passe */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("password")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <RiLockPasswordLine
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          checkPasswordStrength(e.target.value);
                        }}
                        onBlur={() => handleBlur("password")}
                        placeholder="••••••••"
                        className={`w-full pl-9 pr-9 py-1.5 sm:py-2.5 text-sm bg-gray-50 dark:bg-white/5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white ${
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
                        {showPassword ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                      </button>
                    </div>

                    {/* Force meter */}
                    {password && (
                      <div className="mt-1.5 sm:mt-2">
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
                          <p
                            className={`text-[10px] ${
                              passwordStrength >= 3
                                ? "text-gray-500"
                                : "text-slate-700"
                            }`}
                          >
                            {t("strength")} : {getStrengthText()}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {/* t("passwordInfo") */}
                          </p>
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
                      {t("confirmPassword")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <RiLockPasswordLine
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => handleBlur("confirmPassword")}
                        placeholder="••••••••"
                        className={`w-full pl-9 pr-9 py-1.5 sm:py-2.5 text-sm bg-gray-50 dark:bg-white/5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white ${
                          touched.confirmPassword &&
                          validateConfirmPassword(confirmPassword)
                            ? "border-red-500 dark:border-red-500"
                            : "border-gray-200 dark:border-white/10"
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                      </button>
                    </div>
                    {touched.confirmPassword &&
                      validateConfirmPassword(confirmPassword) && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <MdOutlineDangerous size={12} />
                          {validateConfirmPassword(confirmPassword)}
                        </p>
                      )}
                  </div>
                </div>

                {/* Checkbox pour accepter les conditions */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor="acceptTerms"
                    className="text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                  >
                    {t("acceptTerms.prefix")}{" "}
                    <Link
                      href="/fr/terms"
                      target="_blank"
                      className="font-semibold text-purple-800 dark:text-primary hover:underline"
                    >
                      {t("acceptTerms.terms")}
                    </Link>{" "}
                    {t("acceptTerms.and")}{" "}
                    <Link
                      href="/fr/privacy"
                      target="_blank"
                      className="font-semibold text-purple-800 dark:text-primary hover:underline"
                    >
                      {t("acceptTerms.privacy")}
                    </Link>
                    {t("acceptTerms.suffix")}
                  </label>
                </div>

                <div id="clerk-captcha" />

                <button
                  type="submit"
                  disabled={isLoading || !acceptTerms}
                  className="w-full py-2 sm:py-2.5 md:py-3 bg-blue-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-300 ease-in-out hover:bg-linear-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                      {t("continue")}...
                    </>
                  ) : (
                    <>
                      {t("continue")}
                      <MdOutlineArrowForwardIos className="h-4 w-4 sm:h-5 sm:w-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Lien connexion */}
              <p className="mt-3 sm:mt-4 text-center text-xs text-slate-600 dark:text-slate-400">
                {t("alreadyHaveAccount")}{" "}
                <Link
                  href="/fr/login"
                  className="text-primary font-bold hover:underline"
                >
                  {t("login")}
                </Link>
              </p>
            </motion.div>
          )}
          {/* ÉTAPE 2 : IDENTITÉ (prénom, nom, téléphone) */}
          {currentStep === 2 && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 md:p-5 rounded-xl shadow-2xl backdrop-blur-sm  overflow-y-auto"
            >
              {/* En-tête */}
              <div className="mb-3 sm:mb-4 md:mb-5">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                  {t("identityTitle")}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {t("identitySubtitle")}
                </p>
              </div>

              {/* Notice de confidentialité */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3 mb-4 sm:mb-5">
                <RiUserFollowFill className="text-purple-600 dark:text-purple-400 text-base sm:text-lg mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {t("privacyTitle")}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t("privacyDescription")}
                  </p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {/* Section: Informations Personnelles */}
                <div>
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <MdLockOutline className="text-slate-400 text-xs sm:text-sm" />
                    <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">
                      {t("personalInfoTitle")}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Prénom */}
                    <div className="space-y-1 sm:space-y-2">
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("firstName")} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                          <FaRegUser className="text-xs" />
                        </span>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          onBlur={() =>
                            setTouchedStep2({
                              ...touchedStep2,
                              firstName: true,
                            })
                          }
                          placeholder={t("firstNamePlaceholder")}
                          className={`w-full bg-gray-50 dark:bg-white/5 border rounded-xl pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none dark:text-white ${
                            touchedStep2.firstName && !firstName.trim()
                              ? "border-red-500 dark:border-red-500"
                              : "border-gray-200 dark:border-white/10"
                          }`}
                        />
                      </div>
                      {/* Erreur sous le champ prénom */}
                      {touchedStep2.firstName && !firstName.trim() && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <MdOutlineDangerous size={12} />
                          {t("errors.firstNameRequired")}
                        </p>
                      )}
                    </div>

                    {/* Nom */}
                    <div className="space-y-1 sm:space-y-2">
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("lastName")} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                          <FaRegUser className="text-xs" />
                        </span>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          onBlur={() =>
                            setTouchedStep2({ ...touchedStep2, lastName: true })
                          }
                          placeholder={t("lastNamePlaceholder")}
                          className={`w-full bg-gray-50 dark:bg-white/5 border rounded-xl pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none dark:text-white ${
                            touchedStep2.lastName && !lastName.trim()
                              ? "border-red-500 dark:border-red-500"
                              : "border-gray-200 dark:border-white/10"
                          }`}
                        />
                      </div>
                      {/* Erreur sous le champ nom */}
                      {touchedStep2.lastName && !lastName.trim() && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <MdOutlineDangerous size={12} />
                          {t("errors.lastNameRequired")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div className="space-y-1 sm:space-y-2 mt-3 sm:mt-4">
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("phoneNumber")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none">
                        <div className="flex items-center gap-1 sm:gap-2 border-r border-slate-300 dark:border-slate-700 pr-2 sm:pr-3">
                          <div className="w-4 h-3 sm:w-5 sm:h-3.5 bg-[#C8102E] relative overflow-hidden flex items-center justify-center rounded-sm">
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full border border-white flex items-center justify-center">
                              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
                            +216
                          </span>
                        </div>
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          setPhoneNumber(digits);
                        }}
                        onBlur={() =>
                          setTouchedStep2({
                            ...touchedStep2,
                            phoneNumber: true,
                          })
                        }
                        placeholder={t("phonePlaceholder")}
                        className={`w-full bg-gray-50 dark:bg-white/5 border rounded-xl pl-20 sm:pl-24 pr-3 sm:pr-4 py-1.5 sm:py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none dark:text-white ${
                          touchedStep2.phoneNumber &&
                          (!phoneNumber || phoneNumber.length < 8)
                            ? "border-red-500 dark:border-red-500"
                            : "border-gray-200 dark:border-white/10"
                        }`}
                      />
                    </div>

                    {/* Erreur de format (champ vide) */}
                    {touchedStep2.phoneNumber && !phoneNumber && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <MdOutlineDangerous size={12} />
                        {t("errors.phoneRequired")}
                      </p>
                    )}

                    {/* Erreur de format (moins de 8 chiffres) */}
                    {touchedStep2.phoneNumber &&
                      phoneNumber &&
                      phoneNumber.length < 8 && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <MdOutlineDangerous size={12} />
                          {t("errors.phoneTooShort")}
                        </p>
                      )}

                    {/* Indicateur de vérification */}
                    {isCheckingPhone && (
                      <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                        <Loader2 className="animate-spin h-3 w-3" />
                        {t("checking")}
                      </p>
                    )}
                  </div>

                  {/* Message WhatsApp */}
                  {phoneNumber && phoneNumber.length >= 8 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-2.5 sm:p-3 bg-green-500/10 border border-green-500/30 rounded-xl"
                    >
                      <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 mb-2 text-center">
                        {t("whatsappWarning")}
                      </p>
                      <a
                        href="https://wa.me/14155238886?text=join%20earn-visit"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 sm:gap-2 w-full py-2 sm:py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all text-xs sm:text-sm"
                      >
                        <FaWhatsapp className="text-sm sm:text-base" />
                        {t("activateWhatsapp")}
                      </a>
                      <p className="text-[8px] sm:text-[10px] text-slate-400 text-center mt-2">
                        {t("whatsappInstruction")}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Adresse (optionnel) */}
                                {/* === GOUVERNORAT ET DÉLÉGATION === */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Gouvernorat */}
                  <div className="space-y-1 sm:space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Gouvernorat <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <MdOutlineLocationOn className="text-sm sm:text-base" />
                      </span>
                      <select
  value={governorate}
  onChange={(e) => {
    setGovernorate(e.target.value);
    setDelegation("");
  }}
  className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none ${
    governorate === "" 
      ? "text-gray-400 dark:text-gray-500"
      : "text-slate-900 dark:text-white"
  }`}
>
  {/* ✅ Option par défaut grisée */}
  <option value="" disabled hidden className="text-gray-400">
    Sélectionner un gouvernorat
  </option>
                        <option value="Ariana" className="text-slate-900">Ariana</option>
                        <option value="Beja" className="text-slate-900">Béja</option>
                        <option value="Ben Arous" className="text-slate-900">Ben Arous</option>
                        <option value="Bizerte" className="text-slate-900">Bizerte</option>
                        <option value="Gabes" className="text-slate-900">Gabès</option>
                        <option value="Gafsa" className="text-slate-900">Gafsa</option>
                        <option value="Jendouba" className="text-slate-900">Jendouba</option>
                        <option value="Kairouan" className="text-slate-900">Kairouan</option>
                        <option value="Kasserine" className="text-slate-900">Kasserine</option>
                        <option value="Kebili"className="text-slate-900">Kébili</option>
                        <option value="Kef" className="text-slate-900">Le Kef</option>
                        <option value="Mahdia" className="text-slate-900">Mahdia</option>
                        <option value="Manouba" className="text-slate-900">La Manouba</option>
                        <option value="Medenine" className="text-slate-900">Médenine</option>
                        <option value="Monastir" className="text-slate-900">Monastir</option>
                        <option value="Nabeul" className="text-slate-900">Nabeul</option>
                        <option value="Sfax" className="text-slate-900">Sfax</option>
                        <option value="Sidi Bouzid" className="text-slate-900">Sidi Bouzid</option>
                        <option value="Siliana" className="text-slate-900">Siliana</option>
                        <option value="Sousse" className="text-slate-900">Sousse</option>
                        <option value="Tataouine" className="text-slate-900">Tataouine</option>
                        <option value="Tozeur" className="text-slate-900">Tozeur</option>
                        <option value="Tunis" className="text-slate-900">Tunis</option>
                        <option value="Zaghouan" className="text-slate-900">Zaghouan</option>
                      </select>
                    </div>
                  </div>

                  {/* Délégation - Apparaît seulement si un gouvernorat est sélectionné */}
                  {governorate && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="space-y-1 sm:space-y-2"
  >
    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
      Délégation <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
        <MdOutlineLocationOn className="text-sm sm:text-base" />
      </span>
      <select
        value={delegation}
        onChange={(e) => setDelegation(e.target.value)}
        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none dark:text-white"
      >
        <option value="" disabled hidden>Sélectionner une délégation</option>

        {governorate === "Ariana" && (<>
          <option value="Ariana Ville">Ariana Ville</option>
          <option value="Ettadhamen">Ettadhamen</option>
          <option value="Kalaat El Andalous">Kalaat El Andalous</option>
          <option value="Mnihla">Mnihla</option>
          <option value="Raoued">Raoued</option>
          <option value="Sidi Thabet">Sidi Thabet</option>
          <option value="La Soukra">La Soukra</option>
        </>)}

        {governorate === "Beja" && (<>
          <option value="Béja Nord">Béja Nord</option>
          <option value="Béja Sud">Béja Sud</option>
          <option value="Amdoun">Amdoun</option>
          <option value="Nefza">Nefza</option>
          <option value="Téboursouk">Téboursouk</option>
          <option value="Testour">Testour</option>
          <option value="Thibar">Thibar</option>
          <option value="Medjez El Bab">Medjez El Bab</option>
        </>)}

        {governorate === "Ben Arous" && (<>
          <option value="Ben Arous Ville">Ben Arous Ville</option>
          <option value="El Mourouj">El Mourouj</option>
          <option value="Hammam Lif">Hammam Lif</option>
          <option value="Hammam Chott">Hammam Chott</option>
          <option value="Bou Mhel El Bassatine">Bou Mhel El Bassatine</option>
          <option value="Ezzahra">Ezzahra</option>
          <option value="Radès">Radès</option>
          <option value="Mégrine">Mégrine</option>
          <option value="Mornag">Mornag</option>
        </>)}

        {governorate === "Bizerte" && (<>
          <option value="Bizerte Nord">Bizerte Nord</option>
          <option value="Bizerte Sud">Bizerte Sud</option>
          <option value="Menzel Bourguiba">Menzel Bourguiba</option>
          <option value="Mateur">Mateur</option>
          <option value="Sejnane">Sejnane</option>
          <option value="Joumine">Joumine</option>
          <option value="Ghezala">Ghezala</option>
          <option value="Ras Jebel">Ras Jebel</option>
          <option value="El Alia">El Alia</option>
          <option value="Utique">Utique</option>
        </>)}

        {governorate === "Gabes" && (<>
          <option value="Gabès Ville">Gabès Ville</option>
          <option value="Gabès Médina">Gabès Médina</option>
          <option value="Gabès Ouest">Gabès Ouest</option>
          <option value="El Hamma">El Hamma</option>
          <option value="Mareth">Mareth</option>
          <option value="Matmata">Matmata</option>
          <option value="Nouvelle Matmata">Nouvelle Matmata</option>
          <option value="Menzel El Habib">Menzel El Habib</option>
          <option value="Ghannouch">Ghannouch</option>
        </>)}

        {governorate === "Gafsa" && (<>
          <option value="Gafsa Nord">Gafsa Nord</option>
          <option value="Gafsa Sud">Gafsa Sud</option>
          <option value="El Ksar">El Ksar</option>
          <option value="Moulares">Moulares</option>
          <option value="Metlaoui">Metlaoui</option>
          <option value="Redeyef">Redeyef</option>
          <option value="Snad">Snad</option>
          <option value="Belkhir">Belkhir</option>
        </>)}

        {governorate === "Jendouba" && (<>
          <option value="Jendouba">Jendouba</option>
          <option value="Jendouba Nord">Jendouba Nord</option>
          <option value="Bou Salem">Bou Salem</option>
          <option value="Tabarka">Tabarka</option>
          <option value="Ain Draham">Ain Draham</option>
          <option value="Fernana">Fernana</option>
          <option value="Ghardimaou">Ghardimaou</option>
          <option value="Oued Meliz">Oued Meliz</option>
        </>)}

        {governorate === "Kairouan" && (<>
          <option value="Kairouan Nord">Kairouan Nord</option>
          <option value="Kairouan Sud">Kairouan Sud</option>
          <option value="Sbikha">Sbikha</option>
          <option value="Chebika">Chebika</option>
          <option value="Hajeb El Ayoun">Hajeb El Ayoun</option>
          <option value="Nasrallah">Nasrallah</option>
          <option value="Oueslatia">Oueslatia</option>
          <option value="Menzel Mhiri">Menzel Mhiri</option>
          <option value="El Ala">El Ala</option>
        </>)}

        {governorate === "Kasserine" && (<>
          <option value="Kasserine Nord">Kasserine Nord</option>
          <option value="Kasserine Sud">Kasserine Sud</option>
          <option value="Sbeitla">Sbeitla</option>
          <option value="Thala">Thala</option>
          <option value="Feriana">Feriana</option>
          <option value="Foussana">Foussana</option>
          <option value="Hassi El Ferid">Hassi El Ferid</option>
          <option value="Majel Bel Abbès">Majel Bel Abbès</option>
        </>)}

        {governorate === "Kebili" && (<>
          <option value="Kébili Nord">Kébili Nord</option>
          <option value="Kébili Sud">Kébili Sud</option>
          <option value="Douz Nord">Douz Nord</option>
          <option value="Douz Sud">Douz Sud</option>
          <option value="Souk Lahad">Souk Lahad</option>
          <option value="Faouar">Faouar</option>
        </>)}

        {governorate === "Kef" && (<>
          <option value="Le Kef Ouest">Le Kef Ouest</option>
          <option value="Le Kef Est">Le Kef Est</option>
          <option value="Nebeur">Nebeur</option>
          <option value="Sakiet Sidi Youssef">Sakiet Sidi Youssef</option>
          <option value="Tajerouine">Tajerouine</option>
          <option value="Kalaat Senan">Kalaat Senan</option>
          <option value="Dahmani">Dahmani</option>
          <option value="Sers">Sers</option>
        </>)}

        {governorate === "Mahdia" && (<>
          <option value="Mahdia Ville">Mahdia Ville</option>
          <option value="Ksour Essef">Ksour Essef</option>
          <option value="El Djem">El Djem</option>
          <option value="Chebba">Chebba</option>
          <option value="Melloulèche">Melloulèche</option>
          <option value="Souassi">Souassi</option>
          <option value="Boumerdes">Boumerdes</option>
          <option value="Sidi Alouane">Sidi Alouane</option>
        </>)}

        {governorate === "Manouba" && (<>
          <option value="Manouba Ville">Manouba Ville</option>
          <option value="Oued Ellil">Oued Ellil</option>
          <option value="Tebourba">Tebourba</option>
          <option value="El Battan">El Battan</option>
          <option value="Jedaida">Jedaida</option>
          <option value="Douar Hicher">Douar Hicher</option>
          <option value="Denden">Denden</option>
        </>)}

        {governorate === "Medenine" && (<>
          <option value="Médenine Nord">Médenine Nord</option>
          <option value="Médenine Sud">Médenine Sud</option>
          <option value="Ben Gardane">Ben Gardane</option>
          <option value="Zarzis">Zarzis</option>
          <option value="Jerba Houmt Souk">Jerba Houmt Souk</option>
          <option value="Jerba Midoun">Jerba Midoun</option>
          <option value="Jerba Ajim">Jerba Ajim</option>
          <option value="Beni Khedache">Beni Khedache</option>
          <option value="Sidi Makhlouf">Sidi Makhlouf</option>
        </>)}

        {governorate === "Monastir" && (<>
          <option value="Monastir Ville">Monastir Ville</option>
          <option value="Moknine">Moknine</option>
          <option value="Jemmal">Jemmal</option>
          <option value="Ksar Hellal">Ksar Hellal</option>
          <option value="Bembla">Bembla</option>
          <option value="Sayada">Sayada</option>
          <option value="Lamta">Lamta</option>
          <option value="Téboulba">Téboulba</option>
          <option value="Zeramdine">Zeramdine</option>
        </>)}

        {governorate === "Nabeul" && (<>
          <option value="Hammamet">Hammamet</option>
          <option value="Nabeul Ville">Nabeul Ville</option>
          <option value="Dar Chaabane">Dar Chaabane</option>
          <option value="Beni Khiar">Beni Khiar</option>
          <option value="Korba">Korba</option>
          <option value="Menzel Temime">Menzel Temime</option>
          <option value="Takelsa">Takelsa</option>
          <option value="Soliman">Soliman</option>
          <option value="Bou Argoub">Bou Argoub</option>
          <option value="Grombalia">Grombalia</option>
          <option value="El Mida">El Mida</option>
          <option value="Kelibia">Kélibia</option>
          <option value="Haouaria">Haouaria</option>
        </>)}

        {governorate === "Sfax" && (<>
          <option value="Sfax Ville">Sfax Ville</option>
          <option value="Sakiet Ezzit">Sakiet Ezzit</option>
          <option value="Sakiet Eddaier">Sakiet Eddaier</option>
          <option value="Bir Ali Ben Khalifa">Bir Ali Ben Khalifa</option>
          <option value="Chihia">Chihia</option>
          <option value="El Ain">El Ain</option>
          <option value="Agareb">Agareb</option>
          <option value="Mahrès">Mahrès</option>
          <option value="Ghraiba">Ghraiba</option>
          <option value="Jebiniana">Jebiniana</option>
          <option value="El Hencha">El Hencha</option>
          <option value="Kerkennah">Kerkennah</option>
        </>)}

        {governorate === "Sidi Bouzid" && (<>
          <option value="Sidi Bouzid Ouest">Sidi Bouzid Ouest</option>
          <option value="Sidi Bouzid Est">Sidi Bouzid Est</option>
          <option value="Jilma">Jilma</option>
          <option value="Cebbala">Cebbala</option>
          <option value="Bir El Hafey">Bir El Hafey</option>
          <option value="Sidi Ali Ben Aoun">Sidi Ali Ben Aoun</option>
          <option value="Menzel Bouzaiene">Menzel Bouzaiene</option>
          <option value="Mezzouna">Mezzouna</option>
          <option value="Ouled Haffouz">Ouled Haffouz</option>
        </>)}

        {governorate === "Siliana" && (<>
          <option value="Siliana Nord">Siliana Nord</option>
          <option value="Siliana Sud">Siliana Sud</option>
          <option value="Bou Arada">Bou Arada</option>
          <option value="Gaafour">Gaafour</option>
          <option value="El Krib">El Krib</option>
          <option value="Makthar">Makthar</option>
          <option value="Rohia">Rohia</option>
          <option value="Kesra">Kesra</option>
          <option value="Bargou">Bargou</option>
        </>)}

        {governorate === "Sousse" && (<>
          <option value="Sousse Ville">Sousse Ville</option>
          <option value="Hammam Sousse">Hammam Sousse</option>
          <option value="Msaken">Msaken</option>
          <option value="Kalâa Kebira">Kalâa Kebira</option>
          <option value="Kalâa Seghira">Kalâa Seghira</option>
          <option value="Sidi Bou Ali">Sidi Bou Ali</option>
          <option value="Enfidha">Enfidha</option>
          <option value="Bouficha">Bouficha</option>
          <option value="Kondar">Kondar</option>
          <option value="Akouda">Akouda</option>
        </>)}

        {governorate === "Tataouine" && (<>
          <option value="Tataouine Nord">Tataouine Nord</option>
          <option value="Tataouine Sud">Tataouine Sud</option>
          <option value="Ghomrassen">Ghomrassen</option>
          <option value="Bir Lahmar">Bir Lahmar</option>
          <option value="Remada">Remada</option>
          <option value="Smar">Smar</option>
        </>)}

        {governorate === "Tozeur" && (<>
          <option value="Tozeur Ville">Tozeur Ville</option>
          <option value="Degache">Degache</option>
          <option value="Tamerza">Tamerza</option>
          <option value="Hazoua">Hazoua</option>
          <option value="Nefta">Nefta</option>
        </>)}

        {governorate === "Tunis" && (<>
          <option value="Tunis Centre">Tunis Centre</option>
          <option value="Bab Souika">Bab Souika</option>
          <option value="Carthage">Carthage</option>
          <option value="La Marsa">La Marsa</option>
          <option value="Le Bardo">Le Bardo</option>
          <option value="El Menzah">El Menzah</option>
          <option value="El Omrane">El Omrane</option>
          <option value="Ettahrir">Ettahrir</option>
          <option value="Cité El Khadra">Cité El Khadra</option>
          <option value="El Kabaria">El Kabaria</option>
          <option value="Sidi Hassine">Sidi Hassine</option>
        </>)}

        {governorate === "Zaghouan" && (<>
          <option value="Zaghouan Ville">Zaghouan Ville</option>
          <option value="Zriba">Zriba</option>
          <option value="Bir Mcherga">Bir Mcherga</option>
          <option value="El Fahs">El Fahs</option>
          <option value="Nadhour">Nadhour</option>
          <option value="Saouaf">Saouaf</option>
        </>)}

      </select>
    </div>
  </motion.div>
)}
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>

                {/* Section: Profil Public */}
                <div>
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <FaUsers className="text-slate-400 text-xs sm:text-sm" />
                    <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">
                      {t("publicProfileTitle")}
                    </h2>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("bio")}
                      </label>
                      <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">
                        {bio.length} / 300
                      </span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 300))}
                      placeholder={t("bioPlaceholder")}
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none dark:text-white"
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="order-2 sm:order-1 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ease-in-out cursor-pointer border border-blue-400 text-black dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-[0.98]"
                  >
                    <IoChevronBackSharp className="text-sm sm:text-base" />
                    {t("back")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Validation des champs obligatoires
                      if (!firstName.trim()) {
                        setTouchedStep2({ ...touchedStep2, firstName: true });
                        return;
                      }
                      if (!lastName.trim()) {
                        setTouchedStep2({ ...touchedStep2, lastName: true });
                        return;
                      }
                      if (!phoneNumber) {
                        setTouchedStep2({ ...touchedStep2, phoneNumber: true });
                        return;
                      }
                      if (phoneNumber.length < 8) {
                        setTouchedStep2({ ...touchedStep2, phoneNumber: true });
                        return;
                      }
                      handleSendWhatsApp();
                    }}
                    disabled={isWhatsappLoading}
                    className="order-1 sm:order-2 w-full sm:w-auto px-6 sm:px-10 py-2 sm:py-2.5 bg-blue-400 text-black font-bold rounded-xl transition-all duration-300 ease-in-out hover:bg-linear-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.98] flex items-center justify-center gap-2 text-xs sm:text-sm group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isWhatsappLoading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        {t("sending")}...
                      </>
                    ) : (
                      <>
                        {t("continue")}
                        <MdOutlineArrowForwardIos className="h-3 w-3 sm:h-4 sm:w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          {/* ÉTAPE 3 : CODE WHATSAPP */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 md:p-5 rounded-xl shadow-2xl backdrop-blur-sm max-h-[85vh] overflow-y-auto"
            >
              {/* En-tête */}
              <div className="mb-3 sm:mb-4 md:mb-5">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                  {t("whatsappStep.title")}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {t("whatsappStep.subtitle")}
                </p>
              </div>

              {/* Notice d'information */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3 mb-4 sm:mb-5">
                <FaWhatsapp className="text-green-600 dark:text-green-400 text-base sm:text-lg mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {t("whatsappStep.codeSentTitle")}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t("whatsappStep.codeSentMessage")}{" "}
                    <span className="font-medium text-green-600 dark:text-green-400">
                      +216 {phoneNumber}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {/* Code de vérification */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t("whatsappStep.verificationCode")}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="flex gap-2 sm:gap-3 justify-center my-4">
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

                          if (index < 5) {
                            const next = document.getElementById(
                              `otp-${index + 1}`,
                            );
                            if (next) (next as HTMLInputElement).focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !whatsappCode[index]) {
                            const prev = document.getElementById(
                              `otp-${index - 1}`,
                            );
                            if (prev) (prev as HTMLInputElement).focus();
                          }
                          if (e.key === "Enter" && whatsappCode.length === 6) {
                            e.preventDefault();
                            handleVerifyWhatsApp(e);
                          }
                        }}
                        id={`otp-${index}`}
                        className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-gray-50 dark:bg-white/5 border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white ${
                          whatsappError
                            ? "border-red-500 dark:border-red-500"
                            : "border-gray-200 dark:border-white/10"
                        }`}
                        disabled={isWhatsappLoading}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  {/* Indicateur de vérification */}
                  {isWhatsappLoading && (
                    <p className="mt-1 text-xs text-gray-500 flex items-center justify-center gap-1">
                      <Loader2 className="animate-spin h-3 w-3" />
                      {t("whatsappStep.checking")}
                    </p>
                  )}

                  <p className="text-[10px] sm:text-xs text-center text-slate-500 mt-2">
                    {t("whatsappStep.enterCodeInstruction")}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="order-2 sm:order-1 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ease-in-out cursor-pointer border border-blue-400 text-black dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-[0.98]"
                  >
                    <IoChevronBackSharp className="text-sm sm:text-base" />
                    {t("whatsappStep.back")}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    disabled={isWhatsappLoading}
                    className="order-1 sm:order-2 w-full sm:w-auto px-6 sm:px-10 py-2 sm:py-2.5 bg-blue-400 text-black font-bold rounded-xl transition-all duration-300 ease-in-out hover:bg-linear-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.98] flex items-center justify-center gap-2 text-xs sm:text-sm group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isWhatsappLoading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        {t("whatsappStep.sending")}...
                      </>
                    ) : (
                      <>
                        {t("whatsappStep.resendCode")}
                        <MdOutlineArrowForwardIos className="h-3 w-3 sm:h-4 sm:w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          {/* ÉTAPE 4 : DOCUMENTS D'IDENTITÉ */}
          {currentStep === 4 && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 md:p-5 rounded-xl shadow-2xl backdrop-blur-sm max-h-[85vh] overflow-y-auto"
            >
              {/* En-tête avec notice intégrée */}
              <div className="mb-4 sm:mb-5">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-1">
                    <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                      {t("documentsStep.title")}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {t("documentsStep.subtitle")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {/* Grille principale */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                  {/* Colonne gauche : Upload CIN */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <FaAddressCard className="text-slate-400 dark:text-slate-400 text-xs sm:text-sm" />
                      <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">
                        {t("documentsStep.identityDocument")}
                      </h2>
                    </div>

                    {/* Grille Recto/Verso */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Recto CIN */}
                      {/* Recto CIN */}
<div className="bg-gray-50 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-slate-500 rounded-xl p-3 sm:p-4 flex flex-col items-center text-center group hover:border-sky-500 transition-all cursor-pointer">
  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
    <FaAddressCard className="text-sky-500 dark:text-sky-400 text-xl sm:text-2xl" />
  </div>
  <h3 className="font-bold text-sm sm:text-base mb-1 text-gray-900 dark:text-white">
    {t("documentsStep.cinFront")}
  </h3>
  <p className="text-[10px] sm:text-xs opacity-60 mb-2">
    {t("documentsStep.frontSide")}
  </p>
  <div className="flex flex-wrap justify-center gap-1 mb-2">
    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-[8px] sm:text-[9px] font-bold uppercase rounded border border-blue-200 dark:border-blue-700">
      {t("documentsStep.maxSize")}
    </span>
    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-[8px] sm:text-[9px] font-bold uppercase rounded border border-blue-200 dark:border-blue-700">
      {t("documentsStep.formats")}
    </span>
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
        handleOCR(file, "recto");
      }
    }}
  />
  
  <label
    htmlFor="cin-recto"
    className="w-full py-1.5 sm:py-2 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-lg text-xs sm:text-sm transition-all cursor-pointer text-center block"
  >
    {cinRecto ? (
      <>✅ {t("documentsStep.photoAdded")}</>
    ) : (
      t("documentsStep.chooseFile")
    )}
  </label>
</div>

                      {/* Verso CIN */}
                    {/* Verso CIN */}
<div className="bg-gray-50 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-slate-500 rounded-xl p-3 sm:p-4 flex flex-col items-center text-center group hover:border-sky-500 transition-all cursor-pointer">
  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
    <BsFillCreditCard2BackFill className="text-sky-500 dark:text-sky-400 text-xl sm:text-2xl" />
  </div>
  <h3 className="font-bold text-sm sm:text-base mb-1 text-gray-900 dark:text-white">
    {t("documentsStep.cinBack")}
  </h3>
  <p className="text-[10px] sm:text-xs opacity-60 mb-2">
    {t("documentsStep.backSide")}
  </p>
  <div className="flex flex-wrap justify-center gap-1 mb-2">
    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-[8px] sm:text-[9px] font-bold uppercase rounded border border-blue-200 dark:border-blue-700">
      {t("documentsStep.maxSize")}
    </span>
    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-[8px] sm:text-[9px] font-bold uppercase rounded border border-blue-200 dark:border-blue-700">
      {t("documentsStep.formats")}
    </span>
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
        handleOCR(file, "verso");
      }
    }}
  />
  
  <label
    htmlFor="cin-verso"
    className="w-full py-1.5 sm:py-2 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-lg text-xs sm:text-sm transition-all cursor-pointer text-center block"
  >
    {cinVerso ? (
      <>✅ {t("documentsStep.photoAdded")}</>
    ) : (
      t("documentsStep.chooseFile")
    )}
  </label>
</div>
                    </div>

                    {/* Notice OCR */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 sm:p-3 flex items-start gap-2 border border-blue-200 dark:border-blue-800">
                      <MdVerified className="text-sky-600 dark:text-blue-400 text-sm sm:text-base mt-0.5 shrink-0" />
                      <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {t("documentsStep.iaOcr")}:{" "}
                        </span>
                        {t("documentsStep.ocrDescription")}
                      </div>
                    </div>
                  </div>

                  {/* Colonne droite : Photo & Sécurité */}
                  <div className="lg:col-span-4 space-y-4">
                    {/* Photo de profil */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MdAccountCircle className="text-slate-400 dark:text-slate-400 text-xs sm:text-sm" />
                        <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">
                          {t("documentsStep.profilePhoto")}
                        </h2>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 sm:p-4 flex flex-col items-center border border-blue-200 dark:border-blue-800">
                        <div className="relative group">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-slate-400 dark:border-slate-500 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 overflow-hidden group-hover:border-sky-500 transition-all">
                            {profilePhoto && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={URL.createObjectURL(profilePhoto)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onLoad={(e) => {
                                  URL.revokeObjectURL(e.currentTarget.src);
                                }}
                              />
                            )}
                            {!profilePhoto && (
                              <MdAccountCircle className="text-slate-400 dark:text-blue-500 text-4xl sm:text-5xl opacity-60" />
                            )}
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
                            className="absolute bottom-0 right-0 bg-sky-400 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <MdOutlineCameraAlt className="text-xs sm:text-sm" />
                          </label>
                        </div>
                        <p className="mt-2 text-[10px] sm:text-xs text-center text-slate-500">
                          {t("documentsStep.faceVisible")}
                        </p>
                      </div>
                    </div>

                    {/* Badges de sécurité */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MdVerified className="text-slate-400 dark:text-slate-400 text-xs sm:text-sm" />
                        <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">
                          {t("documentsStep.security")}
                        </h2>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-blue-200 dark:border-blue-800 grid grid-cols-3 gap-1 sm:gap-2">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <MdVerified className="text-purple-600 dark:text-purple-400 text-sm sm:text-base" />
                          </div>
                          <p className="text-[8px] sm:text-[9px] font-bold text-center">
                            AES-256
                          </p>
                          <p className="text-[7px] sm:text-[8px] opacity-60">
                            {t("documentsStep.banking")}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <FaGavel className="text-purple-600 dark:text-purple-400 text-sm sm:text-base" />
                          </div>
                          <p className="text-[8px] sm:text-[9px] font-bold text-center">
                            RGPD
                          </p>
                          <p className="text-[7px] sm:text-[8px] opacity-60">
                            {t("documentsStep.compliant")}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <TiCloudStorage className="text-purple-600 dark:text-purple-400 text-sm sm:text-base" />
                          </div>
                          <p className="text-[8px] sm:text-[9px] font-bold text-center">
                            {t("documentsStep.cloud")}
                          </p>
                          <p className="text-[7px] sm:text-[8px] opacity-60">
                            {t("documentsStep.sovereign")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="order-2 sm:order-1 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ease-in-out cursor-pointer border border-blue-400 text-black dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-[0.98]"
                  >
                    <IoChevronBackSharp className="text-sm sm:text-base" />
                    {t("documentsStep.previousStep")}
                  </button>

                  <button
  type="button"
  disabled={!cinRecto || !cinVerso || !profilePhoto}
  onClick={() => {
    if (!cinRecto || !cinVerso || !profilePhoto) {
      toast.error("Documents manquants", {
        description: "Veuillez uploader les 3 fichiers avant de continuer.",
      });
      return;
    }
    setShowOcrConfirm(true);
  }}
  className="order-1 sm:order-2 w-full sm:w-auto px-6 sm:px-10 py-2 sm:py-2.5 bg-blue-400 text-black font-bold rounded-xl transition-all duration-300 ease-in-out hover:bg-linear-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm"
>
  {t("documentsStep.finish")}
  <MdOutlineArrowForwardIos className="h-3 w-3 sm:h-4 sm:w-4" />
</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Modal confirmation OCR */}
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
          <FaCheckCircle className="text-indigo-700 text-xl" />
        </div>
        <div>
          <h3 className="text-lg font-bold">{t("ocrConfirm.title")}</h3>
          <p className="text-xs text-slate-500">
            {t("ocrConfirm.description")}
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex gap-2">
        <LuBadgeInfo className="text-blue-500 text-2xl mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          {t("ocrConfirm.infoBanner")}
        </p>
      </div>

      {/* Champs OCR */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t("ocrConfirm.firstName")}
          </label>
          <div className="relative">
            <input
              type="text"
              value={firstName}
              readOnly
              className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1E90FF] outline-none"
            />
            {firstName && (
              <FaCheckCircle className="absolute right-3 top-2.5 text-emerald-500 text-sm" />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t("ocrConfirm.lastName")}
          </label>
          <div className="relative">
            <input
              type="text"
              value={lastName}
              readOnly
              
              className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1E90FF] outline-none"
            />
            {lastName && (
              <FaCheckCircle className="absolute right-3 top-2.5 text-emerald-500 text-sm" />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t("ocrConfirm.birthDate")}
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateNaissance}
              readOnly
              
              className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1E90FF] outline-none"
            />
            {dateNaissance && (
              <FaCheckCircle className="absolute right-3 top-2.5 text-emerald-500 text-sm" />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t("ocrConfirm.cinNumber")}
          </label>
          <div className="relative">
            <input
              type="text"
              value={cinNumber}
              readOnly
              
              className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1E90FF] outline-none"
            />
            {cinNumber && (
              <FaCheckCircle className="absolute right-3 top-2.5 text-emerald-500 text-sm" />
            )}
          </div>
        </div>

        {/* ✅ NOUVEAU CHAMP: PROFESSION */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            {t("ocrConfirm.profession")}
            <span className="text-[10px] normal-case text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded">
              verso CIN
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={profession || ""}
              readOnly
              
              placeholder="Ex : عامل  , طبيب .."
              className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1E90FF] outline-none"
            />
            {profession && (
              <FaCheckCircle className="absolute right-3 top-2.5 text-emerald-500 text-sm" />
            )}
          </div>
        </div>
      </div>

      {/* Security Banner */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-5">
        <MdVerified className="text-emerald-500 text-xl shrink-0" />
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          {t("ocrConfirm.securityBanner")}
        </p>
      </div>

      {/* Boutons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleConfirmIdentity}
          disabled={isUploadingCIN}
          className="flex-1 bg-blue-400 hover:bg-blue-300 text-black font-bold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isUploadingCIN ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Upload en cours... (10-20s)
            </>
          ) : (
            <>
              <MdVerified className="text-lg" />
              {t("ocrConfirm.confirmIdentity")}
            </>
          )}
        </button>
      </div>
    </motion.div>
  </motion.div>
)}
        {/* Welcome Modal */}
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-primary/20"
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <GiPartyPopper className="text-4xl text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Bienvenue sur NestHub !</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Votre profil a été créé avec succès. Vous pouvez maintenant compléter vos informations.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleGoToDashboard}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  Plus tard
                </button>
                <button
                  onClick={handleGoToCompleteProfile}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white font-bold rounded-xl hover:opacity-90 transition-all text-sm"
                >
                  Compléter mon profil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* Footer */}
        <div className="mt-4 sm:mt-6 pt-3 text-[10px] text-slate-400 dark:text-slate-600 flex flex-wrap justify-center gap-3 sm:gap-4 border-t border-slate-100 dark:border-slate-800/50">
          <Link
            href="/fr/terms"
            className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
          >
            {t("termsOfUse")}
          </Link>
          <Link
            href="/fr/privacy"
            className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
          >
            {t("privacyPolicy")}
          </Link>
          <Link
            href="/fr/faq"
            className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
          >
            {t("help")}
          </Link>
          <span className="text-slate-400 dark:text-slate-700">
            © 2026 NESTHUB
          </span>
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
