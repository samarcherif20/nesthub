// app/[locale]/admin/profile/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import {
  IoPersonOutline,
  IoShieldOutline,
  IoKeyOutline,
  IoTimeOutline,
  IoLockClosedOutline,
  IoLockOpenOutline,
  IoDesktopOutline,
  IoPhonePortraitOutline,
  IoLaptopOutline,
  IoGlobeOutline,
  IoMailOutline,
  IoCallOutline,
  IoCameraOutline,
  IoSaveOutline,
  IoCloseOutline,
  IoCheckmarkCircle,
  IoAlertCircle,
  IoEyeOutline,
  IoEyeOffOutline,
  IoSettingsOutline,
  IoSunnyOutline,
  IoMoonOutline,
} from "react-icons/io5";
import { useAdminProfile } from "./hooks/useAdminProfile";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useParams, useRouter, useSearchParams } from "next/navigation";

interface ToastState {
  type: "success" | "error";
  message: string;
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function DeviceIcon({ device }: { device: string }) {
  const l = device.toLowerCase();
  if (l.includes("iphone") || l.includes("android"))
    return <IoPhonePortraitOutline className="w-5 h-5" />;
  if (l.includes("macbook") || l.includes("laptop"))
    return <IoLaptopOutline className="w-5 h-5" />;
  return <IoDesktopOutline className="w-5 h-5" />;
}

function Tooltip({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {text}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-1.5">
      {children}
    </label>
  );
}

function ReadField({ value, icon }: { value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between h-11 px-4 bg-slate-50 dark:bg-slate-800/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-400 dark:text-slate-500 font-medium">
      <span className="font-mono">{value}</span>
      <span className="text-slate-300 dark:text-slate-600">{icon}</span>
    </div>
  );
}

function EditField({
  value,
  onChange,
  disabled,
  type = "text",
  icon,
  placeholder,
  showToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  type?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  showToggle?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none">
          {icon}
        </span>
      )}
      <input
        type={isPw && show ? "text" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={classNames(
          "w-full h-11 rounded-xl text-sm font-medium border-2 transition-all duration-200 outline-none",
          icon ? "pl-9" : "pl-4",
          isPw && showToggle ? "pr-10" : "pr-4",
          disabled
            ? "bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-500 dark:text-slate-400 cursor-default"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/8 dark:focus:ring-violet-500/10",
        )}
      />
      {isPw && showToggle && !disabled && (
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {show ? <IoEyeOffOutline /> : <IoEyeOutline />}
        </button>
      )}
    </div>
  );
}

function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classNames(
        "bg-white dark:bg-[#111827] rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
      <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
      {sub && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {sub}
        </p>
      )}
    </div>
  );
}

