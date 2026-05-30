// app/[locale]/(auth)/forgot-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lock, X } from "lucide-react";
import { IoMailOutline, IoArrowBackOutline } from "react-icons/io5";
import { MdOutlineDangerous, MdReportGmailerrorred } from "react-icons/md";
import { useTranslations, useLocale } from "next-intl";
import Alert from "@/components/ui/Alert";
import { useForgotPassword } from "./hooks/useForgotPassword";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPassword");
  const locale = useLocale();

  const {
    email,
    loading,
    error,
    successMessage,
    touched,
    mounted,
    handleEmailChange,
    handleBlur,
    handleSubmit,
    closeError,
    closeSuccess,
    handleBackToLogin,
  } = useForgotPassword(t);

  // État pour l'erreur système (bandeau)
  const [systemError, setSystemError] = useState<string | null>(null);
  const [showSystemError, setShowSystemError] = useState(false);

  // Surveiller les erreurs système (email non trouvé, serveur, etc.)
  useEffect(() => {
    if (
      error &&
      !error.includes("email") &&
      !error.includes("requis") &&
      !error.includes("invalide")
    ) {
      setSystemError(error);
      setShowSystemError(true);
      // Timer pour masquer l'erreur après 5 secondes
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
            src="/login/forgot-password.png"
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
          {/* Alert Container - UNIQUEMENT POUR LE SUCCÈS */}
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] space-y-2 w-full max-w-sm">
            {" "}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0.9 }}
                  transition={{ type: "spring", damping: 20 }}
                >
                  <Alert
                    type="success"
                    message={successMessage}
                    onClose={closeSuccess}
                    autoClose={5000}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              {t("title")}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {t("subtitle")}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t("emailLabel")}
              </label>
              <div className="relative">
                <IoMailOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg" />
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleBlur}
                  placeholder={t("emailPlaceholder")}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-2 rounded-xl focus:ring-0 focus:border-primary outline-none transition-all text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                    touched &&
                    error &&
                    (error.includes("email") ||
                      error.includes("requis") ||
                      error.includes("invalide"))
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-200 dark:border-slate-700 focus:border-primary"
                  }`}
                  disabled={loading}
                />
              </div>
              {/* Validation error - sous le champ (email invalide, champ vide) */}
              <AnimatePresence>
                {touched &&
                  error &&
                  (error.includes("email") ||
                    error.includes("requis") ||
                    error.includes("invalide")) && (
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

            {/* Buttons Container - Back à gauche, Submit à droite */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="flex gap-3"
            >
              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-200 active:scale-[0.98] border border-slate-200 dark:border-slate-700"
              >
                <IoArrowBackOutline className="h-5 w-5" />
                {t("backToLogin")}
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-300 ease-in-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    {t("sending")}
                  </>
                ) : (
                  <>
                    <IoMailOutline className="h-5 w-5" />
                    {t("sendResetLink")}
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Security Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mt-8 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs"
          >
            <Lock size={14} />
            <span>{t("securityBadge")}</span>
          </motion.div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
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
            <span className="text-slate-400 dark:text-slate-600">
              © 2026 NESTHUB
            </span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom inclined colored section */}
      <div className="absolute bottom-0 left-0 right-0 h-25 bg-linear-to-r from-purple-400 via-blue-400 to-blue-50 transform -skew-y-2 origin-top-left translate-y-19"></div>
    </div>
  );
}
