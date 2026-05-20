"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  EyeOff,
  Eye,
  Loader2,
  CheckCircle,
  ArrowRight,
  Smartphone,
  RefreshCw,
  Camera,
  ShieldCheck,
  CloudUpload,
  CircleDashed,
  QrCode,
  X,
  FlipHorizontal,
  User,
} from "lucide-react";
import { TfiEmail } from "react-icons/tfi";
import { RiLockPasswordLine } from "react-icons/ri";
import {
  MdOutlineDangerous,
  MdVerified,
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
  FaUsers,
  FaRegUser,
} from "react-icons/fa";
import { BsFillPersonVcardFill, BsFillPostcardFill } from "react-icons/bs";
import { GiPartyPopper } from "react-icons/gi";
import { IoChevronBackSharp } from "react-icons/io5";
import { LuBadgeInfo } from "react-icons/lu";
import { useInscription } from "./hooks/useInscription";
import { DocumentTypeSelector } from "@/components/ui/DocumentTypeSelector";
import { DocumentUploader } from "@/components/ui/DocumentUploader";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { BiErrorAlt } from "react-icons/bi";

// Alert components
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
const pipAvatar = (url: string) => {
  if (!url) return "";
  if (url.startsWith("blob:")) return url;
  return `/api/users/avatar?url=${encodeURIComponent(url)}`;
};
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
    profession,
    setProfession,
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
    cinData,
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
    cinRectoUrl,
    setCinRectoUrl,
    cinVersoUrl,
    setCinVersoUrl,
    profilePictureUrl,
    setProfilePictureUrl,
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
  } = useInscription();

  const router = useRouter();

  // États pour l'erreur générale avec timer
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showGeneralError, setShowGeneralError] = useState(false);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);

  const totalDone = [cinRecto, cinVerso, profilePhoto].filter(Boolean).length;
  const docsDone = !!(cinRecto && cinVerso);
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

  //  FONCTION handleOCR CORRIGÉE - retourne les données extraites
  const handleOCR = async (file: File, side: "recto" | "verso") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("side", side);

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      console.log(" Réponse OCR complète:", data);

      if (data.success && data.extracted) {
        console.log(" Données extraites:", data.extracted);

        // Ne plus écraser les noms français ici

        if (data.extracted.cinNumber) setCinNumber(data.extracted.cinNumber);
        if (data.extracted.dateOfBirth)
          setDateNaissance(data.extracted.dateOfBirth);
        if (data.extracted.profession) setProfession(data.extracted.profession);
        if (data.extracted.passportNumber)
          setPassportNumber(data.extracted.passportNumber);
        if (data.extracted.expiryDate)
          setPassportExpiryDate(data.extracted.expiryDate);
        if (data.extracted.country) setPassportCountry(data.extracted.country);
        if (data.extracted.firstName) setFirstName(data.extracted.firstName);
        if (data.extracted.lastName) setLastName(data.extracted.lastName);
        toast.success(t("ocrDetected"), {
          description: t("ocrDetectedDescription"),
        });

        // Retourner les données extraites
        return data.extracted;
      } else {
        console.log("Aucune donnée OCR extraite ou erreur", data);
        return null;
      }
    } catch (error) {
      console.error("Erreur OCR:", error);
      toast.error(t("ocrError"), {
        description: t("ocrErrorDescription"),
      });
      return null;
    }
  };
  // Convertir base64 en File objet
  const base64ToFile = (
    base64: string,
    filename: string,
    mimeType: string,
  ): File => {
    const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: mimeType });
  };
  const handleMobileSync = useCallback(async () => {
    setIsMobileUploading(true);
    setUploadProgress(0);

    const userId = currentUserId || localStorage.getItem("currentUserId");
    if (!userId) {
      toast.error(t("errors.error"), { description: t("errors.userNotFound") });
      setIsMobileUploading(false);
      return;
    }

    let interval: NodeJS.Timeout | null = null;
    let timeout: NodeJS.Timeout | null = null;

    try {
      const res = await fetch("/api/mobile-upload/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, documentType }),
      });

      const data = await res.json();
      const currentSessionId = data.sessionId;

      if (currentSessionId) {
        setSessionId(currentSessionId);
        setQrUrl(data.qrUrl);
        setShowQRCode(true);
        setUploadProgress(0);

        timeout = setTimeout(() => {
          if (interval) clearInterval(interval);
          setShowQRCode(false);
          setIsMobileUploading(false);
          toast.info(t("sessionExpired"));
        }, 600000);

        interval = setInterval(async () => {
          try {
            const sessionRes = await fetch(
              `/api/mobile-upload/session?sessionId=${currentSessionId}`,
            );

            if (sessionRes.status === 404 || sessionRes.status === 410) {
              if (interval) clearInterval(interval);
              if (timeout) clearTimeout(timeout);
              setShowQRCode(false);

              setIsMobileUploading(false);
              toast.info(t("sessionExpired"));
              return;
            }

            const sessionData = await sessionRes.json();
            const filesCount = Object.keys(sessionData.files || {}).length;
            setUploadProgress(filesCount);

            //  DÉTECTION DU MODE (CIN ou PASSEPORT)
            const isPassportMode = sessionData.documentType === "passport";
            const expectedCount = isPassportMode ? 2 : 3;

            if (filesCount >= expectedCount) {
              if (interval) clearInterval(interval);
              if (timeout) clearTimeout(timeout);

              const files = sessionData.files;

              const base64ToFile = (
                base64: string,
                filename: string,
                mimeType: string,
              ): File => {
                const byteCharacters = atob(base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                return new File([byteArray], filename, { type: mimeType });
              };

              if (isPassportMode) {
                //  MODE PASSEPORT : 2 fichiers (passeport + selfie)
                if (files.passport?.data) {
                  const file = base64ToFile(
                    files.passport.data,
                    "passport.jpg",
                    files.passport.type,
                  );
                  setPassportFile(file);
                  setPassportUrl(null);
                }
                if (files.selfie?.data) {
                  const file = base64ToFile(
                    files.selfie.data,
                    "selfie.jpg",
                    files.selfie.type,
                  );
                  setProfilePhoto(file);
                  setProfilePictureUrl(null);
                }
                setShowQRCode(false);
                setIsMobileUploading(false);
                toast.success(t("mobile.receivedPassport"), {
                  description: t("mobile.clickToAnalyze"),
                });
              } else {
                //  MODE CIN : 3 fichiers (recto + verso + selfie)
                if (files.recto?.data) {
                  const file = base64ToFile(
                    files.recto.data,
                    "recto.jpg",
                    files.recto.type,
                  );
                  setCinRecto(file);
                  setCinRectoUrl(null);
                }
                if (files.verso?.data) {
                  const file = base64ToFile(
                    files.verso.data,
                    "verso.jpg",
                    files.verso.type,
                  );
                  setCinVerso(file);
                  setCinVersoUrl(null);
                }
                if (files.selfie?.data) {
                  const file = base64ToFile(
                    files.selfie.data,
                    "selfie.jpg",
                    files.selfie.type,
                  );
                  setProfilePhoto(file);
                  setProfilePictureUrl(null);
                }
                setShowQRCode(false);
                setIsMobileUploading(false);
                toast.success(t("mobile.receivedDocuments"), {
                  description: t("mobile.clickToAnalyze"),
                });
              }
            }
          } catch (error) {
            console.error("Erreur polling:", error);
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Erreur création session:", error);
      toast.error(t("errors.error"), {
        description: t("mobile.sessionCreationFailed"),
      });
      setIsMobileUploading(false);
    }
  }, [
    currentUserId,
    documentType,
    setCinRecto,
    setCinVerso,
    setProfilePhoto,
    setCinRectoUrl,
    setCinVersoUrl,
    setProfilePictureUrl,
    setPassportFile,
    setPassportUrl,
  ]);
  // COMPOSANTS POUR ÉTAPE 4
  function useObjectUrl(
    file: File | null,
    fileUrl?: string | null,
  ): string | null {
    const [url, setUrl] = useState<string | null>(null);
    const prevUrl = useRef<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
      if (prevUrl.current) {
        URL.revokeObjectURL(prevUrl.current);
        prevUrl.current = null;
      }

      // Ne créer un blob que si on a un fichier ET pas d'URL
      if (file && !fileUrl) {
        const next = URL.createObjectURL(file);
        prevUrl.current = next;
        setUrl(next);
      } else {
        setUrl(null);
      }

      return () => {
        if (prevUrl.current) {
          URL.revokeObjectURL(prevUrl.current);
          prevUrl.current = null;
        }
      };
    }, [file, fileUrl]);

    return url;
  }

  interface IDCardProps {
    side: "recto" | "verso";
    file: File | null;
    fileUrl?: string | null;
    onFile: (f: File) => void;
    onRemove: () => void;
  }

  function IDCard({ side, file, fileUrl, onFile, onRemove }: IDCardProps) {
    const preview = useObjectUrl(file, fileUrl);
    const [drag, setDrag] = useState(false);
    const id = `id-${side}`;
    const isRecto = side === "recto";

    // Utiliser preview si disponible, sinon fileUrl
    const imageSrc = fileUrl ? pipAvatar(fileUrl) : preview;

    console.log(` ${side} - fileUrl:`, fileUrl);
    console.log(` ${side} - imageSrc:`, imageSrc);
    const handleFile = (f: File) => {
      if (!f.type.startsWith("image/")) {
        toast.error(t("errors.formatNotSupported"), {
          description: t("errors.chooseImage"),
        });
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(t("errors.fileTooLarge"), {
          description: t("errors.maxSize10MB"),
        });
        return;
      }
      onFile(f);
    };

    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-4 h-4 rounded-md flex items-center justify-center ${
                isRecto
                  ? "bg-blue-500/20 text-blue-500"
                  : "bg-purple-500/20 text-purple-500"
              }`}
            >
              <FlipHorizontal className="w-2.5 h-2.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {isRecto ? t("idCardFront") : t("idCardBack")}{" "}
            </span>
          </div>
          {file && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-red-500/30 text-slate-500 hover:text-red-500 flex items-center justify-center transition-all"
            >
              <X className="w-2.5 h-2.5" />
            </motion.button>
          )}
        </div>

        <motion.div
          animate={drag ? { scale: 1.02 } : { scale: 1 }}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => document.getElementById(id)?.click()}
          className={`
          relative group cursor-pointer overflow-hidden
          rounded-xl transition-all duration-300 border-2 border-dashed
          ${
            imageSrc
              ? "border-blue-500/40 bg-blue-500/5 dark:border-indigo-500/40 dark:bg-indigo-500/5"
              : drag
                ? "border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                : "border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-400 dark:hover:border-slate-600"
          }
        `}
          style={{ aspectRatio: "2.5/ 1" }}
        >
          {imageSrc ? (
            <>
              <img
                src={imageSrc}
                alt={side}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30"
              >
                <CheckCircle className="w-2.5 h-2.5" />
                OK
              </motion.div>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                <CloudUpload className="w-5 h-5 text-white/80" />
                <span className="text-white text-[10px] font-semibold">
                  {t("replace")}
                </span>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
              <div
                className={`relative flex items-center justify-center w-10 h-7 transition-colors ${
                  drag
                    ? "border-blue-400 text-blue-400"
                    : "border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500"
                }`}
              >
                {isRecto ? (
                  <BsFillPersonVcardFill className="w-15 h-15 text-current" />
                ) : (
                  <BsFillPostcardFill className="w-15 h-15 text-current" />
                )}
              </div>
              <p className="text-[12px] text-slate-500 text-center group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400 transition-colors leading-snug">
                <span className="text-blue-500 font-semibold">
                  {t("click")}
                </span>{" "}
                {t("orDrag")}
                <br />
                <span className="text-[11px] text-slate-400 dark:text-slate-600">
                  {t("acceptedFormats")}
                </span>
              </p>
            </div>
          )}
        </motion.div>

        <input
          id={id}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  function AvatarPicker({
    file,
    fileUrl,
    onFile,
    onRemove,
  }: {
    file: File | null;
    fileUrl?: string | null;
    onFile: (f: File) => void;
    onRemove: () => void;
  }) {
    const preview = useObjectUrl(file, fileUrl);
    const imageSrc = fileUrl ? pipAvatar(fileUrl) : preview;

    console.log(` Avatar - fileUrl:`, fileUrl);
    console.log(` Avatar - imageSrc:`, imageSrc);

    return (
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById("profile-pick")?.click()}
            className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500/60 transition-colors group"
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-slate-400 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
            )}
          </motion.div>
          <label
            htmlFor="profile-pick"
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center cursor-pointer border-2 border-white dark:border-slate-900 hover:scale-110 transition-transform shadow-lg"
          >
            <Camera className="w-2.5 h-2.5 text-white" />
          </label>
          <input
            id="profile-pick"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t("profilePhoto")}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">
            {t("profilePhotoOptional")}
          </p>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 mt-1"
            >
              <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                {file.name}
              </span>
            </motion.div>
          )}
        </div>
        {file && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onRemove}
            className="flex-shrink-0 w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-500/20 text-slate-400 dark:text-slate-600 hover:text-red-500 flex items-center justify-center transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
    );
  }
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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start p-3 sm:p-4 md:p-6">
      {" "}
      {/* ── Arrière-plan ciel bleu avec coupure diagonale écarlate ── */}
      {/* ── Arrière-plan ciel bleu avec coupure diagonale écarlate ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {" "}
        <div className="absolute -top-24 left-[-6rem] h-72 w-72 rounded-full bg-white blur-3xl dark:bg-blue-500/10" />
        <div className="absolute top-8 right-16 h-56 w-56 rounded-full bg-sky-200/50 blur-3xl dark:bg-purple-500/10" />
        <div className="absolute -bottom-24 left-[-6rem] h-72 w-72 rounded-full bg-sky-200/50 blur-3xl dark:bg-purple-500/10" />
        <div className="absolute bottom-8 right-16 h-56 w-56 rounded-full bg-white/70 blur-3xl dark:bg-blue-500/10" />
        {/* Ligne inclinée blanche */}
        <div className="absolute inset-x-0 bottom-[41.5%] h-px rotate-[-5deg] bg-white/40 dark:bg-white/10" />
        <div
          className="absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-r from-blue-500 via-sky-500 to-purple-500 shadow-[0_-18px_50px_rgba(59,130,246,0.22)] dark:from-[#172554] dark:via-[#1d4ed8] dark:to-[#581c87] dark:shadow-[0_-18px_50px_rgba(37,99,235,0.18)]"
          style={{ clipPath: "polygon(0 32%, 100% 0, 100% 100%, 0 100%)" }}
        />
      </div>
      <div className="w-full max-w-[min(100%,800px)] sm:max-w-3xl md:max-w-4xl lg:max-w-[900px] mx-auto flex flex-col justify-center">
        {" "}
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
          <div className="flex items-start justify-between px-2 gap-3">
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
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 md:p-5 rounded-xl shadow-2xl backdrop-blur-sm"
            >
              <div className="mb-3 sm:mb-4 md:mb-5">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                  {t("title")}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {t("step1Description")}
                </p>
              </div>

              {/* Sélection du rôle - Version avec bordure dégradée */}
              <div className="mb-6 sm:mb-8">
                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-3">
                  {t("chooseRole")} <span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("landlord")}
                    className={`
        group flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl
        transition-all duration-300 active:scale-[0.98] cursor-pointer
        ${
          role === "landlord"
            ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white shadow-md shadow-blue-500/30"
            : "bg-gray-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:shadow-md border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
        }
      `}
                  >
                    <MdOutlineHomeWork
                      className={`text-base sm:text-lg transition-transform group-hover:scale-110 ${role === "landlord" ? "text-white" : "text-gray-500 dark:text-gray-400"}`}
                    />
                    <span className="text-sm font-semibold">
                      {t("roleLandlord")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("tenant")}
                    className={`
        group flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl
        transition-all duration-300 active:scale-[0.98] cursor-pointer
        ${
          role === "tenant"
            ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white shadow-md shadow-blue-500/30"
            : "bg-gray-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:shadow-md border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
        }
      `}
                  >
                    <TbMapPinSearch
                      className={`text-base sm:text-lg transition-transform group-hover:scale-110 ${role === "tenant" ? "text-white" : "text-gray-500 dark:text-gray-400"}`}
                    />
                    <span className="text-sm font-semibold">
                      {t("roleTenant")}
                    </span>
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
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 md:p-5 rounded-xl shadow-2xl backdrop-blur-sm"
            >
              {/* En-tête avec badge de confidentialité */}
              <div className="mb-3 sm:mb-4 md:mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                    {t("identityTitle")}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {t("identitySubtitle")}
                  </p>
                </div>

                {/* Badge Confidentialité */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    {t("privacyGuaranteed")}
                    <p className="text-[9px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("privacyGuaranteedDescription")}
                    </p>
                  </span>
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
                      {t("governorate")} <span className="text-red-500">*</span>
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
                        className={`w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none ${
                          governorate === ""
                            ? "text-gray-400 dark:text-gray-500"
                            : "text-slate-900 dark:text-slate-200"
                        }`}
                      >
                        <option
                          value=""
                          disabled
                          hidden
                          className="text-gray-400 dark:text-gray-500"
                        >
                          {t("selectGovernorate")}
                        </option>
                        <option
                          value="Ariana"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Ariana
                        </option>
                        <option
                          value="Beja"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Béja
                        </option>
                        <option
                          value="Ben Arous"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Ben Arous
                        </option>
                        <option
                          value="Bizerte"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Bizerte
                        </option>
                        <option
                          value="Gabes"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Gabès
                        </option>
                        <option
                          value="Gafsa"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Gafsa
                        </option>
                        <option
                          value="Jendouba"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Jendouba
                        </option>
                        <option
                          value="Kairouan"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Kairouan
                        </option>
                        <option
                          value="Kasserine"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Kasserine
                        </option>
                        <option
                          value="Kebili"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Kébili
                        </option>
                        <option
                          value="Kef"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Le Kef
                        </option>
                        <option
                          value="Mahdia"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Mahdia
                        </option>
                        <option
                          value="Manouba"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          La Manouba
                        </option>
                        <option
                          value="Medenine"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Médenine
                        </option>
                        <option
                          value="Monastir"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Monastir
                        </option>
                        <option
                          value="Nabeul"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Nabeul
                        </option>
                        <option
                          value="Sfax"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Sfax
                        </option>
                        <option
                          value="Sidi Bouzid"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Sidi Bouzid
                        </option>
                        <option
                          value="Siliana"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Siliana
                        </option>
                        <option
                          value="Sousse"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Sousse
                        </option>
                        <option
                          value="Tataouine"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Tataouine
                        </option>
                        <option
                          value="Tozeur"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Tozeur
                        </option>
                        <option
                          value="Tunis"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Tunis
                        </option>
                        <option
                          value="Zaghouan"
                          className="text-slate-900 dark:text-slate-200"
                        >
                          Zaghouan
                        </option>
                      </select>
                      {step2Errors.governorate && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <BiErrorAlt size={12} />
                          {step2Errors.governorate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Délégation */}
                  {governorate && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-1 sm:space-y-2"
                    >
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("delegation")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                          <MdOutlineLocationOn className="text-sm sm:text-base" />
                        </span>
                        <select
                          value={delegation}
                          onChange={(e) => setDelegation(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-200"
                        >
                          <option
                            value=""
                            disabled
                            hidden
                            className="text-gray-400 dark:text-gray-500"
                          >
                            {t("selectDelegation")}{" "}
                          </option>

                          {governorate === "Ariana" && (
                            <>
                              <option
                                value="Ariana Ville"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ariana Ville
                              </option>
                              <option
                                value="Ettadhamen"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ettadhamen
                              </option>
                              <option
                                value="Kalaat El Andalous"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kalaat El Andalous
                              </option>
                              <option
                                value="Mnihla"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Mnihla
                              </option>
                              <option
                                value="Raoued"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Raoued
                              </option>
                              <option
                                value="Sidi Thabet"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sidi Thabet
                              </option>
                              <option
                                value="La Soukra"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                La Soukra
                              </option>
                            </>
                          )}

                          {governorate === "Beja" && (
                            <>
                              <option
                                value="Béja Nord"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Béja Nord
                              </option>
                              <option
                                value="Béja Sud"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Béja Sud
                              </option>
                              <option
                                value="Amdoun"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Amdoun
                              </option>
                              <option
                                value="Nefza"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Nefza
                              </option>
                              <option
                                value="Téboursouk"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Téboursouk
                              </option>
                              <option
                                value="Testour"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Testour
                              </option>
                              <option
                                value="Thibar"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Thibar
                              </option>
                              <option
                                value="Medjez El Bab"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Medjez El Bab
                              </option>
                            </>
                          )}

                          {governorate === "Ben Arous" && (
                            <>
                              <option
                                value="Ben Arous Ville"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ben Arous Ville
                              </option>
                              <option
                                value="El Mourouj"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Mourouj
                              </option>
                              <option
                                value="Hammam Lif"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Hammam Lif
                              </option>
                              <option
                                value="Hammam Chott"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Hammam Chott
                              </option>
                              <option
                                value="Bou Mhel El Bassatine"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bou Mhel El Bassatine
                              </option>
                              <option
                                value="Ezzahra"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ezzahra
                              </option>
                              <option
                                value="Radès"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Radès
                              </option>
                              <option
                                value="Mégrine"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Mégrine
                              </option>
                              <option
                                value="Mornag"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Mornag
                              </option>
                            </>
                          )}

                          {governorate === "Bizerte" && (
                            <>
                              <option
                                value="Bizerte Nord"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bizerte Nord
                              </option>
                              <option
                                value="Bizerte Sud"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bizerte Sud
                              </option>
                              <option
                                value="Menzel Bourguiba"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Menzel Bourguiba
                              </option>
                              <option
                                value="Mateur"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Mateur
                              </option>
                              <option
                                value="Sejnane"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sejnane
                              </option>
                              <option
                                value="Joumine"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Joumine
                              </option>
                              <option
                                value="Ghezala"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ghezala
                              </option>
                              <option
                                value="Ras Jebel"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ras Jebel
                              </option>
                              <option
                                value="El Alia"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Alia
                              </option>
                              <option
                                value="Utique"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Utique
                              </option>
                            </>
                          )}

                          {governorate === "Gabes" && (
                            <>
                              <option
                                value="Gabès Ville"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Gabès Ville
                              </option>
                              <option
                                value="Gabès Médina"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Gabès Médina
                              </option>
                              <option
                                value="Gabès Ouest"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Gabès Ouest
                              </option>
                              <option
                                value="El Hamma"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Hamma
                              </option>
                              <option
                                value="Mareth"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Mareth
                              </option>
                              <option
                                value="Matmata"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Matmata
                              </option>
                              <option
                                value="Nouvelle Matmata"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Nouvelle Matmata
                              </option>
                              <option
                                value="Menzel El Habib"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Menzel El Habib
                              </option>
                              <option
                                value="Ghannouch"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ghannouch
                              </option>
                            </>
                          )}

                          {governorate === "Gafsa" && (
                            <>
                              <option
                                value="Gafsa Nord"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Gafsa Nord
                              </option>
                              <option
                                value="Gafsa Sud"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Gafsa Sud
                              </option>
                              <option
                                value="El Ksar"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Ksar
                              </option>
                              <option
                                value="Moulares"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Moulares
                              </option>
                              <option
                                value="Metlaoui"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Metlaoui
                              </option>
                              <option
                                value="Redeyef"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Redeyef
                              </option>
                              <option
                                value="Snad"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Snad
                              </option>
                              <option
                                value="Belkhir"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Belkhir
                              </option>
                              <option
                                value="Sened"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sened
                              </option>
                              <option
                                value="El Guettar"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Guettar
                              </option>
                            </>
                          )}

                          {governorate === "Jendouba" && (
                            <>
                              <option
                                value="Jendouba"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Jendouba
                              </option>
                              <option
                                value="Jendouba Nord"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Jendouba Nord
                              </option>
                              <option
                                value="Bou Salem"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bou Salem
                              </option>
                              <option
                                value="Tabarka"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Tabarka
                              </option>
                              <option
                                value="Ain Draham"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ain Draham
                              </option>
                              <option
                                value="Fernana"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Fernana
                              </option>
                              <option
                                value="Ghardimaou"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ghardimaou
                              </option>
                              <option
                                value="Oued Meliz"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Oued Meliz
                              </option>
                            </>
                          )}

                          {governorate === "Kairouan" && (
                            <>
                              <option
                                value="Kairouan Nord"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kairouan Nord
                              </option>
                              <option
                                value="Kairouan Sud"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kairouan Sud
                              </option>
                              <option
                                value="Sbikha"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sbikha
                              </option>
                              <option
                                value="Chebika"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Chebika
                              </option>
                              <option
                                value="Hajeb El Ayoun"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Hajeb El Ayoun
                              </option>
                              <option
                                value="Nasrallah"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Nasrallah
                              </option>
                              <option
                                value="Oueslatia"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Oueslatia
                              </option>
                              <option
                                value="Menzel Mhiri"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Menzel Mhiri
                              </option>
                              <option
                                value="El Ala"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Ala
                              </option>
                              <option
                                value="Bou Hajla"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bou Hajla
                              </option>
                            </>
                          )}

                          {governorate === "Kasserine" && (
                            <>
                              <option
                                value="Kasserine Nord"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kasserine Nord
                              </option>
                              <option
                                value="Kasserine Sud"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kasserine Sud
                              </option>
                              <option
                                value="Sbeitla"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sbeitla
                              </option>
                              <option
                                value="Thala"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Thala
                              </option>
                              <option
                                value="Feriana"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Feriana
                              </option>
                              <option
                                value="Foussana"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Foussana
                              </option>
                              <option
                                value="Hassi El Ferid"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Hassi El Ferid
                              </option>
                              <option
                                value="Majel Bel Abbès"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Majel Bel Abbès
                              </option>
                              <option
                                value="El Ayoun"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Ayoun
                              </option>
                              <option
                                value="Jedeliane"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Jedeliane
                              </option>
                            </>
                          )}

                          {governorate === "Kebili" && (
                            <>
                              <option
                                value="Kébili Nord"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kébili Nord
                              </option>
                              <option
                                value="Kébili Sud"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kébili Sud
                              </option>
                              <option
                                value="Douz Nord"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Douz Nord
                              </option>
                              <option
                                value="Douz Sud"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Douz Sud
                              </option>
                              <option
                                value="Souk Lahad"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Souk Lahad
                              </option>
                              <option
                                value="Faouar"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Faouar
                              </option>
                            </>
                          )}

                          {governorate === "Kef" && (
                            <>
                              <option
                                value="Le Kef Ouest"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Le Kef Ouest
                              </option>
                              <option
                                value="Le Kef Est"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Le Kef Est
                              </option>
                              <option
                                value="Nebeur"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Nebeur
                              </option>
                              <option
                                value="Sakiet Sidi Youssef"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sakiet Sidi Youssef
                              </option>
                              <option
                                value="Tajerouine"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Tajerouine
                              </option>
                              <option
                                value="Kalaat Senan"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kalaat Senan
                              </option>
                              <option
                                value="Dahmani"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Dahmani
                              </option>
                              <option
                                value="Sers"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sers
                              </option>
                              <option
                                value="Touiref"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Touiref
                              </option>
                            </>
                          )}

                          {governorate === "Mahdia" && (
                            <>
                              <option
                                value="Mahdia Ville"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Mahdia Ville
                              </option>
                              <option
                                value="Ksour Essef"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ksour Essef
                              </option>
                              <option
                                value="El Djem"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Djem
                              </option>
                              <option
                                value="Chebba"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Chebba
                              </option>
                              <option
                                value="Melloulèche"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Melloulèche
                              </option>
                              <option
                                value="Souassi"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Souassi
                              </option>
                              <option
                                value="Boumerdes"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Boumerdes
                              </option>
                              <option
                                value="Sidi Alouane"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sidi Alouane
                              </option>
                              <option
                                value="Chorbane"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Chorbane
                              </option>
                              <option
                                value="Hebira"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Hebira
                              </option>
                            </>
                          )}

                          {governorate === "Manouba" && (
                            <>
                              <option
                                value="Manouba Ville"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Manouba Ville
                              </option>
                              <option
                                value="Oued Ellil"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Oued Ellil
                              </option>
                              <option
                                value="Tebourba"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Tebourba
                              </option>
                              <option
                                value="El Battan"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Battan
                              </option>
                              <option
                                value="Jedaida"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Jedaida
                              </option>
                              <option
                                value="Douar Hicher"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Douar Hicher
                              </option>
                              <option
                                value="Denden"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Denden
                              </option>
                              <option
                                value="Mornaguia"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Mornaguia
                              </option>
                              <option
                                value="Borj El Amri"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Borj El Amri
                              </option>
                            </>
                          )}

                          {governorate === "Medenine" && (
                            <>
                              <option
                                value="Médenine Nord"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Médenine Nord
                              </option>
                              <option
                                value="Médenine Sud"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Médenine Sud
                              </option>
                              <option
                                value="Ben Gardane"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ben Gardane
                              </option>
                              <option
                                value="Zarzis"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Zarzis
                              </option>
                              <option
                                value="Jerba Houmt Souk"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Jerba Houmt Souk
                              </option>
                              <option
                                value="Jerba Midoun"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Jerba Midoun
                              </option>
                              <option
                                value="Jerba Ajim"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Jerba Ajim
                              </option>
                              <option
                                value="Beni Khedache"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Beni Khedache
                              </option>
                              <option
                                value="Sidi Makhlouf"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sidi Makhlouf
                              </option>
                            </>
                          )}

                          {governorate === "Monastir" && (
                            <>
                              <option
                                value="Monastir Ville"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Monastir Ville
                              </option>
                              <option
                                value="Moknine"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Moknine
                              </option>
                              <option
                                value="Jemmal"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Jemmal
                              </option>
                              <option
                                value="Ksar Hellal"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ksar Hellal
                              </option>
                              <option
                                value="Bembla"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bembla
                              </option>
                              <option
                                value="Sayada"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sayada
                              </option>
                              <option
                                value="Lamta"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Lamta
                              </option>
                              <option
                                value="Téboulba"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Téboulba
                              </option>
                              <option
                                value="Zeramdine"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Zeramdine
                              </option>
                              <option
                                value="Beni Hassen"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Beni Hassen
                              </option>
                            </>
                          )}

                          {governorate === "Nabeul" && (
                            <>
                              <option
                                value="Hammamet"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Hammamet
                              </option>
                              <option
                                value="Nabeul Ville"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Nabeul Ville
                              </option>
                              <option
                                value="Dar Chaabane"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Dar Chaabane
                              </option>
                              <option
                                value="Beni Khiar"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Beni Khiar
                              </option>
                              <option
                                value="Korba"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Korba
                              </option>
                              <option
                                value="Menzel Temime"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Menzel Temime
                              </option>
                              <option
                                value="Takelsa"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Takelsa
                              </option>
                              <option
                                value="Soliman"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Soliman
                              </option>
                              <option
                                value="Bou Argoub"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bou Argoub
                              </option>
                              <option
                                value="Grombalia"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Grombalia
                              </option>
                              <option
                                value="El Mida"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Mida
                              </option>
                              <option
                                value="Kelibia"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kélibia
                              </option>
                              <option
                                value="Haouaria"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Haouaria
                              </option>
                              <option
                                value="Menzel Bouzelfa"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Menzel Bouzelfa
                              </option>
                            </>
                          )}

                          {governorate === "Sfax" && (
                            <>
                              <option
                                value="Sfax Ville"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sfax Ville
                              </option>
                              <option
                                value="Sakiet Ezzit"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sakiet Ezzit
                              </option>
                              <option
                                value="Sakiet Eddaier"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sakiet Eddaier
                              </option>
                              <option
                                value="Bir Ali Ben Khalifa"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bir Ali Ben Khalifa
                              </option>
                              <option
                                value="Chihia"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Chihia
                              </option>
                              <option
                                value="El Ain"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Ain
                              </option>
                              <option
                                value="Agareb"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Agareb
                              </option>
                              <option
                                value="Mahrès"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Mahrès
                              </option>
                              <option
                                value="Ghraiba"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ghraiba
                              </option>
                              <option
                                value="Jebiniana"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Jebiniana
                              </option>
                              <option
                                value="El Hencha"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Hencha
                              </option>
                              <option
                                value="Kerkennah"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kerkennah
                              </option>
                            </>
                          )}

                          {governorate === "Sidi Bouzid" && (
                            <>
                              <option
                                value="Sidi Bouzid Ouest"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sidi Bouzid Ouest
                              </option>
                              <option
                                value="Sidi Bouzid Est"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sidi Bouzid Est
                              </option>
                              <option
                                value="Jilma"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Jilma
                              </option>
                              <option
                                value="Cebbala"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Cebbala
                              </option>
                              <option
                                value="Bir El Hafey"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bir El Hafey
                              </option>
                              <option
                                value="Sidi Ali Ben Aoun"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sidi Ali Ben Aoun
                              </option>
                              <option
                                value="Menzel Bouzaiene"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Menzel Bouzaiene
                              </option>
                              <option
                                value="Mezzouna"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Mezzouna
                              </option>
                              <option
                                value="Ouled Haffouz"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ouled Haffouz
                              </option>
                            </>
                          )}

                          {governorate === "Siliana" && (
                            <>
                              <option
                                value="Siliana Nord"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Siliana Nord
                              </option>
                              <option
                                value="Siliana Sud"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Siliana Sud
                              </option>
                              <option
                                value="Bou Arada"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bou Arada
                              </option>
                              <option
                                value="Gaafour"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Gaafour
                              </option>
                              <option
                                value="El Krib"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Krib
                              </option>
                              <option
                                value="Makthar"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Makthar
                              </option>
                              <option
                                value="Rohia"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Rohia
                              </option>
                              <option
                                value="Kesra"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kesra
                              </option>
                              <option
                                value="Bargou"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bargou
                              </option>
                              <option
                                value="El Aroussa"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Aroussa
                              </option>
                            </>
                          )}

                          {governorate === "Sousse" && (
                            <>
                              <option
                                value="Sousse Ville"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sousse Ville
                              </option>
                              <option
                                value="Hammam Sousse"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Hammam Sousse
                              </option>
                              <option
                                value="Msaken"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Msaken
                              </option>
                              <option
                                value="Kalâa Kebira"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kalâa Kebira
                              </option>
                              <option
                                value="Kalâa Seghira"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kalâa Seghira
                              </option>
                              <option
                                value="Sidi Bou Ali"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sidi Bou Ali
                              </option>
                              <option
                                value="Enfidha"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Enfidha
                              </option>
                              <option
                                value="Bouficha"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bouficha
                              </option>
                              <option
                                value="Kondar"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Kondar
                              </option>
                              <option
                                value="Akouda"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Akouda
                              </option>
                            </>
                          )}

                          {governorate === "Tataouine" && (
                            <>
                              <option
                                value="Tataouine Nord"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Tataouine Nord
                              </option>
                              <option
                                value="Tataouine Sud"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Tataouine Sud
                              </option>
                              <option
                                value="Ghomrassen"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ghomrassen
                              </option>
                              <option
                                value="Bir Lahmar"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bir Lahmar
                              </option>
                              <option
                                value="Remada"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Remada
                              </option>
                              <option
                                value="Smar"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Smar
                              </option>
                              <option
                                value="Dehiba"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Dehiba
                              </option>
                            </>
                          )}

                          {governorate === "Tozeur" && (
                            <>
                              <option
                                value="Tozeur Ville"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Tozeur Ville
                              </option>
                              <option
                                value="Degache"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Degache
                              </option>
                              <option
                                value="Tamerza"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Tamerza
                              </option>
                              <option
                                value="Hazoua"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Hazoua
                              </option>
                              <option
                                value="Nefta"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Nefta
                              </option>
                            </>
                          )}

                          {governorate === "Tunis" && (
                            <>
                              <option
                                value="Tunis Centre"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Tunis Centre
                              </option>
                              <option
                                value="Bab Souika"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bab Souika
                              </option>
                              <option
                                value="Carthage"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Carthage
                              </option>
                              <option
                                value="La Marsa"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                La Marsa
                              </option>
                              <option
                                value="Le Bardo"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Le Bardo
                              </option>
                              <option
                                value="El Menzah"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Menzah
                              </option>
                              <option
                                value="El Omrane"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Omrane
                              </option>
                              <option
                                value="Ettahrir"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Ettahrir
                              </option>
                              <option
                                value="Cité El Khadra"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Cité El Khadra
                              </option>
                              <option
                                value="El Kabaria"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Kabaria
                              </option>
                              <option
                                value="Sidi Hassine"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Sidi Hassine
                              </option>
                            </>
                          )}

                          {governorate === "Zaghouan" && (
                            <>
                              <option
                                value="Zaghouan Ville"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Zaghouan Ville
                              </option>
                              <option
                                value="Zriba"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Zriba
                              </option>
                              <option
                                value="Bir Mcherga"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Bir Mcherga
                              </option>
                              <option
                                value="El Fahs"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                El Fahs
                              </option>
                              <option
                                value="Nadhour"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Nadhour
                              </option>
                              <option
                                value="Saouaf"
                                className="text-slate-900 dark:text-slate-200"
                              >
                                Saouaf
                              </option>
                            </>
                          )}
                        </select>
                      </div>
                      {step2Errors.delegation && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <BiErrorAlt size={12} />
                          {step2Errors.delegation}
                        </p>
                      )}
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

                {/* Footer Actions - ÉTAPE 2 */}
                <div className="pt-3 sm:pt-4 flex gap-3 sm:gap-4 items-center justify-between border-t border-slate-200 dark:border-slate-700">
                  {/* Bouton Retour */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ease-in-out cursor-pointer border border-blue-400 text-black dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-[0.98]"
                  >
                    <IoChevronBackSharp className="text-sm sm:text-base" />
                    {t("back")}
                  </button>

                  {/* Bouton Continuer */}
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep2()) {
                        handleSendWhatsApp();
                      } else {
                        toast.error(t("errors.correctErrors"));
                      }
                    }}
                    disabled={isWhatsappLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-blue-400 text-black font-bold rounded-xl transition-all duration-300 ease-in-out hover:bg-linear-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.98] text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 md:p-5 rounded-xl shadow-2xl backdrop-blur-sm"
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
                    {t("whatsappStep.codeSentTitle")}{" "}
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
                <div className="pt-3 sm:pt-4 flex gap-3 sm:gap-4 items-center justify-between border-t border-slate-200 dark:border-slate-700">
                  {/* Bouton Retour */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ease-in-out cursor-pointer border border-blue-400 text-black dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 active:scale-[0.98]"
                  >
                    <IoChevronBackSharp className="text-sm sm:text-base" />
                    {t("whatsappStep.back")}
                  </button>

                  {/* Bouton Resend Code */}
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    disabled={isWhatsappLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-blue-400 text-black font-bold rounded-xl transition-all duration-300 ease-in-out hover:bg-linear-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.98] text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* ÉTAPE 4 : DOCUMENTS D'IDENTITÉ AVEC OPTIONS CIN / PASSEPORT */}
          {currentStep === 4 && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl backdrop-blur-sm"
            >
              {/* Header with QR trigger */}
              <div className="px-5 pt-5 pb-3 flex items-start justify-between border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                      {t("documentsStep.title")}
                    </h1>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {t("documentsStep.subtitle")}
                  </p>
                </div>

                {/* Mobile QR trigger */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMobileSync}
                  className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-600 dark:text-blue-400 text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="text-xs sm:text-sm hidden sm:inline">
                    {t("mobileUpload")}
                  </span>
                </motion.button>
              </div>

              {/* SELECTEUR TYPE DE DOCUMENT */}
              <div className="px-5 pt-4">
                <DocumentTypeSelector
                  value={documentType}
                  onChange={setDocumentType}
                />
              </div>

              {/* PROGRESS CHIPS - Dynamique selon le type */}
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/40">
                  {documentType === "cin" ? (
                    <>
                      {[
                        { label: t("cinFront"), done: !!cinRecto },
                        { label: t("cinBack"), done: !!cinVerso },
                        { label: t("photo"), done: !!profilePhoto },
                      ].map(({ label, done }) => (
                        <div
                          key={label}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-300 ${
                            done
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                              : "text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700/50"
                          }`}
                        >
                          {done ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <CircleDashed className="w-3 h-3" />
                          )}
                          {label}
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        {
                          label: t("passportDocumentLabel"),
                          done: !!passportFile,
                        },
                        { label: t("photo"), done: !!profilePhoto },
                      ].map(({ label, done }) => (
                        <div
                          key={label}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-300 ${
                            done
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                              : "text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700/50"
                          }`}
                        >
                          {done ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <CircleDashed className="w-3 h-3" />
                          )}
                          {label}
                        </div>
                      ))}
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700/60 mx-0.5" />
                      <div className="text-[10px] font-bold text-slate-500 whitespace-nowrap px-1">
                        {[passportFile, profilePhoto].filter(Boolean).length}
                        <span className="text-slate-300 dark:text-slate-700">
                          /2
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* CONTENU SELON LE TYPE DE DOCUMENT */}
              {documentType === "cin" ? (
                <>
                  {/* CIN Cards - Horizontal layout */}
                  <div
                    className="px-10 pb-2 relative z-10"
                    style={{ overflow: "visible" }}
                  >
                    {" "}
                    <div
                      className={`flex gap-3 ${isMobileUploading ? "opacity-60 pointer-events-none" : ""}`}
                    >
                      <IDCard
                        side="recto"
                        file={cinRecto}
                        fileUrl={cinRectoUrl}
                        onFile={(file) => {
                          setCinRecto(file);
                          handleOCR(file, "recto");
                        }}
                        onRemove={() => {
                          setCinRecto(null);
                          setCinRectoUrl(null);
                        }}
                      />
                      <IDCard
                        side="verso"
                        file={cinVerso}
                        fileUrl={cinVersoUrl}
                        onFile={(file) => {
                          setCinVerso(file);
                          handleOCR(file, "verso");
                        }}
                        onRemove={() => {
                          setCinVerso(null);
                          setCinVersoUrl(null);
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* PASSEPORT Upload - 1 face */}
                  <div className="px-5 pb-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t("passport.uploadLabel")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <DocumentUploader
                      file={passportFile}
                      fileUrl={passportUrl}
                      onFile={async (file) => {
                        setPassportFile(file);
                      }}
                      onRemove={() => {
                        setPassportFile(null);
                        setPassportUrl(null);
                      }}
                      isUploading={isUploadingCIN}
                    />
                  </div>
                </>
              )}

              {/* Divider optionnel */}
              <div className="mx-5 my-3 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                <span className="text-[12px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                  {t("profilePhotoTitle")}
                </span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              </div>

              {/* Avatar Picker */}
              <div className="mx-5 mb-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/40 rounded-2xl p-3.5">
                <AvatarPicker
                  file={profilePhoto}
                  fileUrl={profilePictureUrl}
                  onFile={setProfilePhoto}
                  onRemove={() => {
                    setProfilePhoto(null);
                    setProfilePictureUrl(null);
                  }}
                />
              </div>

              {/* Security notice */}
              <div className="mx-5 mb-4 flex items-center gap-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl px-3.5 py-3 border border-amber-200 dark:border-amber-800/50 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                    {t("dataProtection")}
                  </p>
                  <p className="text-[9px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t("dataProtectionDescription")}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 flex gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 text-xs font-semibold transition-all flex-1"
                >
                  <IoChevronBackSharp className="w-3.5 h-3.5" />
                  {t("back")}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  disabled={
                    (documentType === "cin" &&
                      (!cinRecto || !cinVerso || !profilePhoto)) ||
                    (documentType === "passport" &&
                      (!passportFile || !profilePhoto))
                  }
                  onClick={handleAnalyzeDocuments}
                  className={`
  relative flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all duration-300 overflow-hidden
  ${
    (documentType === "cin" && cinRecto && cinVerso && profilePhoto) ||
    (documentType === "passport" && passportFile && profilePhoto)
      ? "bg-blue-400 text-black shadow-md shadow-blue-500/25 hover:bg-linear-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-blue-500/30"
      : "bg-blue-400 text-black opacity-50 cursor-not-allowed"
  }
`}
                >
                  {((documentType === "cin" &&
                    cinRecto &&
                    cinVerso &&
                    profilePhoto) ||
                    (documentType === "passport" &&
                      passportFile &&
                      profilePhoto)) && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "linear",
                        repeatDelay: 1,
                      }}
                    />
                  )}
                  <>
                    <Loader2
                      className={`w-3.5 h-3.5 ${isUploadingCIN ? "animate-spin" : ""}`}
                    />
                    {isUploadingCIN ? t("analyzing") : t("analyzeDocuments")}
                    {!isUploadingCIN && <ArrowRight className="w-3.5 h-3.5" />}
                  </>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Modal QR Code */}
        {showQRCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowQRCode(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#1E90FF]/20"
            >
              {/* Header avec icône et boutons en haut */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {t("uploadViaMobile") || "Upload via mobile"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("scanToContinue") ||
                        "Scannez le QR code avec votre téléphone"}
                    </p>
                  </div>
                </div>

                {/* Boutons Rafraîchir et Fermer en haut */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMobileSync}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-xs transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setShowQRCode(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-xs transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/*  QR Code centré */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="relative bg-white p-4 rounded-2xl shadow-xl mb-4">
                  {qrUrl ? (
                    <QRCodeSVG value={qrUrl} size={200} level="M" />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  )}
                  {/* Coins décoratifs */}
                  {[
                    "top-0 left-0 border-t-2 border-l-2 rounded-tl-md",
                    "top-0 right-0 border-t-2 border-r-2 rounded-tr-md",
                    "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-md",
                    "bottom-0 right-0 border-b-2 border-r-2 rounded-br-md",
                  ].map((cls, i) => (
                    <div
                      key={i}
                      className={`absolute w-5 h-5 border-blue-400 ${cls}`}
                      style={{ margin: "-4px" }}
                    />
                  ))}
                </div>

                {/* Instructions */}
                <div className="space-y-2 w-full">
                  {[
                    {
                      icon: <QrCode className="w-4 h-4" />,
                      text:
                        t("qrStep1") ||
                        "Ouvrez l'appareil photo de votre téléphone",
                    },
                    {
                      icon: <Camera className="w-4 h-4" />,
                      text: t("qrStep2") || "Scannez le QR code ci-dessus",
                    },
                    {
                      icon: <RefreshCw className="w-4 h-4" />,
                      text:
                        t("qrStep3") ||
                        "Les documents seront automatiquement synchronisés",
                    },
                  ].map(({ icon, text }, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center flex-shrink-0">
                        {icon}
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Barre de progression */}
                {uploadProgress > 0 && (
                  <div className="mt-4 w-full">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{t("progress") || "Progression"}</span>
                      <span className="font-mono font-bold">
                        {uploadProgress === 3 ? (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Terminé !
                          </span>
                        ) : (
                          `${uploadProgress}/3`
                        )}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(uploadProgress / 3) * 100}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t("sessionEncrypted") || "Session sécurisée et chiffrée"}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* Modal confirmation OCR T */}
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
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#1E90FF]/10 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-indigo-700 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {documentType === "cin"
                      ? t("ocrConfirm.title")
                      : t("passport.verificationTitle")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {documentType === "cin"
                      ? t("ocrConfirm.description")
                      : t("passport.verificationDescription")}
                  </p>
                </div>
              </div>

              <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex gap-2">
                <LuBadgeInfo className="text-blue-500 text-2xl mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {documentType === "cin"
                    ? t("ocrConfirm.infoBanner")
                    : t("passport.infoBanner")}
                </p>
              </div>

              {/* CHAMPS SELON LE TYPE */}
              {documentType === "cin" ? (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("ocrConfirm.firstNameLabel")}
                    </label>
                    <input
                      type="text"
                      value={cinData?.firstName || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("ocrConfirm.lastNameLabel")}
                    </label>
                    <input
                      type="text"
                      value={cinData?.lastName || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("ocrConfirm.dateOfBirthLabel")}
                    </label>
                    <input
                      type="text"
                      value={cinData?.dateOfBirth || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("ocrConfirm.cinNumberLabel")}
                    </label>
                    <input
                      type="text"
                      value={cinData?.cinNumber || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Profession
                    </label>
                    <input
                      type="text"
                      value={cinData?.profession || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("passport.numberLabel")}{" "}
                    </label>
                    <input
                      type="text"
                      value={cinData?.passportNumber || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("passport.cinNumberLabel")}{" "}
                    </label>
                    <input
                      type="text"
                      value={cinData?.cinNumber || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("passport.lastNameLabel")}{" "}
                    </label>
                    <input
                      type="text"
                      value={cinData?.lastName || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("passport.firstNameLabel")}{" "}
                    </label>
                    <input
                      type="text"
                      value={cinData?.firstName || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("passport.dateOfBirthLabel")}{" "}
                    </label>
                    <input
                      type="text"
                      value={cinData?.dateOfBirth || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("passport.expiryDateLabel")}{" "}
                    </label>
                    <input
                      type="text"
                      value={cinData?.expiryDate || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("passport.genderLabel")}{" "}
                    </label>
                    <input
                      type="text"
                      value={cinData?.sex || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("passport.professionLabel")}{" "}
                    </label>
                    <input
                      type="text"
                      value={cinData?.profession || ""}
                      readOnly
                      className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-5">
                <MdVerified className="text-emerald-500 text-xl shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {t("ocrConfirm.securityBanner")}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleConfirmIdentity}
                  disabled={isUploadingCIN}
                  className="flex-1 bg-blue-400 hover:bg-blue-500 text-black font-bold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50"
                >
                  {isUploadingCIN ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      {t("sending")}...
                    </>
                  ) : (
                    <>
                      <MdVerified className="text-lg" />
                      {t("ocrConfirm.confirmButton")}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-primary/20 text-center"
            >
              {/* Confetti icon */}
              <div className="flex justify-center mb-4">
                <GiPartyPopper className="text-6xl" />
              </div>
              <h2 className="text-2xl font-black mb-2">
                {t("welcomeModal.title")}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                {t("welcomeModal.message")}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                {t("welcomeModal.submessage")}
              </p>

              {/* Trust badges */}
              <div className="flex justify-center gap-4 mb-6">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <MdMarkEmailRead className="text-green-600 dark:text-green-400 text-xl" />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {t("welcomeModal.emailVerified")}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <FaWhatsapp className="text-green-600 dark:text-green-400 text-xl" />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {t("welcomeModal.whatsappVerified")}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                    <MdPendingActions className="text-yellow-600 dark:text-yellow-400 text-xl" />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {t("welcomeModal.cinPending")}
                  </span>
                </div>
              </div>

              <button
                onClick={async () => {
                  setIsCompletingProfile(true);
                  try {
                    setShowWelcome(false);
                    localStorage.setItem(
                      "redirectAfterLogin",
                      "/fr/complete-profile",
                    );
                    await router.push("/fr/complete-profile");
                  } finally {
                    setIsCompletingProfile(false);
                  }
                }}
                disabled={isCompletingProfile}
                className={`w-full py-3 bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500 text-black font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  isCompletingProfile
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
                }`}
              >
                {isCompletingProfile ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    {t("welcomeModal.redirecting")}
                  </>
                ) : (
                  <>
                    {t("welcomeModal.completeProfile")}
                    <MdOutlineArrowForwardIos className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
        {/* Footer */}
        <footer className="relative z-20 mt- sm:mt-6 pt-3 text-[10px] text-gray-200 dark:text-slate-600 flex flex-wrap justify-center gap-3 sm:gap-4 ">
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
          <span className="text-gray-200 dark:text-slate-700">
            © 2026 NESTHUB
          </span>
        </footer>
        {/* Security Message */}
        <p className="relative z-20 mt-3 text-center text-[10px] text-gray-200 dark:text-slate-600 max-w-xs mx-auto">
          {t("securityMessage")}
        </p>
      </div>
      {/* Decoration Gradients */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}