export default function AdminProfilePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "fr";
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const t = useTranslations("AdminProfile");
  const { getToken } = useAuth();

  const [toast, setToast] = useState<ToastState | null>(null);
  const [tab, setTab] = useState<"general" | "security" | "preferences">(
    tabParam === "security" ? "security" : "general",
  );
  const [editing, setEditing] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    profile,
    sessions,
    loading,
    saving,
    error,
    success,
    setError,
    updateProfile,
    updatePassword,
    terminateSession,
    terminateAllSessions,
    updateLanguage,
    theme,
    setTheme,
    refresh,
  } = useAdminProfile();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    bio: "",
  });
  const [pw, setPw] = useState({ current: "", new: "", confirm: "" });
  const [strength, setStrength] = useState(0);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const calcStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    setStrength(s);
  };

  const SLABELS = [
    t("strength.veryWeak"),
    t("strength.weak"),
    t("strength.medium"),
    t("strength.strong"),
    t("strength.veryStrong"),
  ];
  const SCOLORS = [
    "bg-slate-300",
    "bg-rose-500",
    "bg-amber-400",
    "bg-emerald-500",
    "bg-emerald-500",
  ];
  const STEXTS = [
    "text-slate-400",
    "text-rose-500",
    "text-amber-500",
    "text-emerald-500",
    "text-emerald-500",
  ];

  const pipAvatar = (url: string) =>
    `/api/users/avatar?url=${encodeURIComponent(url)}`;

  const formatDate = (date: string | null | undefined) => {
    if (!date) return t("unknown");
    const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
    return new Date(date).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return t("never");
    const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
    return new Date(date).toLocaleString(dateLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("error", t("errors.imageTooLarge"));
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast("error", t("errors.invalidImage"));
      return;
    }

    setProfilePictureFile(file);
    const preview = URL.createObjectURL(file);
    setLocalAvatarUrl(preview);
  };

  const uploadProfilePicture = async () => {
    if (!profilePictureFile) return;

    setUploadingPicture(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const formData = new FormData();
      formData.append("file", profilePictureFile);

      const response = await fetch("/api/users/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        await refresh();
        setLocalAvatarUrl(null);
        setProfilePictureFile(null);
        showToast("success", t("success.avatarUpdated"));
        return true;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading picture:", error);
      showToast("error", t("errors.avatarUploadFailed"));
      return false;
    } finally {
      setUploadingPicture(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phoneNumber: profile.phoneNumber || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(form);

    if (profilePictureFile) {
      await uploadProfilePicture();
    }

    setEditing(false);
    showToast("success", t("success.profileUpdated"));
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.new !== pw.confirm) {
      showToast("error", t("errors.passwordsMismatch"));
      return;
    }
    if (pw.new.length < 8) {
      showToast("error", t("errors.passwordTooShort"));
      return;
    }
    setSavingPw(true);
    const result = await updatePassword(pw.current, pw.new);
    if (result) {
      setPw({ current: "", new: "", confirm: "" });
      setStrength(0);
      showToast("success", t("success.passwordUpdated"));
    }
    setSavingPw(false);
  };

  const handleUpdateLanguage = async (langCode: string) => {
    await updateLanguage(langCode);
    router.push(`/${langCode}/admin/profile`);
    showToast("success", t("success.languageUpdated"));
  };
  useEffect(() => {
    if (tabParam === "security") {
      setTab("security");
    } else if (tabParam === "preferences") {
      setTab("preferences");
    } else {
      setTab("general");
    }
  }, [tabParam]);
  useEffect(() => {
    if (error) {
      showToast("error", error);
      setError(null);
    }
  }, [error, setError]);

  useEffect(() => {
    if (success) {
      showToast("success", success);
    }
  }, [success]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {t("errors.profileNotFound")}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="px-4 md:px-14 py-6 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("description")}
            </p>
          </div>
          <span className="w-fit px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40">
            {profile.role === "ADMIN" ? t("roleAdmin") : profile.role}
          </span>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-6">
            {[
              {
                id: "general",
                label: t("tabs.general"),
                icon: <IoPersonOutline className="w-4 h-4" />,
              },
              {
                id: "security",
                label: t("tabs.security"),
                icon: <IoShieldOutline className="w-4 h-4" />,
              },
              {
                id: "preferences",
                label: t("tabs.preferences"),
                icon: <IoSettingsOutline className="w-4 h-4" />,
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={classNames(
                  "flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all duration-200",
                  tab === t.id
                    ? "text-violet-600 dark:text-violet-400 border-violet-500 dark:border-violet-400"
                    : "text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-300",
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* GENERAL TAB */}
        {tab === "general" && (
          <div className="space-y-5">
            {/* Profile card */}
            <Section>
              <div
                className="h-28 relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4c1d95 100%)",
                }}
              >
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle,white 1px,transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
                <div
                  className="absolute -bottom-1 right-0 w-64 h-32 opacity-20 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse,#a78bfa 0%,transparent 70%)",
                    filter: "blur(24px)",
                  }}
                />
              </div>

              <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-12 mb-4">
                  <div className="relative inline-block">
                    <div
                      className="w-24 h-24 rounded-2xl border-4 border-white dark:border-[#111827] shadow-xl bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-black overflow-hidden"
                      style={{ boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}
                    >
                      {localAvatarUrl || profile?.profilePictureUrl ? (
                        <img
                          src={
                            localAvatarUrl ||
                            pipAvatar(profile?.profilePictureUrl || "")
                          }
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        `${form.firstName?.[0]}${form.lastName?.[0]}`
                      )}
                    </div>
                    <Tooltip
                      text={
                        !editing
                          ? t("tooltips.enableEditForPhoto")
                          : t("tooltips.changePhoto")
                      }
                    >
                      <button
                        onClick={() => editing && fileInputRef.current?.click()}
                        disabled={!editing || uploadingPicture}
                        className="absolute ml-19 -mt-10 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all shadow-md"
                      >
                        {uploadingPicture ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <IoCameraOutline className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </Tooltip>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      disabled={!editing}
                    />
                  </div>
                  <div className="flex-1 min-w-0 md:pb-1">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {form.firstName} {form.lastName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      ID:{" "}
                      <span className="font-mono">{profile.id?.slice(-8)}</span>
                      {" · "}
                      {t("memberSince")} {formatDate(profile.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditing(!editing)}
                    className={classNames(
                      "flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95",
                      editing
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        : "bg-violet-600 text-white shadow-lg shadow-violet-600/25 hover:bg-violet-700 hover:-translate-y-px",
                    )}
                  >
                    {editing ? t("cancel") : t("editProfile")}
                  </button>
                </div>
              </div>
            </Section>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-100 dark:border-slate-800/60 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <IoLockOpenOutline className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">
                  {t("accountStatus")}
                </p>
                <p className="text-2xl font-black text-emerald-500 dark:text-emerald-400">
                  {profile.status === "ACTIVE" ? t("active") : profile.status}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t("lastLogin")}: {formatDateTime(profile.lastLogin)}
                </p>
              </div>
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-100 dark:border-slate-800/60 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/15 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                  <IoShieldOutline className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">
                  {t("accessLevel")}
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {t("level")} {profile.stats?.accessLevel || 5}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t("fullAccess")}
                </p>
              </div>
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-100 dark:border-slate-800/60 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <IoTimeOutline className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">
                  {t("totalActions")}
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {(profile.stats?.totalActions || 0).toLocaleString(
                    locale === "fr" ? "fr-FR" : "en-US",
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {profile.stats?.actionsThisMonth || 0} {t("actionsThisMonth")}
                </p>
              </div>
            </div>

            {/* Form */}
            <Section>
              <SectionHead
                title={t("accountDetails")}
                sub={editing ? t("editInstructions") : t("viewInstructions")}
              />
              <form onSubmit={handleSaveProfile} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel>{t("systemId")}</FieldLabel>
                    <ReadField
                      value={profile.id?.slice(-8)}
                      icon={<IoLockClosedOutline className="w-4 h-4" />}
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {t("nonModifiable")}
                    </p>
                  </div>
                  <div>
                    <FieldLabel>{t("registrationDate")}</FieldLabel>
                    <ReadField
                      value={formatDate(profile.createdAt)}
                      icon={<IoTimeOutline className="w-4 h-4" />}
                    />
                  </div>
                  <div>
                    <FieldLabel>{t("firstName")}</FieldLabel>
                    <EditField
                      value={form.firstName}
                      onChange={(v) => setForm((p) => ({ ...p, firstName: v }))}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <FieldLabel>{t("lastName")}</FieldLabel>
                    <EditField
                      value={form.lastName}
                      onChange={(v) => setForm((p) => ({ ...p, lastName: v }))}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <FieldLabel>{t("email")}</FieldLabel>
                    <EditField
                      value={form.email}
                      onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                      disabled={!editing}
                      type="email"
                      icon={<IoMailOutline />}
                    />
                  </div>
                  <div>
                    <FieldLabel>{t("phone")}</FieldLabel>
                    <EditField
                      value={form.phoneNumber}
                      onChange={(v) =>
                        setForm((p) => ({ ...p, phoneNumber: v }))
                      }
                      disabled={!editing}
                      type="tel"
                      icon={<IoCallOutline />}
                      placeholder={t("notProvided")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel>{t("bio")}</FieldLabel>
                    <textarea
                      value={form.bio}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, bio: e.target.value }))
                      }
                      disabled={!editing}
                      rows={3}
                      placeholder={t("bioPlaceholder")}
                      className={classNames(
                        "w-full px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 outline-none resize-none",
                        editing
                          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/8"
                          : "bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-500 dark:text-slate-400 cursor-default",
                      )}
                    />
                  </div>
                </div>
                {editing && (
                  <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-7 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg hover:-translate-y-px active:scale-95 transition-all disabled:opacity-60"
                      style={{
                        background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                      }}
                    >
                      {saving ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <IoSaveOutline className="w-4 h-4" />
                      )}
                      {saving ? t("saving") : t("save")}
                    </button>
                  </div>
                )}
              </form>
            </Section>
          </div>
        )}

        {/* SECURITY TAB */}
        {tab === "security" && (
          <div className="space-y-5">
            <Section>
              <SectionHead
                title={t("changePassword")}
                sub={t("passwordInstructions")}
              />
              <form onSubmit={handleSavePassword} className="p-6 space-y-5">
                <div>
                  <FieldLabel>{t("currentPassword")}</FieldLabel>
                  <EditField
                    value={pw.current}
                    onChange={(v) => setPw((p) => ({ ...p, current: v }))}
                    disabled={false}
                    type="password"
                    placeholder="••••••••"
                    showToggle
                  />
                </div>

                <div>
                  <FieldLabel>{t("newPassword")}</FieldLabel>
                  <EditField
                    value={pw.new}
                    onChange={(v) => {
                      setPw((p) => ({ ...p, new: v }));
                      calcStrength(v);
                    }}
                    disabled={false}
                    type="password"
                    placeholder={t("newPasswordPlaceholder")}
                    showToggle
                  />
                  {pw.new && (
                    <div className="mt-2.5">
                      <div className="flex justify-between items-center mb-1.5 text-[10px]">
                        <span className="text-slate-500 dark:text-slate-400">
                          {t("strength.label")}:{" "}
                          <span
                            className={classNames(
                              "font-extrabold",
                              STEXTS[strength],
                            )}
                          >
                            {SLABELS[strength]}
                          </span>
                        </span>
                        <span className="text-slate-400">
                          {t("strength.minChars")}
                        </span>
                      </div>
                      <div className="flex gap-1 h-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={classNames(
                              "flex-1 rounded-full transition-all duration-500",
                              i <= strength
                                ? SCOLORS[strength]
                                : "bg-slate-200 dark:bg-slate-700",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <FieldLabel>{t("confirmPassword")}</FieldLabel>
                  <EditField
                    value={pw.confirm}
                    onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
                    disabled={false}
                    type="password"
                    placeholder={t("confirmPasswordPlaceholder")}
                    showToggle
                  />
                  {pw.confirm && pw.new !== pw.confirm && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                      <IoAlertCircle className="text-xs" />{" "}
                      {t("errors.passwordsMismatch")}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      savingPw ||
                      !pw.current ||
                      !pw.new ||
                      !pw.confirm ||
                      pw.new !== pw.confirm
                    }
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg hover:-translate-y-px active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                    style={{
                      background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                    }}
                  >
                    {savingPw ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <IoKeyOutline className="w-4 h-4" />
                    )}
                    {savingPw ? t("updating") : t("updatePassword")}
                  </button>
                </div>
              </form>
            </Section>

            {/* Sessions */}
            <Section>
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {t("activeSessions")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("sessionsDescription")}
                  </p>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={terminateAllSessions}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/20 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    {t("logoutAllDevices")}
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors group"
                  >
                    <div
                      className={classNames(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors",
                        s.isCurrent
                          ? "bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/20 text-violet-600 dark:text-violet-400"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500",
                      )}
                    >
                      <DeviceIcon device={s.device} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {s.device} — {s.browser}
                        </span>
                        {s.isCurrent && (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/20 px-1.5 py-0.5 rounded-md">
                            {t("currentSession")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        <IoGlobeOutline className="inline w-3 h-3 mr-1" />
                        {s.location} · IP: {s.ip} · {t("lastActivity")}:{" "}
                        {s.lastActive}
                      </p>
                    </div>
                    <button
                      onClick={() => terminateSession(s.id)}
                      disabled={s.isCurrent}
                      className={classNames(
                        "text-xs font-bold px-3 py-1.5 rounded-xl transition-all",
                        s.isCurrent
                          ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                          : "text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/15 border border-transparent hover:border-rose-100 dark:hover:border-rose-800/20 opacity-0 group-hover:opacity-100",
                      )}
                    >
                      {s.isCurrent ? t("currentSession") : t("logout")}
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* PREFERENCES TAB */}
        {tab === "preferences" && (
          <div className="space-y-5">
            {/* Language */}
            <Section>
              <div className="p-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {t("language")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t("languageDescription")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { code: "fr", label: t("languages.fr") },
                    { code: "en", label: t("languages.en") },
                    { code: "ar", label: t("languages.ar") },
                    { code: "it", label: t("languages.it") },
                    { code: "es", label: t("languages.es") },
                    { code: "de", label: t("languages.de") },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleUpdateLanguage(lang.code)}
                      className={classNames(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        (profile?.preferredLocale || "fr") === lang.code
                          ? "bg-violet-600 dark:bg-violet-500 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {/* Theme */}
            <Section>
              <div className="p-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {t("appearance")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t("appearanceDescription")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={classNames(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                      theme === "light"
                        ? "bg-violet-600 dark:bg-violet-500 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                    )}
                  >
                    <IoSunnyOutline className="w-4 h-4" />
                    {t("light")}
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={classNames(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                      theme === "dark"
                        ? "bg-violet-600 dark:bg-violet-500 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                    )}
                  >
                    <IoMoonOutline className="w-4 h-4" />
                    {t("dark")}
                  </button>
                </div>
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
