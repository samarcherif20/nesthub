"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { useSearchParams } from "next/navigation";

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

function Toast({
  msg,
  ok,
  onClose,
}: {
  msg: string;
  ok: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3800);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={classNames(
        "fixed top-5 right-5 z-[999] flex items-center gap-3 pl-4 pr-3 py-3 rounded-2xl shadow-2xl text-sm font-semibold border backdrop-blur-xl",
        ok
          ? "bg-white/95 dark:bg-slate-900/95 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300"
          : "bg-white/95 dark:bg-slate-900/95 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300",
      )}
      style={{ animation: "slideIn 0.35s cubic-bezier(0.22,1,0.36,1) both" }}
    >
      {ok ? (
        <IoCheckmarkCircle className="text-lg text-emerald-500 flex-shrink-0" />
      ) : (
        <IoAlertCircle className="text-lg text-rose-500 flex-shrink-0" />
      )}
      <span className="max-w-xs">{msg}</span>
      <button
        onClick={onClose}
        className="ml-1 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
      >
        <IoCloseOutline />
      </button>
    </div>
  );
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
  const { getToken } = useAuth();
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
    toggleTheme,
    theme,
    setTheme,
    refresh,
  } = useAdminProfile();

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<"general" | "security" | "preferences">(
    "general",
  );
  const [editing, setEditing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ msg: string; ok: boolean } | null>(
    null,
  );
  const [savingPw, setSavingPw] = useState(false);

  // Avatar states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    bio: "",
  });
  const [pw, setPw] = useState({ current: "", new: "", confirm: "" });
  const [strength, setStrength] = useState(0);

  const calcStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    setStrength(s);
  };

  const SLABELS = ["Très faible", "Faible", "Moyen", "Fort", "Très fort"];
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

  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop volumineuse. Taille maximale : 5 Mo.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image (JPG, PNG).");
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
        const data = await response.json();
        if (data.profilePictureUrl) {
          await refresh();
        }
        setLocalAvatarUrl(null);
        setProfilePictureFile(null);
        toast.success("Photo de profil mise à jour avec succès !");
        return true;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading picture:", error);
      toast.error("Échec du téléchargement de la photo");
      return false;
    } finally {
      setUploadingPicture(false);
    }
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

  const showT = (msg: string, ok = true) => setToastMsg({ msg, ok });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(form);

    if (profilePictureFile) {
      await uploadProfilePicture();
    }

    setEditing(false);
    showT("Profil mis à jour avec succès");
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.new !== pw.confirm) {
      showT("Les mots de passe ne correspondent pas", false);
      return;
    }
    if (pw.new.length < 8) {
      showT("Le mot de passe doit contenir au moins 8 caractères", false);
      return;
    }
    setSavingPw(true);
    await updatePassword(pw.current, pw.new);
    setSavingPw(false);
    setPw({ current: "", new: "", confirm: "" });
    setStrength(0);
    showT("Mot de passe mis à jour");
  };

  useEffect(() => {
    if (error) {
      showT(error, false);
      setError(null);
    }
  }, [error, setError]);

  useEffect(() => {
    if (success) {
      showT(success, true);
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
            Profil non trouvé
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fu { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .d1{animation-delay:.04s}.d2{animation-delay:.08s}.d3{animation-delay:.12s}
        .d4{animation-delay:.16s}.d5{animation-delay:.2s}
      `}</style>

      {toastMsg && (
        <Toast
          msg={toastMsg.msg}
          ok={toastMsg.ok}
          onClose={() => setToastMsg(null)}
        />
      )}

      <div className="px-4 md:px-14 py-6 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 fu">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Mon Profil
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gérez vos informations personnelles et paramètres de sécurité
            </p>
          </div>
          <span className="w-fit px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40">
            {profile.role === "ADMIN" ? "Super-Admin" : profile.role}
          </span>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 fu d1">
          <div className="flex gap-6">
            {[
              {
                id: "general",
                label: "Informations Générales",
                icon: <IoPersonOutline className="w-4 h-4" />,
              },
              {
                id: "security",
                label: "Sécurité & Accès",
                icon: <IoShieldOutline className="w-4 h-4" />,
              },
              {
                id: "preferences",
                label: "Préférences",
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
            <Section className="fu d1">
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
                  {/* Avatar avec upload - version corrigée */}
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
                          ? "Activez le mode édition pour modifier la photo"
                          : "Changer la photo de profil"
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
                      {" · "}Inscrit depuis{" "}
                      {profile.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )
                        : "Date inconnue"}
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
                    {editing ? "Annuler" : "Modifier le profil"}
                  </button>
                </div>
              </div>
            </Section>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-100 dark:border-slate-800/60 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 fu d2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <IoLockOpenOutline className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">
                  Statut du compte
                </p>
                <p className="text-2xl font-black text-emerald-500 dark:text-emerald-400">
                  {profile.status === "ACTIVE" ? "Actif" : profile.status}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Dernière connexion:{" "}
                  {profile.lastLogin && profile.lastLogin !== "Invalid Date"
                    ? new Date(profile.lastLogin).toLocaleString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Jamais"}
                </p>
              </div>
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-100 dark:border-slate-800/60 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 fu d3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/15 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                  <IoShieldOutline className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">
                  Niveau d'accès
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  Niveau {profile.stats?.accessLevel || 5}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Accès complet à toutes les zones
                </p>
              </div>
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-100 dark:border-slate-800/60 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 fu d4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <IoTimeOutline className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">
                  Actions totales
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {(profile.stats?.totalActions || 0).toLocaleString("fr-FR")}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {profile.stats?.actionsThisMonth || 0} modifications ce mois
                </p>
              </div>
            </div>

            {/* Form */}
            <Section className="fu d4">
              <SectionHead
                title="Détails du compte"
                sub={
                  editing
                    ? "Modifiez vos informations personnelles"
                    : "Vos informations personnelles"
                }
              />
              <form onSubmit={handleSaveProfile} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel>Identifiant Système</FieldLabel>
                    <ReadField
                      value={profile.id?.slice(-8)}
                      icon={<IoLockClosedOutline className="w-4 h-4" />}
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      Non modifiable
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Date d'inscription</FieldLabel>
                    <ReadField
                      value={
                        profile.createdAt
                          ? new Date(profile.createdAt).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "Date inconnue"
                      }
                      icon={<IoTimeOutline className="w-4 h-4" />}
                    />
                  </div>
                  <div>
                    <FieldLabel>Prénom</FieldLabel>
                    <EditField
                      value={form.firstName}
                      onChange={(v) => setForm((p) => ({ ...p, firstName: v }))}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <FieldLabel>Nom</FieldLabel>
                    <EditField
                      value={form.lastName}
                      onChange={(v) => setForm((p) => ({ ...p, lastName: v }))}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <EditField
                      value={form.email}
                      onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                      disabled={!editing}
                      type="email"
                      icon={<IoMailOutline />}
                    />
                  </div>
                  <div>
                    <FieldLabel>Téléphone</FieldLabel>
                    <EditField
                      value={form.phoneNumber}
                      onChange={(v) =>
                        setForm((p) => ({ ...p, phoneNumber: v }))
                      }
                      disabled={!editing}
                      type="tel"
                      icon={<IoCallOutline />}
                      placeholder="Non renseigné"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel>Bio / Note</FieldLabel>
                    <textarea
                      value={form.bio}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, bio: e.target.value }))
                      }
                      disabled={!editing}
                      rows={3}
                      placeholder="Ajoutez une note..."
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
                      Annuler
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
                      {saving ? "Sauvegarde…" : "Sauvegarder"}
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
            {/* Password */}
            <Section className="fu d1">
              <SectionHead
                title="Changer le mot de passe"
                sub="Mettez à jour votre mot de passe régulièrement"
              />
              <form onSubmit={handleSavePassword} className="p-6 space-y-5">
                <div>
                  <FieldLabel>Mot de passe actuel</FieldLabel>
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
                  <FieldLabel>Nouveau mot de passe</FieldLabel>
                  <EditField
                    value={pw.new}
                    onChange={(v) => {
                      setPw((p) => ({ ...p, new: v }));
                      calcStrength(v);
                    }}
                    disabled={false}
                    type="password"
                    placeholder="Entrez un nouveau mot de passe"
                    showToggle
                  />
                  {pw.new && (
                    <div className="mt-2.5">
                      <div className="flex justify-between items-center mb-1.5 text-[10px]">
                        <span className="text-slate-500 dark:text-slate-400">
                          Force :{" "}
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
                          Min. 8 caractères
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
                  <FieldLabel>Confirmer le nouveau mot de passe</FieldLabel>
                  <EditField
                    value={pw.confirm}
                    onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
                    disabled={false}
                    type="password"
                    placeholder="Confirmez le nouveau mot de passe"
                    showToggle
                  />
                  {pw.confirm && pw.new !== pw.confirm && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                      <IoAlertCircle className="text-xs" /> Les mots de passe ne
                      correspondent pas
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
                    {savingPw
                      ? "Mise à jour…"
                      : "Mettre à jour le mot de passe"}
                  </button>
                </div>
              </form>
            </Section>

            {/* Sessions */}
            <Section className="fu d3">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Sessions Actives
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Gérez vos sessions connectées
                  </p>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={terminateAllSessions}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/20 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    Déconnecter tous les appareils
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
                            Actuelle
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        <IoGlobeOutline className="inline w-3 h-3 mr-1" />
                        {s.location} · IP: {s.ip} · Dernière activité:{" "}
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
                      {s.isCurrent ? "Session actuelle" : "Déconnecter"}
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
            {/* Langue */}
            <Section className="fu d1">
              <div className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Langue
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Choisissez votre langue préférée
                  </p>
                </div>
                <div className="flex gap-2">
                  {[
                    { code: "fr", label: "Français" },
                    { code: "en", label: "English" },
                    { code: "ar", label: "العربية" },
                    { code: "it", label: "Italien" },
                    { code: "es", label: "Espagnol" },
                    { code: "de", label: "Allemand" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => updateLanguage(lang.code)}
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

            {/* Thème */}
            <Section className="fu d2">
              <div className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Apparence
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Bascule entre mode clair et sombre
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
                    Clair
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
                    Sombre
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
