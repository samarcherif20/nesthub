// app/[locale]/(auth)/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { EyeOff, Eye, Loader2 } from "lucide-react"; // ✅ Eye et EyeOff de lucide-react
import { IoKeyOutline, IoArrowBackOutline } from "react-icons/io5";
import { MdOutlineDangerous, MdOutlineCheckCircle } from "react-icons/md";

export default function ResetPasswordPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ResetPassword");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      router.push(`/${locale}/login`);
    }
  }, [router, locale]);

  const validatePassword = (pwd: string) => {
    if (!pwd) return "Le mot de passe est requis";
    if (pwd.length < 8)
      return "Le mot de passe doit contenir au moins 8 caractères";
    if (!/[A-Z]/.test(pwd))
      return "Le mot de passe doit contenir au moins une majuscule";
    if (!/[a-z]/.test(pwd))
      return "Le mot de passe doit contenir au moins une minuscule";
    if (!/[0-9]/.test(pwd))
      return "Le mot de passe doit contenir au moins un chiffre";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (!isLoaded || !email) {
      setError("Email manquant. Veuillez recommencer le processus.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Utiliser l'API Clerk pour réinitialiser le mot de passe
      const result = await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
        password: password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setSuccess(true);
        setTimeout(() => {
          router.push(`/${locale}/login?reset=success`);
        }, 2000);
      } else if (result.status === "needs_second_factor") {
        setError("Une vérification supplémentaire est nécessaire");
      } else {
        setError("Une erreur est survenue lors de la réinitialisation");
      }
    } catch (err: any) {
      console.error("Erreur détaillée:", err);

      // Gérer les erreurs spécifiques de Clerk
      if (err.errors && err.errors.length > 0) {
        const clerkError = err.errors[0];
        if (clerkError.code === "reset_password_email_code_expired") {
          setError(
            "Le lien de réinitialisation a expiré. Veuillez refaire une demande.",
          );
        } else if (clerkError.code === "form_password_pwned") {
          setError("Ce mot de passe est trop commun. Choisissez-en un autre.");
        } else {
          setError(clerkError.message || "Une erreur est survenue");
        }
      } else {
        setError(
          err.message || "Une erreur est survenue lors de la réinitialisation",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdOutlineCheckCircle className="text-3xl text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Mot de passe modifié !
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Votre mot de passe a été réinitialisé avec succès. Vous allez être
            redirigé vers la page de connexion.
          </p>
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <IoArrowBackOutline />
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Image
              src="/logo/logo.png"
              alt="NestHub Logo"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t("subtitle")}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("newPasswordLabel")}
              </label>
              <div className="relative">
                <IoKeyOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("newPasswordPlaceholder")}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("confirmPasswordLabel")}
              </label>
              <div className="relative">
                <IoKeyOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("confirmPasswordPlaceholder")}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <MdOutlineDangerous size={14} />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-600 hover:to-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  {t("resetting")}
                </>
              ) : (
                t("resetPassword")
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={`/${locale}/login`}
              className="text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <IoArrowBackOutline className="text-sm" />
              {t("backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
