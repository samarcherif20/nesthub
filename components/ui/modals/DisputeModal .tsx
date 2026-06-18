// components/ui/DisputeModal.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  IoCloseOutline,
  IoCloudUploadOutline,
  IoDocumentTextOutline,
  IoImageOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoWalletOutline,
  IoHomeOutline,
  IoBuildOutline,
  IoScaleOutline,
  IoChatbubblesOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { MdOutlineCleaningServices } from "react-icons/md";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RiUserVoiceLine } from "react-icons/ri";

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
    image?: string;
  };
  tenant?: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
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

// Catégories de litige
const DISPUTE_TYPES = [
  {
    value: "DAMAGES",
    labelKey: "damages",
    icon: <IoBuildOutline className="text-sm" />,
  },
  {
    value: "CLEANLINESS",
    labelKey: "cleanliness",
    icon: <MdOutlineCleaningServices className="text-sm" />,
  },
  {
    value: "PAYMENT",
    labelKey: "payment",
    icon: <IoWalletOutline className="text-sm" />,
  },
  {
    value: "NOISE",
    labelKey: "noise",
    icon: <RiUserVoiceLine className="text-sm" />,
  },
  {
    value: "AMENITIES",
    labelKey: "amenities",
    icon: <IoHomeOutline className="text-sm" />,
  },
  {
    value: "OTHER",
    labelKey: "other",
    icon: <IoChatbubblesOutline className="text-sm" />,
  },
];

const getImageUrl = (url: string) => {
  if (!url) return "";
  if (url.includes("/api/listings/image")) return url;
  return `/api/listings/image?url=${encodeURIComponent(url)}`;
};

