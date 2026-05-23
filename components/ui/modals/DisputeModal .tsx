// components/ui/DisputeModal.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  IoCloseOutline,
  IoCloudUploadOutline,
  IoDocumentTextOutline,
  IoImageOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoWalletOutline,
  IoTimeOutline,
  IoHomeOutline,
  IoBuildOutline,
  IoSparklesOutline,
  IoAlertCircleOutline,
  IoSendOutline,
  IoScaleOutline,
  IoChatbubblesOutline,
  IoShieldCheckmarkOutline,
  IoHeadsetOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { MdOutlineCleaningServices } from "react-icons/md";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTheme } from "next-themes";

// Types
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
  status: string;
}

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedBookingId?: string;
}

// Catégories de litige (identiques à ton HTML)
const DISPUTE_TYPES = [
  { value: "damages", label: "Dommages", icon: "🔨", desc: "Biens endommagés, cassés ou détériorés" },
  { value: "cleanliness", label: "Propreté", icon: "🧹", desc: "Logement non propre à l'arrivée" },
  { value: "payment", label: "Paiement", icon: "💰", desc: "Facturation incorrecte ou frais non justifiés" },
  { value: "noise", label: "Bruit", icon: "🔊", desc: "Troubles de voisinage ou bruit excessif" },
  { value: "amenities", label: "Équipements manquants", icon: "🔧", desc: "Services ou équipements non fournis" },
  { value: "other", label: "Autre", icon: "📝", desc: "Votre situation ne correspond à aucune catégorie" },
];

