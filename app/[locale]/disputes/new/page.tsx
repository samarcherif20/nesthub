// app/[locale]/disputes/new/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoCloudUploadOutline,
  IoCloseOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoChatbubblesOutline,
  IoScaleOutline,
  IoHeadsetOutline,
  IoDocumentTextOutline,
  IoHandLeftOutline,
  IoSparklesOutline,
  IoBuildOutline,
  IoVolumeHighOutline,
  IoCardOutline,
  IoCalendarClearOutline,
  IoEllipsisHorizontalOutline,
} from "react-icons/io5";
import { MdOutlineCleaningServices } from "react-icons/md";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AlertBanner from "@/components/ui/Alert";

const pipListingImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

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

const DISPUTE_TYPES = [
  { value: "DAMAGE", label: "Dommages matériels", icon: IoBuildOutline, color: "from-red-500 to-red-600" },
  { value: "CLEANING", label: "Propreté", icon: MdOutlineCleaningServices, color: "from-amber-500 to-amber-600" },
  { value: "MISREPRESENTATION", label: "Logement non conforme", icon: IoHomeOutline, color: "from-orange-500 to-orange-600" },
  { value: "NOISE", label: "Bruit / nuisance", icon: IoVolumeHighOutline, color: "from-purple-500 to-purple-600" },
  { value: "PAYMENT", label: "Problème de paiement", icon: IoCardOutline, color: "from-green-500 to-emerald-600" },
  { value: "CANCELLATION", label: "Annulation abusive", icon: IoCalendarClearOutline, color: "from-blue-500 to-blue-600" },
  { value: "OTHER", label: "Autre", icon: IoEllipsisHorizontalOutline, color: "from-gray-500 to-gray-600" },
];

