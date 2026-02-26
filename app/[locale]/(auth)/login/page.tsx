"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { EyeOff, Eye } from "lucide-react";
import { TfiEmail } from "react-icons/tfi";
import { LiaUserShieldSolid } from "react-icons/lia";
import { RiLockPasswordLine } from "react-icons/ri";
import { MdOutlineDangerous } from "react-icons/md";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
} from "@/components/ui/avatar";
import { Loader2, LogIn } from "lucide-react";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const [role, setRole] = useState<"renter" | "owner">("renter");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("Login");

  const { signIn, setActive } = useSignIn();
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  // Déterminer le thème actuel
  const currentTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isSignedIn && user) {
      const userRole = user.publicMetadata?.role || role;
      if (userRole === "owner") {
        router.push("/dashboard/owner");
      } else {
        router.push("/dashboard/renter");
      }
    }
  }, [isSignedIn, user, router, role]);

  // Fonction de validation email (pour la connexion)
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return t("emailRequired");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return t("emailInvalid");
    }
    return undefined;
  };

  // Fonction de validation mot de passe (pour la connexion)
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return t("passwordRequired");
    }
    // Pour la connexion, on vérifie juste que le champ n'est pas vide
    return undefined;
  };

  // Valider tout le formulaire
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gérer le blur des champs
  const handleBlur = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === "email") {
      const emailError = validateEmail(email);
      setErrors((prev) => ({ ...prev, email: emailError }));
    } else if (field === "password") {
      const passwordError = validatePassword(password);
      setErrors((prev) => ({ ...prev, password: passwordError }));
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marquer tous les champs comme touchés
    setTouched({ email: true, password: true });

    // Valider le formulaire
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (!signIn) return;

      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      console.error("Auth error:", err);

      // Gérer les erreurs spécifiques de Clerk pour la connexion
      if (err.errors) {
        const clerkError = err.errors[0];

        if (clerkError.code === "form_identifier_not_found") {
          setErrors({ general: t("userNotFound") });
        } else if (clerkError.code === "form_password_incorrect") {
          setErrors({ general: t("incorrectPassword") });
        } else {
          setErrors({ general: clerkError.message || t("error") });
        }
      } else {
        setErrors({ general: t("error") });
      }
    } finally {
      setLoading(false);
    }
  };

  // Gérer la connexion avec Google
  const handleGoogleLogin = async () => {
    try {
      if (!signIn) return;
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      console.error("Google login error:", err);
    }
  };

  // Gérer la connexion avec Apple
  const handleAppleLogin = async () => {
    try {
      if (!signIn) return;
      await signIn.authenticateWithRedirect({
        strategy: "oauth_apple",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      console.error("Apple login error:", err);
    }
  };

  // Gérer la connexion avec Facebook
  const handleFacebookLogin = async () => {
    try {
      if (!signIn) return;
      await signIn.authenticateWithRedirect({
        strategy: "oauth_facebook",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      console.error("Facebook login error:", err);
    }
  };

  // Éviter les problèmes d'hydratation
  if (!mounted) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
        <div className="w-full flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Left Side: Lifestyle Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative items-start justify-center pt-16 px-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/30 z-10"></div>
          <Image
            src="/login/loginPage.jpg"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-20 w-full mt-25 ml-15">
          <div className="flex items-center gap-8 mb-8">
            <div className="relative w-12 h-12">
              <Image
                src="/logo/logo.png"
                alt="NestHub Logo"
                fill
                className="object-contain scale-[6] translate-y-3.5"
              />
            </div>
            <h1 className="text-5xl font-bold tracking-tight bg-linear-to-r from-blue-200 via-sky-300 to-purple-300 dark:from-indigo-900 dark:via-sky-600 dark:to-purple-00 text-transparent bg-clip-text">
              N E S T H U B
            </h1>
          </div>

          <h2 className="text-blue-200 dark:text-indigo-900 text-5xl font-bold leading-tight mb-3">
            {t("heroTitle")}
          </h2>
          <p className="text-blue-200 dark:text-indigo-900 text-lg leading-relaxed max-w-sm mb-6">
            {t("heroSubtitle")}
          </p>

          <div className="flex items-center gap-4">
            <AvatarGroup>
              <Avatar size="lg">
                <AvatarImage src="/avatars/a1.jpg" />
                <AvatarFallback>av_1</AvatarFallback>
                <AvatarBadge className="bg-green-500" />
              </Avatar>

              <Avatar size="lg">
                <AvatarImage src="/avatars/a2.jpg" />
                <AvatarFallback>av_2</AvatarFallback>
                <AvatarBadge className="bg-green-500" />
              </Avatar>

              <Avatar size="lg">
                <AvatarImage src="/avatars/a3.jpg" />
                <AvatarFallback>av_3</AvatarFallback>
              </Avatar>
            </AvatarGroup>

            <p className="text-white dark:text-blue-800 text-sm font-medium">
              {t("joinStats")}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-6 bg-background-light dark:bg-background-dark overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ">
              <Image
                src="/logo/logo.png"
                alt="NestHub Logo"
                fill
                className="object-contain scale-[3.75] translate-y-2.75"
              />
            </div>
            <h2 className="text-2xl font-bold bg-linear-to-r from-blue-400 via-sky-600 to-purple-500 text-transparent bg-clip-text">
              N E S T H U B
            </h2>
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {t("welcome")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("subtitle")}
            </p>
          </div>

          {/* Message d'erreur général avec icône */}
          {errors.general && (
            <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs flex items-center gap-1">
              <MdOutlineDangerous className="shrink-0" size={16} />
              <span>{errors.general}</span>
            </div>
          )}

          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
            {t("profileType")}
          </p>

          <div className="segmented-control mb-4 bg-gray-100 dark:bg-white/5 p-1 rounded-xl flex">
            <button
              onClick={() => setRole("renter")}
              className={`flex-1 text-center py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                role === "renter"
                  ? "bg-white dark:bg-background-dark shadow-sm text-gray-900 dark:text-blue-950"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {t("renter")}
            </button>

            <button
              onClick={() => setRole("owner")}
              className={`flex-1 text-center py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                role === "owner"
                  ? "bg-white dark:bg-background-dark shadow-sm text-gray-900 dark:text-blue-950"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {t("owner")}
            </button>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                htmlFor="email"
              >
                {t("email")}
              </label>
              <div className="relative">
                <TfiEmail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  className={`w-full pl-10 pr-3 py-2.5 sm:py-3 text-sm bg-gray-50 dark:bg-white/5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white ${
                    touched.email && errors.email
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-200 dark:border-white/10"
                  }`}
                  id="email"
                  name="email"
                  placeholder={t("emailPlaceholder")}
                  required
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) {
                      const emailError = validateEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, email: emailError }));
                    }
                  }}
                  onBlur={() => handleBlur("email")}
                  disabled={loading}
                  aria-invalid={touched.email && !!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {touched.email && errors.email && (
                <p
                  className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1"
                  id="email-error"
                >
                  <MdOutlineDangerous className="shrink-0" size={14} />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label
                  className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="password"
                >
                  {t("password")}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-purple-800 dark:text-primary hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <RiLockPasswordLine
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  className={`w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm bg-gray-50 dark:bg-white/5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white ${
                    touched.password && errors.password
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-200 dark:border-white/10"
                  }`}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) {
                      const passwordError = validatePassword(e.target.value);
                      setErrors((prev) => ({
                        ...prev,
                        password: passwordError,
                      }));
                    }
                  }}
                  onBlur={() => handleBlur("password")}
                  disabled={loading}
                  aria-invalid={touched.password && !!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p
                  className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1"
                  id="password-error"
                >
                  <MdOutlineDangerous className="shrink-0" size={14} />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary h-3 w-3 sm:h-4 sm:w-4"
                  type="checkbox"
                />
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-300 transition-colors">
                  {t("rememberMe")}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 bg-blue-400 text-black font-bold rounded-xl 
             flex items-center justify-center gap-2 text-sm
             transition-all duration-300 ease-in-out
             hover:bg-linear-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500
             active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  {t("processing")}
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  {t("login")}
                </>
              )}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleGoogleLogin}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow flex items-center justify-center border border-gray-200 dark:border-gray-700"
              disabled={loading}
              aria-label="Google"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </button>

            <button
              onClick={handleAppleLogin}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow flex items-center justify-center border border-gray-200 dark:border-gray-700"
              disabled={loading}
              aria-label="Apple"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-gray-900 dark:text-white"
              >
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.82-.779.883-1.467 2.337-1.286 3.713 1.35.104 2.727-.715 3.573-1.703z" />
              </svg>
            </button>

            <button
              onClick={handleFacebookLogin}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow flex items-center justify-center border border-gray-200 dark:border-gray-700"
              disabled={loading}
              aria-label="Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  fill="#1877F2"
                />
              </svg>
            </button>
          </div>

          <p className="mt-4 text-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
            {t("termsPrefix")}{" "}
            <Link
              href="/terms"
              className="font-medium text-purple-800 dark:text-primary hover:underline"
            >
              {t("termsOfUse")}
            </Link>{" "}
            {t("and")}{" "}
            <Link
              href="/privacy"
              className="font-medium text-purple-800 dark:text-primary hover:underline"
            >
              {t("privacyPolicy")}
            </Link>
            {t("termsSuffix")}
          </p>

          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start gap-2">
            <LiaUserShieldSolid className="text-slate-400 shrink-0" size={20} />
            <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
              {t("accessInfo")}
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            {t("dontHaveAccount")}{" "}
            <Link
              href="/sign-up"
              className="text-primary font-bold hover:underline"
            >
              {t("signUp")}
            </Link>
          </p>

          <div className="mt-4 pt-3 text-[10px] text-slate-400 dark:text-slate-600 flex justify-between w-full border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex gap-3">
              <Link
                className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
                href="/legal"
              >
                {t("legal")}
              </Link>
              <Link
                className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
                href="/privacy"
              >
                {t("privacy")}
              </Link>
            </div>
            <span>© 2026 NESTHUB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