const getImageUrl = (url: string) => {
  if (!url) return "";
  if (url.includes("/api/listings/image")) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

export function DisputeModal({ isOpen, onClose, onSuccess, preselectedBookingId }: DisputeModalProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filesPreview, setFilesPreview] = useState<string[]>([]);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      fetchCompletedBookings();
      if (preselectedBookingId) {
        // Trouver et sélectionner le booking
        const booking = bookings.find(b => b.id === preselectedBookingId);
        if (booking) setSelectedBooking(booking);
      }
    }
  }, [isOpen, mounted, preselectedBookingId]);

  useEffect(() => {
    return () => {
      filesPreview.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filesPreview]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

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
      console.error("Erreur chargement réservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => f.type.startsWith("image/") || f.type === "application/pdf");
    const invalidFiles = newFiles.filter(f => !f.type.startsWith("image/") && f.type !== "application/pdf");
    
    if (invalidFiles.length > 0) {
      showToast(`${invalidFiles.length} fichier(s) non supportés (PNG, JPG, PDF uniquement)`, "error");
    }
    if (validFiles.length === 0) return;

    const newPreviews = validFiles.map(file => {
      if (file.type.startsWith("image/")) return URL.createObjectURL(file);
      return "pdf";
    });

    setFiles(prev => [...prev, ...validFiles]);
    setFilesPreview(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    if (filesPreview[index] !== "pdf") URL.revokeObjectURL(filesPreview[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilesPreview(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (fileList: File[]): Promise<string[]> => {
    const urls: string[] = [];
    setUploadingFiles(true);
    for (const file of fileList) {
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
    if (!selectedBooking) {
      showToast("Veuillez sélectionner une réservation", "error");
      return;
    }
    if (!selectedCategory) {
      showToast("Veuillez sélectionner une catégorie", "error");
      return;
    }
    if (!subject.trim()) {
      showToast("Veuillez indiquer un sujet", "error");
      return;
    }
    if (!description.trim()) {
      showToast("Veuillez décrire la situation", "error");
      return;
    }

    setSubmitting(true);
    try {
      let evidenceUrls: string[] = [];
      if (files.length > 0) evidenceUrls = await uploadFiles(files);

      const token = await getToken();
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          type: selectedCategory.toUpperCase(),
          subject: subject,
          description: description,
          evidence: evidenceUrls,
        }),
      });

      if (res.ok) {
        showToast("Litige soumis avec succès !", "success");
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
          router.push("/disputes");
        }, 2000);
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

  if (!isOpen || !mounted) return null;

  // Écran de succès
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-sm rounded-2xl p-8 text-center ${
            isDark ? "bg-slate-900" : "bg-white"
          } shadow-2xl border ${isDark ? "border-white/10" : "border-gray-100"}`}
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center">
              <IoCheckmarkCircleOutline className="text-3xl text-white" />
            </div>
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            Litige soumis
          </h2>
          <p className={`text-sm mb-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Notre équipe examinera votre demande sous 24h.
          </p>
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-semibold transition ${
              isDark ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Fermer
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-sm">
      <AnimatePresence>
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]">
            <div className={`flex items-center gap-3 pl-4 pr-3 py-3 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-2xl border ${
              toast.type === "success" 
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300 dark:bg-emerald-500/10"
                : toast.type === "error"
                ? "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300 dark:bg-rose-500/10"
                : "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300 dark:bg-sky-500/10"
            }`}>
              {toast.type === "success" ? <IoCheckmarkCircleOutline /> : <IoAlertCircleOutline />}
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-2 p-1 rounded-lg hover:bg-black/5">
                <IoCloseOutline className="text-sm" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] overflow-hidden ${
          isDark ? "bg-slate-900" : "bg-white"
        }`}
      >
        {/* Header - exactement comme ton HTML */}
        <div className={`px-8 py-6 flex items-center justify-between sticky top-0 z-10 ${
          isDark ? "bg-slate-900/95" : "bg-white/95"
        } backdrop-blur-sm border-b ${isDark ? "border-white/10" : "border-gray-100"}`}>
          <h2 className={`font-headline text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-on-surface"}`}>
            Ouvrir un nouveau litige
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="px-8 py-4 overflow-y-auto space-y-8 pb-10">
          {/* Step Info - comme ton HTML */}
          <div className={`flex items-center gap-4 p-4 rounded-xl ${
            isDark ? "bg-slate-800/50" : "bg-surface-container-low"
          }`}>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined">gavel</span>
            </div>
            <div>
              <p className="font-medium text-on-surface">Espace de Conciliation</p>
              <p className="text-sm text-on-surface-variant">Veuillez fournir des détails précis pour une résolution rapide.</p>
            </div>
          </div>

          {/* Booking Selection */}
          <div className="space-y-2">
            <label className={`font-label text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-gray-400" : "text-on-surface-variant"
            }`}>
              Réservation concernée
            </label>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className={`text-center py-8 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-gray-50"}`}>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Aucune réservation terminée
                </p>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedBooking?.id || ""}
                  onChange={(e) => {
                    const booking = bookings.find(b => b.id === e.target.value);
                    setSelectedBooking(booking || null);
                  }}
                  className={`w-full rounded-xl px-4 py-3.5 appearance-none focus:ring-4 focus:ring-primary/10 transition-all font-body ${
                    isDark
                      ? "bg-slate-800 border-white/10 text-white"
                      : "bg-surface-container-high border-0 text-on-surface"
                  }`}
                >
                  <option value="">Sélectionnez une réservation...</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.listing.title} - du {format(new Date(booking.checkIn), "dd MMM", { locale: fr })} au {format(new Date(booking.checkOut), "dd MMM", { locale: fr })}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  expand_more
                </span>
              </div>
            )}
          </div>

          {/* Category Chips - exactement comme ton HTML */}
          <div className="space-y-3">
            <label className={`font-label text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-gray-400" : "text-on-surface-variant"
            }`}>
              Catégorie du litige
            </label>
            <div className="flex flex-wrap gap-2">
              {DISPUTE_TYPES.map((cat) => (
                <label key={cat.value} className="cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={selectedCategory === cat.value}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="hidden peer"
                  />
                  <span className={`px-4 py-2 rounded-full border-0 transition-all text-sm inline-flex items-center gap-1.5 ${
                    selectedCategory === cat.value
                      ? "bg-primary text-white"
                      : isDark
                        ? "bg-slate-800 text-gray-300 peer-hover:bg-slate-700"
                        : "bg-surface-container-high text-on-surface-variant peer-hover:bg-surface-container-highest"
                  }`}>
                    <span>{cat.icon}</span>
                    {cat.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Subject Input */}
          <div className="space-y-2">
            <label className={`font-label text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-gray-400" : "text-on-surface-variant"
            }`}>
              Sujet du litige
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Climatisation défectueuse à l'arrivée"
              className={`w-full rounded-xl px-4 py-3.5 focus:ring-4 focus:ring-primary/10 transition-all font-body ${
                isDark
                  ? "bg-slate-800 border-white/10 text-white placeholder:text-gray-500"
                  : "bg-surface-container-high border-0 text-on-surface"
              }`}
            />
          </div>

          {/* Description - WYSIWYG mockup comme ton HTML */}
          <div className="space-y-2">
            <label className={`font-label text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-gray-400" : "text-on-surface-variant"
            }`}>
              Description détaillée
            </label>
            <div className="rounded-xl overflow-hidden border border-outline-variant/30 flex flex-col">
              <div className={`p-2 flex gap-1 border-b border-outline-variant/30 ${
                isDark ? "bg-slate-800" : "bg-surface-container-high"
              }`}>
                <button type="button" className="w-8 h-8 rounded hover:bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">format_bold</span>
                </button>
                <button type="button" className="w-8 h-8 rounded hover:bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">format_italic</span>
                </button>
                <button type="button" className="w-8 h-8 rounded hover:bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
                </button>
                <div className="w-[1px] h-4 bg-outline-variant/30 mx-1 self-center"></div>
                <button type="button" className="w-8 h-8 rounded hover:bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">link</span>
                </button>
                <button type="button" className="w-8 h-8 rounded hover:bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">image</span>
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full p-4 border-0 focus:ring-0 font-body resize-none ${
                  isDark
                    ? "bg-slate-900 text-white placeholder:text-gray-500"
                    : "bg-surface-container-lowest text-on-surface"
                }`}
                placeholder="Décrivez l'incident avec le plus de précisions possibles..."
                rows={5}
              />
            </div>
          </div>

          {/* Drag & Drop Upload - exactement comme ton HTML */}
          <div className="space-y-2">
            <label className={`font-label text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-gray-400" : "text-on-surface-variant"
            }`}>
              Preuves (Photos / PDF)
            </label>
            <div
              id="drop-zone"
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-colors group cursor-pointer ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : isDark
                    ? "border-white/20 hover:border-white/40 bg-slate-800/50"
                    : "border-outline-variant hover:bg-surface-container-low bg-surface-container-low/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${
                isDark ? "bg-slate-700" : "bg-white"
              }`}>
                <IoCloudUploadOutline className={`text-2xl ${isDark ? "text-indigo-400" : "text-primary"}`} />
              </div>
              <div className="text-center">
                <p className={`font-semibold ${isDark ? "text-white" : "text-on-surface"}`}>
                  Glissez-déposez vos fichiers ici
                </p>
                <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-on-surface-variant"}`}>
                  PNG, JPG ou PDF jusqu'à 10MB
                </p>
              </div>
              <button type="button" className={`mt-2 font-semibold text-sm underline-offset-4 hover:underline ${
                isDark ? "text-indigo-400" : "text-primary"
              }`}>
                Parcourir les fichiers
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(Array.from(e.target.files));
                }}
              />
            </div>

            {/* Files Preview */}
            {filesPreview.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className={`flex items-center justify-between p-2 rounded-lg ${
                    isDark ? "bg-slate-800" : "bg-gray-50"
                  }`}>
                    <div className="flex items-center gap-2">
                      {filesPreview[index] === "pdf" ? (
                        <IoDocumentTextOutline className="text-red-500 text-xl" />
                      ) : (
                        <IoImageOutline className="text-indigo-500 text-xl" />
                      )}
                      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className={`p-1 rounded ${isDark ? "hover:bg-white/10" : "hover:bg-gray-200"}`}
                    >
                      <IoCloseOutline className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer - exactement comme ton HTML */}
        <div className={`px-8 py-6 flex items-center justify-end gap-4 border-t ${
          isDark ? "border-white/10" : "border-outline-variant/10"
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              isDark
                ? "text-gray-400 hover:bg-white/10"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || uploadingFiles || !selectedBooking || !selectedCategory || !subject || !description}
            className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting || uploadingFiles ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {uploadingFiles ? "Upload..." : "Soumission..."}
              </span>
            ) : (
              "Soumettre le litige"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}