export function DisputeModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedBookingId,
}: DisputeModalProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const t = useTranslations("DisputeModal");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priority, setPriority] = useState("MEDIUM"); // 🔥 AJOUTÉ
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filesPreview, setFilesPreview] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      fetchCompletedBookings();
    }
  }, [isOpen, mounted]);

  useEffect(() => {
    if (preselectedBookingId && bookings.length > 0 && !selectedBooking) {
      const booking = bookings.find((b) => b.id === preselectedBookingId);
      if (booking) setSelectedBooking(booking);
    }
  }, [preselectedBookingId, bookings, selectedBooking]);

  useEffect(() => {
    return () => {
      filesPreview.forEach((url) => {
        if (url !== "pdf") URL.revokeObjectURL(url);
      });
    };
  }, [filesPreview]);

  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "info" | "warning" = "info",
    ) => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  const fetchCompletedBookings = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        "/api/bookings?role=owner&status=COMPLETED&pageSize=50",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      const bookingsList = Array.isArray(data) ? data : data.bookings || [];
      const completedOnly = bookingsList.filter(
        (b: Booking) => b.status === "COMPLETED",
      );
      setBookings(completedOnly);
    } catch (error) {
      console.error("Erreur chargement réservations:", error);
      showToast(t("toast.loadError"), "error");
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
    const validFiles = newFiles.filter(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf",
    );
    const invalidFiles = newFiles.filter(
      (f) => !f.type.startsWith("image/") && f.type !== "application/pdf",
    );

    if (invalidFiles.length > 0) {
      showToast(
        t("toast.unsupportedFiles", { count: invalidFiles.length }),
        "error",
      );
    }
    if (validFiles.length === 0) return;

    const newPreviews = validFiles.map((file) => {
      if (file.type.startsWith("image/")) return URL.createObjectURL(file);
      return "pdf";
    });

    setFiles((prev) => [...prev, ...validFiles]);
    setFilesPreview((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    if (filesPreview[index] !== "pdf") URL.revokeObjectURL(filesPreview[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilesPreview((prev) => prev.filter((_, i) => i !== index));
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
      showToast(t("toast.noBooking"), "error");
      return;
    }
    if (!selectedCategory) {
      showToast(t("toast.noCategory"), "error");
      return;
    }
    if (!subject.trim()) {
      showToast(t("toast.noSubject"), "error");
      return;
    }
    if (!description.trim()) {
      showToast(t("toast.noDescription"), "error");
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
          type: selectedCategory,
          subject: subject,
          description: description,
          evidence: evidenceUrls,
          priority: priority, // 🔥 Envoyer la priorité choisie
        }),
      });

      if (res.ok) {
        showToast(t("toast.success"), "success");
        onClose();
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        const error = await res.json();
        showToast(error.error || t("toast.submitError"), "error");
      }
    } catch (error) {
      showToast(t("toast.connectionError"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <AnimatePresence>
        {toast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100]">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold shadow-xl backdrop-blur-sm border ${
                toast.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300"
                  : toast.type === "error"
                    ? "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300"
                    : "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-300"
              }`}
            >
              {toast.type === "success" ? (
                <IoCheckmarkCircleOutline className="text-base" />
              ) : (
                <IoAlertCircleOutline className="text-base" />
              )}
              <span>{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 p-1 rounded-lg hover:bg-black/5"
              >
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
        className="w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between sticky top-0 z-10 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b border-indigo-100 dark:border-indigo-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-purple-500 flex items-center justify-center shadow-md">
              <IoScaleOutline className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("info.title")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("info.description")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/50 dark:hover:bg-slate-800 transition-colors"
          >
            <IoCloseOutline className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto space-y-6 pb-6">
          {/* Booking Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t("booking.label")}
            </label>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("booking.noBookings")}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {bookings.map((booking) => {
                  const listingImageUrl =
                    booking.listing.image || booking.listing.images?.[0];
                  const tenantName =
                    booking.tenant?.username ||
                    booking.tenant?.name ||
                    t("booking.tenant");

                  const isSelected = selectedBooking?.id === booking.id;

                  return (
                    <div
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`cursor-pointer rounded-xl border-2 transition-all p-3 ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md"
                          : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                          {listingImageUrl ? (
                            <img
                              src={getImageUrl(listingImageUrl)}
                              alt={booking.listing.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "";
                                e.currentTarget.parentElement?.classList.add(
                                  "flex",
                                  "items-center",
                                  "justify-center",
                                );
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <IoHomeOutline className="text-slate-400 text-xl" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                              {booking.listing.title}
                            </p>
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              {booking.totalPrice.toLocaleString()} TND
                            </p>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <IoCalendarOutline className="text-[10px]" />
                            {format(new Date(booking.checkIn), "dd MMM yyyy", {
                              locale: fr,
                            })}{" "}
                            →{" "}
                            {format(new Date(booking.checkOut), "dd MMM yyyy", {
                              locale: fr,
                            })}
                            <span className="ml-1 text-[10px]">
                              ({booking.nights} nuits)
                            </span>
                          </p>

                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <IoPersonOutline className="text-[10px]" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {tenantName}
                            </span>
<span className="text-[10px]">({t("booking.tenantLabel")})</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t("category.label")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DISPUTE_TYPES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`group relative px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 ${
                    selectedCategory === cat.value
                      ? "bg-gradient-to-r from-sky-600 to-purple-600 text-white shadow-lg shadow-sky-500/25 scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-[1.01]"
                  }`}
                >
                  <span
                    className={`text-base ${selectedCategory === cat.value ? "text-white" : "text-slate-400 dark:text-slate-500"}`}
                  >
                    {cat.icon}
                  </span>
                  <span className="flex-1 text-left">
                    {t(`category.${cat.labelKey}`)}
                  </span>
                  {selectedCategory === cat.value && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-md"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 🔥 PRIORITY SELECT - AJOUTÉ */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t("priority.label")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPriority("LOW")}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  priority === "LOW"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {t("priority.low")}
              </button>
              <button
                onClick={() => setPriority("MEDIUM")}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  priority === "MEDIUM"
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {t("priority.medium")}
              </button>
              <button
                onClick={() => setPriority("HIGH")}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  priority === "HIGH"
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {t("priority.high")}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {t("priority.description")}
            </p>
          </div>

          {/* Subject Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t("subject.label")}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("subject.placeholder")}
              className="w-full rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t("description.label")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm resize-none"
              placeholder={t("description.placeholder")}
              rows={5}
            />
          </div>

          {/* Drag & Drop Upload */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t("evidence.label")}
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/30 dark:bg-slate-800/30"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <IoCloudUploadOutline className="text-2xl text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("evidence.dragText")}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  {t("evidence.formats")}
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {t("evidence.browse")}
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

            {filesPreview.length > 0 && (
              <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2">
                      {filesPreview[index] === "pdf" ? (
                        <IoDocumentTextOutline className="text-red-500 text-base" />
                      ) : (
                        <IoImageOutline className="text-indigo-500 text-base" />
                      )}
                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <IoCloseOutline className="text-sm text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {t("buttons.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              uploadingFiles ||
              !selectedBooking ||
              !selectedCategory ||
              !subject ||
              !description
            }
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 shadow-md shadow-indigo-500/25 hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
          >
            {submitting || uploadingFiles ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {uploadingFiles
                  ? t("buttons.uploading")
                  : t("buttons.submitting")}
              </>
            ) : (
              t("buttons.submit")
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}