// app/[locale]/(auth)/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  EyeOff,
  Eye,
  Loader2,
  Lock,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  X,
} from "lucide-react";
import { IoArrowBackOutline } from "react-icons/io5";
import {
  MdOutlineDangerous,
  MdOutlineCheckCircle,
  MdReportGmailerrorred,
} from "react-icons/md";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import Alert from "@/components/ui/Alert";
import { useResetPassword } from "./hooks/useResetPassword";

export default function ResetPasswordPage() {
  const t = useTranslations("ResetPassword");
  const locale = useLocale();

  const {
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    loading,
    error,
    success,
    email,
    mode,
    mounted,
    setPassword,
    setConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    handleSubmit,
    closeError,
    closeSuccess,
    validatePassword,
  } = useResetPassword(t);

  // État pour l'erreur système (bandeau)
  const [systemError, setSystemError] = useState<string | null>(null);
  const [showSystemError, setShowSystemError] = useState(false);

  // État pour la validation en temps réel
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const [passwordMatch, setPasswordMatch] = useState(false);

  // Valider le mot de passe en temps réel
  useEffect(() => {
    setPasswordStrength({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  // Vérifier la correspondance des mots de passe
  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(password === confirmPassword && password !== "");
    } else {
      setPasswordMatch(false);
    }
  }, [password, confirmPassword]);

  // Calculer la force du mot de passe (0-100)
  const calculateStrength = () => {
    const criteria = Object.values(passwordStrength).filter(Boolean).length;
    return (criteria / 5) * 100;
  };

  const strengthPercentage = calculateStrength();

  const getStrengthColor = () => {
    if (strengthPercentage <= 20) return "bg-red-500";
    if (strengthPercentage <= 40) return "bg-orange-500";
    if (strengthPercentage <= 60) return "bg-yellow-500";
    if (strengthPercentage <= 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (strengthPercentage <= 20) return t("strengthVeryWeak") || "Très faible";
    if (strengthPercentage <= 40) return t("strengthWeak") || "Faible";
    if (strengthPercentage <= 60) return t("strengthMedium") || "Moyen";
    if (strengthPercentage <= 80) return t("strengthStrong") || "Fort";
    return t("strengthVeryStrong") || "Très fort";
  };

  // Surveiller les erreurs système
  useEffect(() => {
    if (
      error &&
      !error.includes("mot de passe") &&
      !error.includes("correspondent") &&
      !error.includes("requis") &&
      !error.includes("caractères") &&
      !error.includes("majuscule") &&
      !error.includes("minuscule") &&
      !error.includes("chiffre")
    ) {
      setSystemError(error);
      setShowSystemError(true);
      const timer = setTimeout(() => {
        setShowSystemError(false);
        setSystemError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const closeSystemError = () => {
    setShowSystemError(false);
    setSystemError(null);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 relative overflow-hidden">
        {/* Top inclined colored section */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-r from-blue-50 via-blue-400 to-purple-400 transform -skew-y-2 origin-top-left"></div>

        {/* Bottom inclined colored section */}
        <div className="absolute bottom-0 left-0 right-0 h-25 bg-linear-to-r from-purple-400 via-blue-400 to-blue-50 transform -skew-y-2 origin-top-left translate-y-19"></div>

        {/* Logo */}
        <div className="absolute top-4 left-4 md:top-2 md:left-8 z-30">
          <div className="flex items-center gap-6 p-2 md:p-3">
            <div className="relative w-10 h-10 md:w-12 md:h-12 ml-7">
              <Image
                src="/logo/logo.png"
                alt="NestHub Logo"
                fill
                className="object-contain scale-[5.25] translate-y-4.25"
              />
            </div>
            <div>
              <h1 className="font-bold text-xl md:text-2xl translate-y-1.25 bg-linear-to-r from-blue-400 via-sky-600 to-purple-500 bg-clip-text text-transparent">
                N E S T H U B
              </h1>
            </div>
          </div>
        </div>

        {/* Success Modal with Animations */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.5,
            type: "spring",
            damping: 20,
            stiffness: 300,
          }}
          className="relative z-20 max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 text-center border border-primary/10"
        >
          {/* Animated Circle with Checkmark */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.6,
              type: "spring",
              damping: 15,
              delay: 0.2,
            }}
            className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <CheckCircle2 className="text-4xl text-white" strokeWidth={2.5} />
            </motion.div>
          </motion.div>

          {/* Success Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-3"
          >
            {t("successTitle")}
          </motion.h2>

          {/* Success Message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-slate-600 dark:text-slate-400 mb-8 text-sm leading-relaxed"
          >
            {t("successMessage")}
          </motion.p>

          {/* Back to Login Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md"
            >
              {t("backToLogin")}
            </Link>
          </motion.div>

          

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="mt-4 pt-3 text-[10px] text-slate-400 dark:text-slate-600 flex justify-between w-full border-t border-slate-100 dark:border-slate-800/50"
          >
            <div className="flex gap-3">
              <Link
                href={`/${locale}/legal`}
                className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
              >
                {t("legal")}
              </Link>
              <Link
                href={`/${locale}/privacy`}
                className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
              >
                {t("privacy")}
              </Link>
            </div>
            <span>© 2026 NESTHUB</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 relative overflow-hidden">
      {/* Top inclined colored section */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-r from-blue-50 via-blue-400 to-purple-400 transform -skew-y-2 origin-top-left"></div>

      {/* Logo - Positionné sur la ligne inclinée */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="absolute top-4 left-4 md:top-2 md:left-8 z-30"
      >
        <div className="flex items-center gap-6 p-2 md:p-3">
          <div className="relative w-10 h-10 md:w-12 md:h-12 ml-7">
            <Image
              src="/logo/logo.png"
              alt="NestHub Logo"
              fill
              className="object-contain scale-[5.25] translate-y-4.25"
            />
          </div>
          <div>
            <h1 className="font-bold text-xl md:text-2xl translate-y-1.25 bg-linear-to-r from-blue-400 via-sky-600 to-purple-500 bg-clip-text text-transparent">
              N E S T H U B
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Main Card with Split Layout */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", damping: 20 }}
        className="relative z-10 w-full max-w-5xl bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-primary/5 overflow-hidden flex flex-col md:flex-row"
      >
        {/* LEFT SIDE - Image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:w-4/5 relative h-64 md:h-auto overflow-hidden"
        >
          <Image
            src="/login/Reset password.png"
            alt={t("title")}
            fill
            className="object-contain p-8"
            priority
          />
        </motion.div>

        {/* RIGHT SIDE - Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:w-4/5 p-6 md:p-8"
        >
          {/* Alert Container */}
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] space-y-2 w-full max-w-sm">
            {/* Pas d'alerte d'erreur ici car gérée par bandeau */}
          </div>

          {/* System Error Banner - bandeau avec timer et bouton X */}
          <AnimatePresence>
            {showSystemError && systemError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-sm border border-red-200 dark:border-red-800"
              >
                <MdReportGmailerrorred className="shrink-0" size={18} />
                <span className="flex-1">{systemError}</span>
                <button
                  onClick={closeSystemError}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-8 text-center"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {t("title")}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {mode === "token"
                ? t("subtitle")
                : t("subtitleWithEmail", { email })}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t("newPasswordLabel")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("newPasswordPlaceholder")}
                  className={`w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-800 border-2 rounded-xl focus:ring-0 focus:border-primary outline-none transition-all text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                    error &&
                    (error.includes("mot de passe") ||
                      error.includes("caractères") ||
                      error.includes("majuscule") ||
                      error.includes("minuscule") ||
                      error.includes("chiffre"))
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-200 dark:border-slate-700 focus:border-primary"
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>

              {/* Barre de progression de force du mot de passe */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="mt-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${strengthPercentage}%` }}
                        transition={{ duration: 0.3 }}
                        className={`h-full rounded-full transition-all ${getStrengthColor()}`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      {getStrengthText()}
                    </span>
                  </div>

                  {/* Critères de validation */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                    <div className="flex items-center gap-1.5">
                      {passwordStrength.minLength ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-400" />
                      )}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t("passwordMinLength")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordStrength.hasUppercase ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-400" />
                      )}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t("passwordUppercase")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordStrength.hasLowercase ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-400" />
                      )}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t("passwordLowercase")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordStrength.hasNumber ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-400" />
                      )}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t("passwordNumber")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      {passwordStrength.hasSpecialChar ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-400" />
                      )}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t("passwordSpecialChar")}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Validation error - sous le champ */}
              <AnimatePresence>
                {error &&
                  (error.includes("mot de passe") ||
                    error.includes("caractères") ||
                    error.includes("majuscule") ||
                    error.includes("minuscule") ||
                    error.includes("chiffre")) && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 text-xs text-red-500 flex items-center gap-1"
                    >
                      <MdOutlineDangerous size={14} />
                      {error}
                    </motion.p>
                  )}
              </AnimatePresence>
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t("confirmPasswordLabel")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CheckCircle2 className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("confirmPasswordPlaceholder")}
                  className={`w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-slate-800 border-2 rounded-xl focus:ring-0 focus:border-primary outline-none transition-all text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                    confirmPassword && !passwordMatch
                      ? "border-red-300 dark:border-red-700"
                      : confirmPassword && passwordMatch
                        ? "border-green-300 dark:border-green-700"
                        : "border-gray-200 dark:border-slate-700 focus:border-primary"
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>

              {/* Indicateur de correspondance en temps réel */}
              <AnimatePresence>
                {confirmPassword && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2"
                  >
                    {passwordMatch ? (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {t("passwordMatch")}
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <MdOutlineDangerous size={12} />
                        {t("passwordNoMatch")}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Validation error - sous le champ (mots de passe ne correspondent pas) */}
              <AnimatePresence>
                {error && error.includes("correspondent") && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 text-xs text-red-500 flex items-center gap-1"
                  >
                    <MdOutlineDangerous size={14} />
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Buttons - inversé comme forget password */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="flex gap-3 pt-2"
            >
              {/* Back Button - à gauche */}
              <Link
                href={`/${locale}/login`}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] border border-slate-200 dark:border-slate-700"
              >
                <IoArrowBackOutline className="h-5 w-5" />
                {t("backToLogin")}
              </Link>

              {/* Submit Button - à droite */}
              <button
                type="submit"
                disabled={loading || !passwordMatch || strengthPercentage < 60}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-300 ease-in-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>{t("resetting")}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-5 w-5" />
                    <span>{t("resetPassword")}</span>
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Security Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="mt-8 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs"
          >
            <Lock size={14} />
            <span>{t("securityBadge")}</span>
          </motion.div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="mt-6 pt-4 text-[10px] text-slate-400 dark:text-slate-600 flex justify-between w-full border-t border-slate-100 dark:border-slate-800/50"
          >
            <div className="flex gap-3">
              <Link
                href={`/${locale}/legal`}
                className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
              >
                {t("legal")}
              </Link>
              <Link
                href={`/${locale}/privacy`}
                className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
              >
                {t("privacy")}
              </Link>
            </div>
            <span>© 2026 NESTHUB</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom inclined colored section */}
      <div className="absolute bottom-0 left-0 right-0 h-25 bg-linear-to-r from-purple-400 via-blue-400 to-blue-50 transform -skew-y-2 origin-top-left translate-y-19"></div>
    </div>
  );
}
