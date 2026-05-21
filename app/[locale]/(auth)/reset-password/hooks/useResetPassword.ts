// app/[locale]/(auth)/reset-password/hooks/useResetPassword.ts
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export function useResetPassword(t: any) {
  const router = useRouter();
  const locale = useLocale();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mode, setMode] = useState<"email" | "token">("email");
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get("email");
    const tokenParam = urlParams.get("token");
    
    if (tokenParam) {
      setToken(tokenParam);
      setMode("token");
    } else if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
      setMode("email");
    } else {
      router.push(`/${locale}/forgot-password`);
    }
  }, [router, locale]);

  const validatePassword = (pwd: string) => {
  if (!pwd) return t("errors.passwordRequired");
  if (pwd.length < 8) return t("errors.passwordMinLength");
  if (!/[A-Z]/.test(pwd)) return t("errors.passwordUppercase");
  if (!/[a-z]/.test(pwd)) return t("errors.passwordLowercase");
  if (!/[0-9]/.test(pwd)) return t("errors.passwordNumber");
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
  setError(t("errors.passwordsDoNotMatch"));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (mode === "token" && token) {
        response = await fetch('/api/auth/reset-password/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        });
      } else if (mode === "email" && email) {
        response = await fetch('/api/auth/reset-password/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
      } else {
setError(t("errors.missingData"));
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/${locale}/login?reset=success`);
        }, 2000);
      } else {
setError(data.error || t("errors.general"));
      }
    } catch (err) {
setError(t("errors.connection"));
    } finally {
      setLoading(false);
    }
  };

  const closeError = () => setError(null);
  const closeSuccess = () => setSuccess(false);

  return {
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    loading,
    error,
    success,
    email,
    token,
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
  };
}