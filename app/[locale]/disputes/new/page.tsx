// app/[locale]/disputes/new/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoCloudUploadOutline,
  IoCloseOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoChatbubblesOutline,
  IoScaleOutline,
  IoHeadsetOutline,
  IoDocumentTextOutline,
  IoSparklesOutline,
  IoBuildOutline,
  IoVolumeHighOutline,
  IoCardOutline,
  IoCalendarClearOutline,
  IoEllipsisHorizontalOutline,
  IoLocationOutline,
  IoChevronForwardOutline,
  IoAlertCircleOutline,
  IoSendOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoTimeOutline,
  IoWalletOutline,
  IoCameraOutline,
  IoImageOutline,
  IoDocumentText,
  IoFileTrayFullOutline,
  IoFolderOpenOutline,
  IoHappyOutline,
  IoSearchOutline,
  IoChevronBackOutline,
} from "react-icons/io5";
import {
  MdOutlineCleaningServices,
  MdOutlinePhotoLibrary,
} from "react-icons/md";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

const GRADIENT_BUTTON = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const GRADIENT_TEXT =
  "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

const pipListingImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

// ============================================
// DISPUTE TYPES
// ============================================
const DISPUTE_TYPES = [
  {
    value: "DAMAGE",
    label: "Dommages matériels",
    desc: "Biens endommagés, cassés ou détériorés",
    icon: IoBuildOutline,
    hint: "Meubles, électroménager, objets décoratifs...",
  },
  {
    value: "CLEANING",
    label: "Propreté insuffisante",
    desc: "Le logement n'était pas propre à votre arrivée",
    icon: MdOutlineCleaningServices,
    hint: "Sols, sanitaires, cuisine, literie...",
  },
  {
    value: "MISREPRESENTATION",
    label: "Logement non conforme",
    desc: "Ne correspond pas à la description ou aux photos",
    icon: IoHomeOutline,
    hint: "Taille, équipements, localisation...",
  },
  {
    value: "NOISE",
    label: "Bruit et nuisances",
    desc: "Troubles de voisinage ou bruit excessif",
    icon: IoVolumeHighOutline,
    hint: "Voisinage, travaux, fête...",
  },
  {
    value: "PAYMENT",
    label: "Problème de paiement",
    desc: "Facturation incorrecte ou frais non justifiés",
    icon: IoCardOutline,
    hint: "Surcharge, dépôt non remboursé...",
  },
  {
    value: "CANCELLATION",
    label: "Annulation abusive",
    desc: "Annulation par l'hôte sans motif valable",
    icon: IoCalendarClearOutline,
    hint: "Annulation de dernière minute...",
  },
  {
    value: "OTHER",
    label: "Autre problème",
    desc: "Votre situation ne correspond à aucune catégorie",
    icon: IoEllipsisHorizontalOutline,
    hint: "Décrivez librement dans la description",
  },
];

