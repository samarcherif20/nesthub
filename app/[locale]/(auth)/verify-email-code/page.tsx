"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, Lock, X } from "lucide-react";
import { BsHourglassSplit } from "react-icons/bs";
import { LuMailCheck, LuMailX } from "react-icons/lu";
import { useTranslations } from "next-intl";
import { maskEmail } from "@/lib/utils";
import { useVerifyCode } from "./hooks/useVerifyCode";
import Alert from "@/components/ui/Alert";

export default function VerifyEmailCodePage() {
  const t = useTranslations("Login");
  
  const {
    code,
    loading,
    error,
    successMessage,
    resendLoading,
    trustDevice,
    timeLeft,
    mounted,
    pendingIdentifier,
    inputRefs,
    setTrustDevice,
    handleChange,
    handleKeyDown,
    handleSubmit,
    handleResend,
    handleBackToLogin,
    closeError,
    closeSuccess,
    formatTime,
  } = useVerifyCode();

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

      {/* Main Card with Split Layout */}
      <div className="relative z-10 w-full max-w-5xl bg-background-light dark:bg-background-dark rounded-xl shadow-xl border border-primary/5 overflow-hidden flex flex-col md:flex-row">
        {/* LEFT SIDE - Image plus petite */}
        <div className="md:w-4/5 relative h-64 md:h-auto overflow-hidden ">
          <Image
            src="/login/Two factor authentication-rafiki.png"
            alt={t("2faAlt")}
            fill
            className="object-contain p-8"
            priority
          />
        </div>

        {/* RIGHT SIDE - Form */}
        <div className="md:w-4/5 p-6 md:p-8">
          {/* Alert Container - EN HAUT À DROITE */}
          <div className="fixed top-5 right-5 z-[100] space-y-2 w-full max-w-sm">
            {error && (
              <Alert
                type="error"
                message={error.message}
                onClose={closeError}
                autoClose={5000}
              />
            )}
            {successMessage && (
              <Alert
                type="success"
                message={successMessage}
                onClose={closeSuccess}
                autoClose={5000}
              />
            )}
          </div>

          {/* Email Display */}
          {pendingIdentifier && (
            <div className="mb-6 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                {t("secureAccess")}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                {t("enterCodeSentTo")}
              </p>
              <p className="text-primary font-semibold text-lg mt-1">
                {maskEmail(pendingIdentifier)}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Code Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                {t("verificationCode")}
              </label>
              <div className="flex gap-2 justify-center">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1} // ✅ TOUS les champs maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold bg-gray-50 dark:bg-gray-700 border-2 rounded-lg focus:ring-0 focus:border-primary outline-none transition-all ${
                      error
                        ? "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"
                        : "border-gray-200 dark:border-gray-600 focus:border-primary"
                    }`}
                    disabled={loading}
                    required={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Trust Device Checkbox */}
            <div className="relative group mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {t("trustDevice")}
                </span>
              </label>
              {/* Tooltip */}
              <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 p-3 bg-slate-800 text-white text-xs rounded-lg w-64 shadow-lg z-10">
                {t("trustDeviceTooltip")}
                <div className="absolute top-full left-4 border-8 border-transparent border-t-slate-800"></div>
              </div>
            </div>

            {/* Buttons Container */}
            <div className="flex gap-3">
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || timeLeft === 0}
                className="flex-1 py-2.5 sm:py-3 bg-blue-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-300 ease-in-out hover:bg-linear-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    {t("verifying")}
                  </>
                ) : (
                  <>
                    <LuMailCheck className="h-5 w-5" />
                    {t("verify")}
                  </>
                )}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex-1 py-2.5 sm:py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-none border-2 border-transparent relative"
                style={{
                  backgroundImage:
                    "linear-gradient(white, white), linear-gradient(to right, #3b82f6, #a855f7)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                }}
              >
                <LuMailX className="h-5 w-5" />
                {t("back")}
              </button>
            </div>
          </form>

          {/* Timer */}
          <div className="mt-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <BsHourglassSplit className="text-amber-600 dark:text-amber-400 text-xl mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-amber-700 dark:text-amber-400 text-[12px] font-semibold mb-1">
                    {t("limitedTimeCode")}
                  </h4>
                  <p className="text-amber-600 dark:text-amber-500 text-[12px]">
                    {t("codeExpiresIn")}{" "}
                    <span className=" text-[12px] inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-800/30 rounded-full font-mono font-bold text-amber-700 dark:text-amber-400">
                      {formatTime(timeLeft)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resend Link */}
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-4">
            {t("didNotReceiveCode")}
            <button
              onClick={handleResend}
              disabled={resendLoading || timeLeft > 540}
              className="text-purple-800 dark:text-purple-400 font-semibold hover:underline decoration-2 underline-offset-4 ml-1 disabled:opacity-50 disabled:no-underline"
            >
              {resendLoading ? t("sending") : t("resend")}
            </button>
          </p>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
            <Lock size={14} />
            <span>{t("securityBadge")}</span>
          </div>

          {/* Footer Links */}
          <div className="mt-4 pt-3 text-[10px] text-slate-400 dark:text-slate-600 flex justify-between w-full border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex gap-3">
              <Link
                href="/legal"
                className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
              >
                {t("legal")}
              </Link>
              <Link
                href="/privacy"
                className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
              >
                {t("privacy")}
              </Link>
            </div>
            <span>© 2026 NESTHUB</span>
          </div>
        </div>
      </div>

      {/* Bottom inclined colored section */}
      <div className="absolute bottom-0 left-0 right-0 h-25 bg-linear-to-r from-purple-400 via-blue-400 to-blue-50 transform -skew-y-2 origin-top-left translate-y-19"></div>
    </div>
  );
}