export default function NewDisputePage() {
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
  const [step, setStep] = useState(1);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCompletedBookings();
  }, []);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      evidencePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [evidencePreviews]);

  const fetchCompletedBookings = async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
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

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    addFiles(imageFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const imageFiles = files.filter(f => f.type.startsWith("image/"));
      addFiles(imageFiles);
      // Reset input value to allow selecting same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const addFiles = (files: File[]) => {
    // Validate file size (max 10MB)
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    
    if (invalidFiles.length > 0) {
      setAlert({ type: "error", message: `${invalidFiles.length} fichier(s) dépassent la limite de 10MB` });
    }
    
    if (validFiles.length === 0) return;
    
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setEvidencePreviews(prev => [...prev, ...newPreviews]);
    setEvidenceFiles(prev => [...prev, ...validFiles]);
    
    // Auto advance to step 5 only if we're at step 3 or 4 and we have files
    if (step === 3 || step === 4) {
      setStep(5);
    }
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
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            urls.push(data.url);
          }
        } else {
          console.error("Upload failed for", file.name);
        }
      } catch (error) {
        console.error("Upload error for", file.name, error);
      }
    }
    
    setUploadingFiles(false);
    return urls;
  };

  const handleSubmit = async () => {
    if (!selectedBooking || !selectedType || !description) {
      setAlert({ type: "error", message: "Veuillez remplir tous les champs obligatoires" });
      return;
    }

    setSubmitting(true);
    try {
      let evidenceUrls: string[] = [];
      if (evidenceFiles.length > 0) {
        evidenceUrls = await uploadFiles(evidenceFiles);
      }
      
      const token = await getToken({ template: "my-app-template" });
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
        setAlert({ type: "success", message: "Litige soumis avec succès !" });
        setTimeout(() => router.push("/disputes"), 2000);
      } else {
        const error = await res.json();
        setAlert({ type: "error", message: error.error || "Erreur lors de la soumission" });
      }
    } catch (error) {
      setAlert({ type: "error", message: "Erreur de connexion" });
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedToStep5 = () => {
    return evidencePreviews.length > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff]">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  const completedBookings = bookings.filter(b => b.status === "COMPLETED");
  const selectedTypeData = DISPUTE_TYPES.find(t => t.value === selectedType);
  const SelectedIcon = selectedTypeData?.icon || IoEllipsisHorizontalOutline;

  return (
    <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950">
      {alert && (
        <div className="fixed top-20 right-8 z-50">
          <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-4 transition-colors"
          >
            <IoArrowBackOutline className="text-lg" />
            Retour
          </button>
          <h1 className="font-headline font-bold text-4xl tracking-tight text-slate-900 dark:text-white mb-2">
            Ouvrir un litige
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl">
            Nous sommes là pour vous aider à résoudre tout problème rencontré lors de votre séjour.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column - Form */}
          <div className="lg:col-span-8 space-y-10">
            {/* Step 1: Select Booking */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                  step >= 1 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                }`}>1</div>
                <h2 className="font-headline text-xl font-semibold text-slate-900 dark:text-white">
                  Sélectionnez la réservation
                </h2>
              </div>
              <div className="space-y-3">
                {completedBookings.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500">Aucune réservation terminée trouvée</p>
                  </div>
                ) : (
                  completedBookings.map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => { setSelectedBooking(booking); setStep(2); }}
                      className={`w-full p-5 rounded-xl border-2 transition-all text-left flex items-center gap-5 ${
                        selectedBooking?.id === booking.id
                          ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md"
                          : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                        {booking.listing.images?.[0] ? (
                          <img
                            src={pipListingImage(booking.listing.images[0])}
                            alt={booking.listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IoHomeOutline className="text-slate-400 text-2xl" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-headline font-bold text-lg text-indigo-600 dark:text-indigo-400">
                          {booking.listing.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-500 dark:text-slate-400 text-sm">
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="text-sm" />
                            {format(new Date(booking.checkIn), "dd MMM yyyy", { locale: fr })} - {format(new Date(booking.checkOut), "dd MMM yyyy", { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1">
                            <IoPersonOutline className="text-sm" />
                            {booking.tenant.firstName} {booking.tenant.lastName}
                          </span>
                        </div>
                      </div>
                      {selectedBooking?.id === booking.id && (
                        <IoCheckmarkCircleOutline className="text-indigo-500 text-2xl" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Step 2: Problem Type */}
            {selectedBooking && step >= 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    step >= 2 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}>2</div>
                  <h2 className="font-headline text-xl font-semibold text-slate-900 dark:text-white">
                    Quel est le type de problème ?
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {DISPUTE_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => { setSelectedType(type.value); setStep(3); }}
                        className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                          selectedType === type.value
                            ? `border-indigo-500 bg-gradient-to-br ${type.color} text-white shadow-lg`
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 hover:shadow-md"
                        }`}
                      >
                        <Icon className={`text-3xl ${
                          selectedType === type.value ? "text-white" : "text-indigo-500"
                        }`} />
                        <span className={`text-xs font-semibold uppercase tracking-wider ${
                          selectedType === type.value ? "text-white" : "text-slate-600 dark:text-slate-300"
                        }`}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedTypeData && selectedType === selectedTypeData.value && (
                  <div className={`mt-3 p-3 rounded-lg bg-gradient-to-r ${selectedTypeData.color} text-white text-sm text-center animate-pulse flex items-center justify-center gap-2`}>
                    <SelectedIcon className="text-lg" />
                    Vous avez sélectionné : {selectedTypeData.label}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Upload Evidence */}
            {selectedType && step >= 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    step >= 3 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}>3</div>
                  <h2 className="font-headline text-xl font-semibold text-slate-900 dark:text-white">
                    Téléchargez vos preuves
                  </h2>
                </div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                    dragActive
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
                      : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                    <IoCloudUploadOutline className="text-indigo-500 text-3xl" />
                  </div>
                  <p className="font-headline font-semibold text-slate-700 dark:text-slate-300">
                    Glissez-déposez vos photos ici
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    ou cliquez pour parcourir vos fichiers (Max 10MB par fichier)
                  </p>
                </div>
                {evidencePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {evidencePreviews.map((preview, idx) => (
                      <div key={idx} className="relative group">
                        <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                          <img src={preview} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition"
                        >
                          <IoCloseOutline />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Next button for step 3 */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setStep(4)}
                    disabled={!canProceedToStep5()}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Description */}
            {selectedType && step >= 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    step >= 4 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}>4</div>
                  <h2 className="font-headline text-xl font-semibold text-slate-900 dark:text-white">
                    Décrivez la situation
                  </h2>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Veuillez donner le plus de détails possible sur l'incident (dates, personnes impliquées, séquence des événements)..."
                  rows={6}
                  className="w-full p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition"
                />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Montant demandé (TND) - <span className="font-normal text-slate-400">optionnel</span>
                  </label>
                  <input
                    type="number"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-56 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Si vous demandez un remboursement partiel, indiquez le montant souhaité.
                  </p>
                </div>
                {/* Navigation buttons for step 4 */}
                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    disabled={!description.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Review & Submit */}
            {step >= 5 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm bg-indigo-600 text-white">
                    5
                  </div>
                  <h2 className="font-headline text-xl font-semibold text-slate-900 dark:text-white">
                    Vérification et soumission
                  </h2>
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white">Récapitulatif du litige</h3>
                    <button 
                      onClick={() => setStep(1)} 
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Modifier la réservation
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Logement</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedBooking?.listing.title}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Dates</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {selectedBooking && format(new Date(selectedBooking.checkIn), "dd/MM/yyyy")} - {selectedBooking && format(new Date(selectedBooking.checkOut), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Type de litige</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selectedTypeData?.label}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Preuves</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{evidencePreviews.length} fichier(s)</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-slate-500 text-sm mb-1">Description</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                      {description}
                    </p>
                  </div>
                  
                  {requestedAmount && (
                    <div>
                      <p className="text-slate-500 text-sm mb-1">Montant demandé</p>
                      <p className="font-bold text-indigo-600">{parseFloat(requestedAmount).toLocaleString("fr-FR")} TND</p>
                    </div>
                  )}
                </div>
                
                {/* Navigation buttons for step 5 */}
                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(4)}
                    className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || uploadingFiles}
                    className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {submitting || uploadingFiles ? (
                      <span className="flex items-center gap-2">
                        <LoadingSpinner size="sm" color="white" />
                        {uploadingFiles ? "Upload des fichiers..." : "Soumission..."}
                      </span>
                    ) : (
                      "Soumettre le litige"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-28">
              <h3 className="font-headline font-bold text-xl text-indigo-600 dark:text-indigo-400 mb-4">
                Processus de résolution
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                Notre équipe de médiation intervient pour garantir une solution équitable et rapide.
              </p>
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <IoShieldCheckmarkOutline className="text-indigo-500 text-xl" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Examen de la demande</p>
                    <p className="text-xs text-slate-500 mt-1">Nous analysons vos preuves sous 24h ouvrées.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <IoChatbubblesOutline className="text-indigo-500 text-xl" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Médiation neutre</p>
                    <p className="text-xs text-slate-500 mt-1">Nous contactons la seconde partie pour obtenir sa version.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <IoScaleOutline className="text-indigo-500 text-xl" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Résolution finale</p>
                    <p className="text-xs text-slate-500 mt-1">Une décision est prise et les fonds sont ajustés si nécessaire.</p>
                  </div>
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">Besoin d'aide immédiate ?</h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition">
                    <IoHeadsetOutline className="text-indigo-500 text-xl" />
                    <span className="text-sm font-medium">Contacter le support</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition">
                    <IoDocumentTextOutline className="text-indigo-500 text-xl" />
                    <span className="text-sm font-medium">Lire la politique de litige</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl text-white">
              <IoShieldCheckmarkOutline className="text-4xl opacity-50 mb-3" />
              <h3 className="font-headline font-bold text-lg mb-2">Protection Nesthub</h3>
              <p className="text-sm opacity-90 leading-relaxed">
                Toutes vos transactions sont protégées par notre fonds de garantie Atlas. Dormez sur vos deux oreilles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}