// ============================================
// TOAST
// ============================================
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const getStyles = () => {
    if (type === "success")
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300";
    if (type === "error")
      return "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300";
    if (type === "warning")
      return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300";
    return "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.9 }}
      className="fixed top-24 left-1/2 -translate-x-1/2 z-[100]"
    >
      <div
        className={`flex items-center gap-3 pl-5 pr-4 py-3.5 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-2xl border bg-white/80 dark:bg-slate-900/80 ${getStyles()}`}
      >
        {type === "success" ? (
          <IoCheckmarkCircleOutline className="text-lg" />
        ) : type === "error" ? (
          <IoAlertCircleOutline className="text-lg" />
        ) : (
          <IoSparklesOutline className="text-lg" />
        )}
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <IoCloseOutline className="text-sm" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
interface Booking {
  id: string;
  reference: string;
  listing: {
    id: string;
    title: string;
    governorate: string;
    delegation: string;
    images?: string[];
  };
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  tenant: { firstName: string; lastName: string };
  owner: { firstName: string; lastName: string };
  status: string;
}

export default function NewDisputePage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { getToken } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const [requestedAmount, setRequestedAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showToast = useCallback(
    (msg: string, type: "success" | "error" | "info" | "warning" = "info") =>
      setToast({ message: msg, type }),
    [],
  );

  useEffect(() => {
    fetchCompletedBookings();
  }, []);
  useEffect(
    () => () => {
      evidencePreviews.forEach((url) => URL.revokeObjectURL(url));
    },
    [evidencePreviews],
  );

  const fetchCompletedBookings = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/bookings?status=COMPLETED&pageSize=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const bookingsList = Array.isArray(data) ? data : data.bookings || [];
      setBookings(bookingsList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addFiles = (files: File[]) => {
    const validFiles = files.filter((f) => f.size <= 10 * 1024 * 1024);
    const invalidFiles = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0)
      showToast(
        `${invalidFiles.length} fichier(s) dépassent la limite de 10MB`,
        "error",
      );
    if (validFiles.length === 0) return;
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setEvidencePreviews((prev) => [...prev, ...newPreviews]);
    setEvidenceFiles((prev) => [...prev, ...validFiles]);
    if (step === 3) setStep(4);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(evidencePreviews[index]);
    setEvidencePreviews((prev) => prev.filter((_, i) => i !== index));
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    setUploadingFiles(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("image", file);
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          if (data.url) urls.push(data.url);
        }
      } catch (error) {
        console.error("Upload error", file.name, error);
      }
    }
    setUploadingFiles(false);
    return urls;
  };

  const handleSubmit = async () => {
    if (!selectedBooking || !selectedType || !description.trim()) {
      showToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }
    setSubmitting(true);
    try {
      let evidenceUrls: string[] = [];
      if (evidenceFiles.length > 0)
        evidenceUrls = await uploadFiles(evidenceFiles);

      const token = await getToken();
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          type: selectedType,
          description,
          evidence: evidenceUrls,
          refundAmount: requestedAmount ? parseFloat(requestedAmount) : null,
        }),
      });

      if (res.ok) {
        showToast("Litige soumis avec succès !", "success");
        setSubmitted(true);
        setTimeout(() => router.push("/disputes"), 2000);
      } else {
        const error = await res.json();
        showToast(error.error || "Erreur lors de la soumission", "error");
      }
    } catch (error) {
      showToast("Erreur de connexion", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageError = (id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen={true}
        variant="spinner"
        size="lg"
        color="primary"
        text="Chargement des réservations..."
        speed="normal"
      />
    );
  }

  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const selectedTypeData = DISPUTE_TYPES.find((t) => t.value === selectedType);
  const SelectedIcon = selectedTypeData?.icon || IoEllipsisHorizontalOutline;

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <TenantHeader />
        <div className="flex items-center justify-center px-4 pt-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="relative w-full max-w-sm text-center"
          >
            <div className="absolute -inset-8 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-600/10 rounded-[40px] blur-2xl" />
            <div className="relative rounded-[28px] border border-white/70 bg-white/85 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 12,
                    delay: 0.2,
                  }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
                >
                  <IoCheckmarkCircleOutline className="text-3xl text-white" />
                </motion.div>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                Litige soumis
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Notre équipe examinera votre demande sous 24h ouvrées.
              </p>
              <div className="rounded-xl bg-slate-50 p-4 text-left space-y-2 dark:bg-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Référence</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {selectedBooking?.reference}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Type</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedTypeData?.label}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Preuves</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {evidencePreviews.length} photo(s)
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <TenantHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs font-medium">
          <Link href={`/${locale}/disputes`} className="...">
            <span>LIGITES</span>
          </Link>
          <IoChevronForwardOutline className="h-3 w-3 text-slate-400" />
          <span className="text-black dark:text-white">NOUVEAU</span>
        </div>

        {/* Hero - Aligné à gauche */}
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70 dark:text-indigo-300">
            <IoScaleOutline className="h-3 w-3" />
            Assistance litige
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            Décrivez votre <span className={GRADIENT_TEXT}>problème</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Nous sommes là pour trouver une solution équitable. Sélectionnez la
            réservation puis décrivez la situation.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          {/* LEFT COLUMN - FORM */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Booking Selection */}
            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-extrabold ${
                      step >= 1
                        ? "border-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white"
                        : "border-white/70 bg-white/80 text-slate-500 dark:border-white/10 dark:bg-slate-900/80"
                    }`}
                  >
                    1
                  </div>
                  <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">
                    Réservation concernée
                  </h2>
                </div>
                <div className="space-y-2.5">
                  {completedBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center h-80">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-500/20 via-indigo-500/20 to-purple-600/20 animate-pulse" />
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-600/10 backdrop-blur-sm ">
                          <IoCalendarOutline className="h-10 w-10 text-slate-400" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Aucune réservation terminée
                      </p>
                      <button
                        onClick={() => router.push("/search")}
                        className={`mt-4 inline-flex items-center gap-2 rounded-full ${GRADIENT_BUTTON} px-4 py-2 text-xs font-bold`}
                      >
                        <IoSearchOutline className="h-3.5 w-3.5" />
                        Découvrir des logements
                      </button>
                    </div>
                  ) : (
                    completedBookings.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => {
                          setSelectedBooking(booking);
                          setStep(2);
                        }}
                        className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          selectedBooking?.id === booking.id
                            ? "border-indigo-500 bg-indigo-50/50 shadow-md dark:bg-indigo-950/20 dark:border-indigo-500/50"
                            : "border-white/70 bg-white/50 hover:border-indigo-300 hover:bg-white dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-indigo-500/30"
                        }`}
                      >
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-white/70 bg-white/50 dark:border-white/10">
                          {booking.listing.images?.[0] &&
                          !imgErrors[booking.id] ? (
                            <img
                              src={pipListingImage(booking.listing.images[0])}
                              alt={booking.listing.title}
                              className="h-full w-full object-cover"
                              onError={() => handleImageError(booking.id)}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                              <IoHomeOutline className="text-2xl text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold truncate text-slate-800 dark:text-white">
                            {booking.listing.title}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <IoLocationOutline className="text-[10px]" />
                            {booking.listing.governorate},{" "}
                            {booking.listing.delegation}
                          </p>
                          <div className="mt-1.5 flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <IoCalendarOutline className="text-[9px]" />
                              {format(new Date(booking.checkIn), "dd MMM", {
                                locale: fr,
                              })}{" "}
                              →{" "}
                              {format(new Date(booking.checkOut), "dd MMM", {
                                locale: fr,
                              })}
                            </span>
                            <span className="text-[10px] text-slate-300">
                              ·
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <IoWalletOutline className="text-[9px]" />
                              {booking.totalPrice.toLocaleString("fr-FR")} TND
                            </span>
                          </div>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            selectedBooking?.id === booking.id
                              ? "border-indigo-500 bg-indigo-500"
                              : "border-slate-300 dark:border-white/20"
                          }`}
                        >
                          {selectedBooking?.id === booking.id && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Dispute Type */}
            {selectedBooking && (
              <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-extrabold ${
                        step >= 2
                          ? "border-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white"
                          : "border-white/70 bg-white/80 text-slate-500 dark:border-white/10 dark:bg-slate-900/80"
                      }`}
                    >
                      2
                    </div>
                    <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">
                      Type de problème
                    </h2>
                  </div>
                  <p className="mb-5 text-[11px] text-slate-400 -mt-2">
                    Sélectionnez la catégorie qui correspond le mieux à votre
                    situation.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {DISPUTE_TYPES.filter((t) => t.value !== "OTHER").map(
                      (type) => {
                        const Icon = type.icon;
                        const active = selectedType === type.value;
                        return (
                          <button
                            key={type.value}
                            onClick={() => {
                              setSelectedType(type.value);
                              setStep(3);
                            }}
                            className={`relative w-full text-left p-4 rounded-2xl border transition-all overflow-hidden group ${
                              active
                                ? "border-indigo-500 bg-indigo-50/50 shadow-md dark:bg-indigo-950/20 dark:border-indigo-500/50"
                                : "border-white/70 bg-white/50 hover:border-indigo-300 hover:bg-white dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-indigo-500/30"
                            }`}
                          >
                            <div className="relative flex items-start gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 transition-all ${
                                  active
                                    ? "bg-indigo-100 shadow-md dark:bg-indigo-900/50"
                                    : "bg-slate-100 dark:bg-slate-800"
                                }`}
                              >
                                <Icon
                                  className={`text-base ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-bold ${active ? "text-indigo-700 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"}`}
                                >
                                  {type.label}
                                </p>
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                  {type.desc}
                                </p>
                              </div>
                              {active && (
                                <IoCheckmarkCircleOutline className="text-indigo-500 text-base flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                  {/* Other card */}
                  <div className="mt-4 pt-4 border-t border-white/30 dark:border-white/10">
                    <p className="mb-3 text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                      Autre situation
                    </p>
                    {(() => {
                      const type = DISPUTE_TYPES.find(
                        (t) => t.value === "OTHER",
                      )!;
                      const Icon = type.icon;
                      const active = selectedType === "OTHER";
                      return (
                        <button
                          onClick={() => {
                            setSelectedType("OTHER");
                            setStep(3);
                          }}
                          className={`relative w-full text-left p-4 rounded-2xl border transition-all overflow-hidden group ${
                            active
                              ? "border-indigo-500 bg-indigo-50/50 shadow-md dark:bg-indigo-950/20 dark:border-indigo-500/50"
                              : "border-white/70 bg-white/50 hover:border-indigo-300 hover:bg-white dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-indigo-500/30"
                          }`}
                        >
                          <div className="relative flex items-start gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 transition-all ${
                                active
                                  ? "bg-indigo-100 shadow-md dark:bg-indigo-900/50"
                                  : "bg-slate-100 dark:bg-slate-800"
                              }`}
                            >
                              <Icon
                                className={`text-base ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-bold ${active ? "text-indigo-700 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"}`}
                              >
                                {type.label}
                              </p>
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                {type.desc}
                              </p>
                            </div>
                            {active && (
                              <IoCheckmarkCircleOutline className="text-indigo-500 text-base flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })()}
                  </div>

                  {/* Selected confirmation */}
                  <AnimatePresence>
                    {selectedType && selectedTypeData && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        className="overflow-hidden mt-4"
                      >
                        <div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 dark:bg-indigo-950/20">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                            <SelectedIcon className="text-indigo-500 text-sm" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                              {selectedTypeData.label}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {selectedTypeData.desc}
                            </p>
                          </div>
                          <IoCheckmarkCircleOutline className="text-indigo-400 text-lg" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Step 3: Upload Evidence */}
            {selectedType && (
              <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-extrabold ${
                        step >= 3
                          ? "border-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white"
                          : "border-white/70 bg-white/80 text-slate-500 dark:border-white/10 dark:bg-slate-900/80"
                      }`}
                    >
                      3
                    </div>
                    <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">
                      Preuves photographiques
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        addFiles(
                          Array.from(e.dataTransfer.files).filter((f) =>
                            f.type.startsWith("image/"),
                          ),
                        );
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/30 dark:border-white/20 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/20"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files)
                            addFiles(
                              Array.from(e.target.files).filter((f) =>
                                f.type.startsWith("image/"),
                              ),
                            );
                        }}
                      />
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-500 dark:bg-sky-500/10">
                        <IoCameraOutline className="text-2xl" />
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Glissez vos photos ici
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        ou cliquez pour parcourir · max 10 Mo
                      </p>
                    </div>

                    {evidencePreviews.length > 0 && (
                      <>
                        <div className="flex items-center gap-2">
                          <MdOutlinePhotoLibrary className="text-slate-400" />
                          <span className="text-xs font-medium text-slate-500">
                            {evidencePreviews.length} photo(s) ajoutée(s)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <AnimatePresence>
                            {evidencePreviews.map((p, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative group"
                              >
                                <div className="h-20 w-20 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                                  <img
                                    src={p}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <button
                                  onClick={() => removeFile(i)}
                                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-rose-500 shadow-md transition-all opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800"
                                >
                                  <IoCloseOutline className="text-xs" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </>
                    )}
                    {step === 3 && evidencePreviews.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <IoImageOutline className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-xs text-slate-400">
                          Aucune photo ajoutée pour le moment
                        </p>
                      </div>
                    )}
                    {step === 3 && evidencePreviews.length > 0 && (
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => setStep(4)}
                          className={`rounded-full ${GRADIENT_BUTTON} px-6 py-2 text-xs font-bold shadow-md`}
                        >
                          Suivant →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Description */}
            {selectedType && step >= 4 && (
              <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-[10px] font-extrabold text-white">
                      4
                    </div>
                    <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">
                      Description de la situation
                    </h2>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez l'incident en détail : dates, personnes impliquées, séquence des événements..."
                    rows={5}
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 p-4 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200 dark:focus:border-indigo-400"
                  />
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-[10px] font-medium text-slate-500">
                      Montant demandé
                    </span>
                    <div className="relative">
                      <input
                        type="number"
                        value={requestedAmount}
                        onChange={(e) => setRequestedAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-36 rounded-xl border border-slate-200 bg-white/50 p-2.5 pl-3 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">
                        TND
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400">optionnel</span>
                  </div>
                  <div className="flex justify-between pt-6">
                    <button
                      onClick={() => setStep(3)}
                      className="rounded-full border border-slate-300 px-6 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-white/20 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      ← Précédent
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={
                        !description.trim() || submitting || uploadingFiles
                      }
                      className={`rounded-full px-8 py-2.5 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${GRADIENT_BUTTON}`}
                    >
                      {submitting || uploadingFiles ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                          {uploadingFiles ? "Upload..." : "Soumission..."}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Soumettre <IoSendOutline className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - SIDEBAR */}
          <div className="lg:col-span-5 space-y-5">
            {/* Selected booking preview */}
            <AnimatePresence mode="wait">
              {selectedBooking && (
                <motion.div
                  key={selectedBooking.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
                    <div className="relative h-40 overflow-hidden">
                      {selectedBooking.listing.images?.[0] &&
                      !imgErrors[selectedBooking.id] ? (
                        <img
                          src={pipListingImage(
                            selectedBooking.listing.images[0],
                          )}
                          alt={selectedBooking.listing.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                          <IoHomeOutline className="text-4xl text-slate-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/30 to-transparent dark:from-slate-950/80 dark:via-slate-950/30" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                          {selectedBooking.listing.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <IoLocationOutline className="text-[10px]" />
                          {selectedBooking.listing.governorate},{" "}
                          {selectedBooking.listing.delegation}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            icon: <IoCalendarOutline className="text-[10px]" />,
                            label: "Arrivée",
                            value: format(
                              new Date(selectedBooking.checkIn),
                              "dd MMM",
                              { locale: fr },
                            ),
                          },
                          {
                            icon: <IoTimeOutline className="text-[10px]" />,
                            label: "Nuits",
                            value: `${selectedBooking.nights}`,
                          },
                          {
                            icon: <IoWalletOutline className="text-[10px]" />,
                            label: "Total",
                            value: `${selectedBooking.totalPrice.toLocaleString("fr-FR")} TND`,
                          },
                        ].map((d) => (
                          <div
                            key={d.label}
                            className="rounded-xl bg-slate-50 py-2 text-center dark:bg-white/5"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-slate-400">{d.icon}</span>
                              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                                {d.label}
                              </p>
                            </div>
                            <p className="mt-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {d.value}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-white/5">
                        <span className="text-[9px] text-slate-400">Réf.</span>
                        <span className="font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          {selectedBooking.reference}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Process info */}
            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
              <h3 className="mb-4 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Processus de résolution
              </h3>
              <div className="space-y-4">
                {[
                  {
                    icon: <IoShieldCheckmarkOutline />,
                    title: "Examen sous 24h",
                    desc: "Analyse de vos preuves",
                  },
                  {
                    icon: <IoChatbubblesOutline />,
                    title: "Médiation neutre",
                    desc: "Contact avec l'hôte",
                  },
                  {
                    icon: <IoScaleOutline />,
                    title: "Décision finale",
                    desc: "Ajustement des fonds",
                  },
                ].map((s, i) => (
                  <div key={s.title} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-500 dark:from-sky-500/10 dark:to-indigo-500/10 dark:text-sky-400">
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help */}
            <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
              <h3 className="mb-3 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Besoin d'aide ?
              </h3>
              <button className="mb-2 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white/50 p-3 text-left transition-all hover:border-indigo-300 hover:bg-white dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-indigo-500/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-500 dark:from-sky-500/10 dark:to-indigo-500/10 dark:text-sky-400">
                  <IoHeadsetOutline className="text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Contacter le support
                  </p>
                  <p className="text-[9px] text-slate-500">Réponse sous 2h</p>
                </div>
                <IoChevronForwardOutline className="text-slate-400 text-xs" />
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white/50 p-3 text-left transition-all hover:border-indigo-300 hover:bg-white dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-indigo-500/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-500 dark:from-sky-500/10 dark:to-indigo-500/10 dark:text-sky-400">
                  <IoDocumentTextOutline className="text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Politique de litiges
                  </p>
                  <p className="text-[9px] text-slate-500">
                    Conditions générales
                  </p>
                </div>
                <IoChevronForwardOutline className="text-slate-400 text-xs" />
              </button>
            </div>

            {/* Protection */}
            <div className="rounded-[28px] bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 p-5 text-white">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <IoShieldCheckmarkOutline className="text-xl" />
              </div>
              <h3 className="text-xs font-bold mb-1">Protection Nesthub</h3>
              <p className="text-[10px] leading-relaxed text-white/80">
                Toutes vos transactions sont protégées par notre fonds de
                garantie. Médiation neutre et équitable.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
