"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2, Lock, X } from "lucide-react";
import {
  getClerkErrorMessage,
  getClerkErrorCode,
  maskEmail,
  logger,
  ClerkLoginErrorCodes,
} from "@/lib/utils";
import { BsHourglassSplit } from "react-icons/bs";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { LuMailCheck, LuMailX } from "react-icons/lu";

interface ErrorState {
  message: string;
  type: "invalid" | "expired" | "generic";
}

export default function VerifyEmailCodePage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes en secondes
  const { signIn, setActive } = useSignIn();
  const router = useRouter();
  const t = useTranslations("Login");
  const [mounted, setMounted] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Récupérer les infos stockées
  const [pendingIdentifier, setPendingIdentifier] = useState<string | null>(
    null,
  );
  const [pendingUserRole, setPendingUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const identifier = sessionStorage.getItem("pendingIdentifier");
    const userRole = sessionStorage.getItem("pendingUserRole");

    setPendingIdentifier(identifier);
    setPendingUserRole(userRole);

    if (!identifier) {
      router.push("/fr/login");
    }
  }, [router]);

  // Timer pour l'expiration du code
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Vérifier si le code a expiré
  useEffect(() => {
    if (timeLeft === 0 && !error) {
      setError({
        type: "expired",
        message: t("codeExpired"),
      });
    }
  }, [timeLeft, error, t]);

  // Formater le temps (MM:SS)
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Focus automatique sur le premier input
  useEffect(() => {
    if (mounted && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [mounted]);

  const handleChange = (index: number, value: string) => {
    // Effacer l'erreur quand l'utilisateur tape
    if (error) setError(null);

    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split("");
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (i < 6) newCode[i] = char;
      });
      setCode(newCode);

      const lastIndex = Math.min(pastedCode.length, 5);
      if (lastIndex < 5 && inputRefs[lastIndex + 1]?.current) {
        inputRefs[lastIndex + 1].current?.focus();
      } else if (inputRefs[5].current) {
        inputRefs[5].current?.focus();
      }

      // Soumettre automatiquement si 6 chiffres
      if (pastedCode.length === 6 && pastedCode.every((c) => c)) {
        setTimeout(
          () => handleSubmit(new Event("submit") as unknown as React.FormEvent),
          100,
        );
      }
    } else {
      const newCode = [...code];
      newCode[index] = value.replace(/[^0-9]/g, "");
      setCode(newCode);

      if (value && index < 5 && inputRefs[index + 1].current) {
        inputRefs[index + 1].current?.focus();
      }

      // Vérifier si tous les champs sont remplis
      const allFilled = [
        ...newCode.slice(0, index),
        value,
        ...newCode.slice(index + 1),
      ].every((c) => c);
      if (allFilled) {
        setTimeout(
          () => handleSubmit(new Event("submit") as unknown as React.FormEvent),
          100,
        );
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError({
        type: "generic",
        message: t("codeRequired"),
      });
      return;
    }

    setLoading(true);
    setError(null);
    logger.auth("Tentative de vérification 2FA");

    try {
      if (!signIn) throw new Error("SignIn not initialized");

      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: fullCode,
      });

      logger.success("Vérification 2FA réussie", { status: result.status });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        // Nettoyer le sessionStorage
        sessionStorage.removeItem("pendingIdentifier");
        sessionStorage.removeItem("pendingRole");
        sessionStorage.removeItem("pendingIdentifierType");
        sessionStorage.removeItem("pendingUserRole");

        // Redirection selon le rôle
        if (pendingUserRole === "ADMIN") {
          router.push("/admin/dashboard");
        } else if (pendingUserRole === "PROPERTY_OWNER") {
          router.push("/dashboard/owner");
        } else {
          router.push("/dashboard/renter");
        }
      }
    } catch (err: unknown) {
      logger.error("Erreur vérification 2FA:", err);

      const errorCode = getClerkErrorCode(err);

      if (
        errorCode === ClerkLoginErrorCodes.CODE_INCORRECT ||
        errorCode === ClerkLoginErrorCodes.VERIFICATION_FAILED
      ) {
        setError({
          type: "invalid",
          message: t("incorrectCode"),
        });
      } else if (errorCode === ClerkLoginErrorCodes.CODE_EXPIRED) {
        setError({
          type: "expired",
          message: t("codeExpired"),
        });
      } else {
        // Utiliser la fonction de traduction générique
        const errorMessage = getClerkErrorMessage(err, "email", t);
        setError({
          type: "generic",
          message: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      logger.auth("Demande de renvoi de code");
      await signIn?.prepareSecondFactor({ strategy: "email_code" });
      setTimeLeft(600); // Reset timer à 10 minutes
      setSuccessMessage(t("codeResent"));

      // Effacer le message après 5 secondes
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      logger.error("Erreur renvoi code:", err);
      const errorMessage = getClerkErrorMessage(err, "email", t);
      setError({
        type: "generic",
        message: errorMessage,
      });
    } finally {
      setResendLoading(false);
    }
  };

  const closeError = () => setError(null);
  const closeSuccess = () => setSuccessMessage(null);

  // Rediriger vers la page de login
  const handleBackToLogin = () => {
    router.push("/fr/login");
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

          {/* Success Message avec bouton X */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between gap-2 animate-slide-down">
              <p className="text-green-700 dark:text-green-300 text-sm flex-1">
                {successMessage}
              </p>
              <button
                onClick={closeSuccess}
                className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-200 transition-colors"
                aria-label={t("close")}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Error Message avec bouton X */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-2 animate-slide-down">
              <div className="flex items-start gap-2 flex-1">
                <HiOutlineExclamationTriangle className="text-red-500 text-lg mt-0.5 shrink-0" />
                <div>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    {error.message}
                  </p>
                  {error.type === "expired" && (
                    <button
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="text-red-600 dark:text-red-400 text-xs font-medium hover:underline mt-1"
                    >
                      {resendLoading ? t("sending") : t("requestNewCode")}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={closeError}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                aria-label={t("close")}
              >
                <X size={16} />
              </button>
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
                    maxLength={6}
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
              disabled={resendLoading || timeLeft > 540} // Désactivé si moins de 1 minute écoulée
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
