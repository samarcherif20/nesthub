// components/ui/dispute/NewDisputeModal.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  IoCloseOutline,
  IoCheckmarkCircleOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoHomeOutline,
  IoWalletOutline,
  IoBuildOutline,
  IoVolumeHighOutline,
  IoCardOutline,
  IoCalendarClearOutline,
  IoEllipsisHorizontalOutline,
  IoAlertCircleOutline,
  IoSendOutline,
  IoTimeOutline,
  IoCameraOutline,
  IoImageOutline,
  IoChevronForwardOutline,
  IoArrowBackOutline,
  IoWarningOutline,
  IoDocumentTextOutline,
  IoChatbubblesOutline,
  IoChevronBack,
} from "react-icons/io5";
import { MdOutlineCleaningServices } from "react-icons/md";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, AlertCircle, X } from "lucide-react";

const GRADIENT_BUTTON = `
  bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 
  hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700
  text-white shadow-md hover:shadow-lg 
  transition-all duration-300
`;

const GRADIENT_TEXT = "bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent";

const pipListingImage = (url: string) => {
  if (!url) return "";
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

// Types de litiges avec clés de traduction
const DISPUTE_TYPES = [
  { value: "DAMAGE", labelKey: "damage", descKey: "damageDesc", icon: IoBuildOutline },
  { value: "CLEANING", labelKey: "cleaning", descKey: "cleaningDesc", icon: MdOutlineCleaningServices },
  { value: "MISREPRESENTATION", labelKey: "misrepresentation", descKey: "misrepresentationDesc", icon: IoHomeOutline },
  { value: "NOISE", labelKey: "noise", descKey: "noiseDesc", icon: IoVolumeHighOutline },
  { value: "PAYMENT", labelKey: "payment", descKey: "paymentDesc", icon: IoCardOutline },
  { value: "CANCELLATION", labelKey: "cancellation", descKey: "cancellationDesc", icon: IoCalendarClearOutline },
  { value: "OTHER", labelKey: "other", descKey: "otherDesc", icon: IoEllipsisHorizontalOutline },
];

// Toast component
function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "info"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const getStyles = () => {
    if (type === "success") return "bg-green-500 text-white";
    if (type === "error") return "bg-red-500 text-white";
    return "bg-sky-500 text-white";
  };

  const getIcon = () => {
    if (type === "success") return <CheckCircle className="w-5 h-5" />;
    if (type === "error") return <AlertCircle className="w-5 h-5" />;
    return <IoChatbubblesOutline className="w-5 h-5" />;
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[250] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${getStyles()}`}>
        {getIcon()}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface NewDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewDisputeModal({ isOpen, onClose, onSuccess }: NewDisputeModalProps) {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { getToken } = useAuth();
  const t = useTranslations("NewDisputeModal");

  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "info") => setToast({ message: msg, type }), []);

  useEffect(() => {
    if (isOpen) {
      fetchCompletedBookings();
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  useEffect(() => {
    return () => evidencePreviews.forEach(url => URL.revokeObjectURL(url));
  }, [evidencePreviews]);

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
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (validFiles.length === 0) return;
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setEvidencePreviews(prev => [...prev, ...newPreviews]);
    setEvidenceFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(evidencePreviews[index]);
    setEvidencePreviews(prev => prev.filter((_, i) => i !== index));
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    setUploadingFiles(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("image", file);
      try {
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (response.ok) {
          const data = await response.json();
          if (data.url) urls.push(data.url);
        }
      } catch (error) { console.error("Upload error", error); }
    }
    setUploadingFiles(false);
    return urls;
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    if (!selectedBooking || !selectedType || !description.trim()) {
      showToast(t("toast.missingFields"), "error");
      return;
    }
    
    isSubmittingRef.current = true;
    setSubmitting(true);
    
    try {
      let evidenceUrls: string[] = [];
      if (evidenceFiles.length > 0) evidenceUrls = await uploadFiles(evidenceFiles);
      
      const token = await getToken();
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          type: selectedType,
          description,
          evidence: evidenceUrls,
        }),
      });
      
      if (res.ok) {
        showToast(t("toast.success"), "success");
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
          router.refresh();
        }, 1500);
      } else {
        const error = await res.json();
        showToast(error.error || t("toast.error"), "error");
        isSubmittingRef.current = false;
      }
    } catch (error) {
      showToast(t("toast.connectionError"), "error");
      isSubmittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageError = (id: string) => setImgErrors(prev => ({ ...prev, [id]: true }));

  const resetForm = () => {
    setSelectedBooking(null);
    setSelectedType("");
    setDescription("");
    setEvidenceFiles([]);
    setEvidencePreviews([]);
    setStep(1);
    isSubmittingRef.current = false;
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getBookingImage = (booking: any) => {
    if (booking.listing?.photos?.[0]?.url) {
      return booking.listing.photos[0].url;
    }
    if (booking.listing?.images?.[0]) {
      return booking.listing.images[0];
    }
    if (booking.listing?.image) {
      return booking.listing.image;
    }
    return null;
  };

  const steps = [
    { step: 1, label: t("steps.booking") },
    { step: 2, label: t("steps.type") },
    { step: 3, label: t("steps.evidence") },
    { step: 4, label: t("steps.description") },
  ];

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div 
        className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div 
        className="fixed inset-0 z-[151] flex items-center justify-center p-4"
        style={{ pointerEvents: "none" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ pointerEvents: "auto" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <IoWarningOutline className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t("title")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("subtitle")}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <IoCloseOutline className="text-xl text-slate-500" />
            </button>
          </div>

          {/* Stepper */}
          <div className="px-6 pt-6 pb-4 shrink-0 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {steps.map((s, idx) => (
                <div key={s.step} className="flex flex-col items-center flex-1 relative">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all z-10 ${
                    step >= s.step 
                      ? "bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white shadow-md" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}>
                    {step > s.step ? (
                      <IoCheckmarkCircleOutline className="text-lg" />
                    ) : (
                      <span className="text-sm font-bold">{s.step}</span>
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${step >= s.step ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                  {idx < 3 && (
                    <div className={`absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 -translate-y-1/2 ${
                      step > s.step ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Body scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Étape 1 - Sélection réservation */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t("step1.title")}</h3>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500 mt-4">{t("step1.loading")}</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <IoHomeOutline className="text-3xl text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t("step1.noBookings")}</p>
                    <p className="text-xs text-slate-400 mt-1">{t("step1.noBookingsHint")}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                    {bookings.map((booking) => {
                      const bookingImage = getBookingImage(booking);
                      return (
                        <button
                          key={booking.id}
                          onClick={() => { setSelectedBooking(booking); setStep(2); }}
                          className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all ${
                            selectedBooking?.id === booking.id 
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20" 
                              : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 shadow-sm">
                            {bookingImage && !imgErrors[booking.id] ? (
                              <img 
                                src={pipListingImage(bookingImage)} 
alt={booking.listing?.title || t("step1.listingAlt")}
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(booking.id)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-950/50 dark:to-indigo-950/50">
                                <IoHomeOutline className="text-2xl text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
<p className="font-semibold text-slate-800 dark:text-white truncate">
  {booking.listing?.title || t("step1.defaultTitle")}
</p>                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <IoLocationOutline className="text-xs flex-shrink-0" />
                              <span className="truncate">{booking.listing?.governorate || ""}, {booking.listing?.delegation || ""}</span>
                            </p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <IoCalendarOutline className="text-xs" />
                                {format(new Date(booking.checkIn), "dd MMM yyyy", { locale: fr })}
                              </span>
                              <span>→</span>
                              <span className="flex items-center gap-1">
                                <IoCalendarOutline className="text-xs" />
                                {format(new Date(booking.checkOut), "dd MMM yyyy", { locale: fr })}
                              </span>
                              <span className="flex items-center gap-1 ml-auto">
                                <IoWalletOutline className="text-xs" />
                                {(booking.totalPrice || 0).toLocaleString("fr-FR")} TND
                              </span>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            selectedBooking?.id === booking.id 
                              ? "border-indigo-500 bg-indigo-500" 
                              : "border-slate-300 dark:border-slate-600"
                          }`}>
                            {selectedBooking?.id === booking.id && (
                              <IoCheckmarkCircleOutline className="text-white text-sm" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Étape 2 - Type de litige */}
            {step === 2 && selectedBooking && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t("step2.title")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DISPUTE_TYPES.map((type) => {
                    const Icon = type.icon;
                    const active = selectedType === type.value;
                    return (
                      <button
                        key={type.value}
                        onClick={() => { setSelectedType(type.value); setStep(3); }}
                        className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                          active 
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20" 
                            : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                          active 
                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          <Icon className="text-xl" />
                        </div>
                        <div className="text-left flex-1">
                          <p className={`text-sm font-semibold ${active ? "text-indigo-700 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"}`}>
                            {t(`step2.${type.labelKey}`)}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{t(`step2.${type.descKey}`)}</p>
                        </div>
                        {active && <IoCheckmarkCircleOutline className="text-indigo-500 text-lg flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Étape 3 - Preuves */}
            {step === 3 && selectedType && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t("step3.title")}</h3>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition bg-slate-50 dark:bg-slate-800/30 group"
                >
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))} />
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-950/50 dark:to-indigo-950/50 flex items-center justify-center group-hover:scale-110 transition">
                    <IoCameraOutline className="text-2xl text-indigo-500" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{t("step3.clickToAdd")}</p>
                  <p className="text-xs text-slate-400 mt-1">{t("step3.fileHint")}</p>
                </div>
                {evidencePreviews.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
                      <IoImageOutline className="text-indigo-500" />
                      {evidencePreviews.length} {t("step3.photosAdded")}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {evidencePreviews.map((preview, i) => (
                        <div key={i} className="relative group">
                          <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                            <img src={preview} alt="" className="w-full h-full object-cover" />
                          </div>
                          <button 
                            onClick={() => removeFile(i)} 
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-rose-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {evidencePreviews.length === 0 && (
                  <div className="text-center py-8">
                    <IoImageOutline className="text-4xl text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">{t("step3.noPhotos")}</p>
                    <p className="text-xs text-slate-400">{t("step3.photosOptional")}</p>
                  </div>
                )}
              </div>
            )}

            {/* Étape 4 - Description */}
            {step === 4 && selectedType && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t("step4.title")}</h3>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("step4.placeholder")}
                  rows={8}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button 
              onClick={handleClose} 
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2"
            >
              <IoCloseOutline className="text-lg" />
              {t("buttons.cancel")}
            </button>
            <div className="flex gap-3">
              {step > 1 && step < 4 && (
                <button 
                  onClick={() => setStep(step - 1)} 
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 transition flex items-center gap-2"
                >
                  <IoChevronBack className="text-lg" />
                  {t("buttons.back")}
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${GRADIENT_BUTTON}`}
                >
                  {t("buttons.next")}
                  <IoChevronForwardOutline className="text-lg" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!description.trim() || submitting || uploadingFiles}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${GRADIENT_BUTTON} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting || uploadingFiles ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {uploadingFiles ? t("buttons.uploading") : t("buttons.submitting")}
                    </>
                  ) : (
                    t("buttons.submit")
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}