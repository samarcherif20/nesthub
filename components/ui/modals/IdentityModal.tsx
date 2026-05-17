'use client';
import { useState, useEffect, useRef, useCallback } from "react";
import { 
  IoCloseOutline, 
  IoCloudUploadOutline, 
  IoTrashOutline, 
  IoCheckmarkCircle,
  IoSendOutline,
  IoSunnyOutline,
  IoFlashOutline,
  IoScanOutline,
  IoEyeOutline,
  IoCameraOutline,
  IoInformationCircleOutline
} from "react-icons/io5";
import { RiShieldCheckLine, RiIdCardLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, X, Smartphone, RefreshCw, Camera } from "lucide-react";

// ─── Upload Zone Component ──────────────────────────────────────────────
function UploadZone({
  label, required, preview, onFile, onRemove, disabled = false
}: {
  label: string; required?: boolean; preview: string | null;
  onFile: (f: File) => void; onRemove: () => void;
  disabled?: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const process = useCallback((f: File) => {
    setUploading(true);
    setTimeout(() => { setUploading(false); onFile(f); }, 800);
  }, [onFile]);

  return (
    <div className={`bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-6 border-2 border-dashed transition-all flex flex-col h-full group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center mb-3 sm:mb-4 shrink-0">
        <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <RiIdCardLine className="text-indigo-500 dark:text-indigo-400 text-sm sm:text-base" />
          {label}
        </h3>
        {required && (
          <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
            Requis
          </span>
        )}
      </div>

      {preview ? (
        <div className="relative group/preview rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 flex-1 min-h-[180px] sm:min-h-[200px]">
          <img src={preview} alt={label} className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button 
              onClick={() => inputRef.current?.click()} 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-gray-800 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <IoCloudUploadOutline className="text-base sm:text-lg" />
            </button>
            <button 
              onClick={onRemove} 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <IoTrashOutline className="text-base sm:text-lg" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if(e.dataTransfer.files[0]) process(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl flex-1 min-h-[180px] sm:min-h-[200px] flex flex-col items-center justify-center cursor-pointer transition-all ${
            drag 
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 scale-[1.01]" 
              : "border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/10"
          }`}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.[0]) process(e.target.files[0]); }} />
          {uploading ? (
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          ) : (
            <div className="flex flex-col items-center text-center px-3 sm:px-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2 sm:mb-3">
                <IoCameraOutline className="text-indigo-600 dark:text-indigo-400 text-xl sm:text-2xl" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Cliquer ou déposer</p>
              <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500 mt-1">JPG, PNG (Max 5MB)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tips Component - Version Grid Cards Responsive ──────────────────────────
function TipsCard() {
  const tips = [
    {
      icon: <IoSunnyOutline className="text-amber-500 text-base sm:text-lg md:text-xl" />,
      title: "Éclairage naturel",
      desc: "Privilégiez la lumière du jour",
      descFull: "Privilégiez la lumière du jour pour éviter les ombres portées.",
    },
    {
      icon: <IoFlashOutline className="text-yellow-500 text-base sm:text-lg md:text-xl" />,
      title: "Évitez les reflets",
      desc: "Désactivez le flash",
      descFull: "Désactivez le flash pour éviter tout éblouissement.",
    },
    {
      icon: <IoScanOutline className="text-emerald-500 text-base sm:text-lg md:text-xl" />,
      title: "Cadrage complet",
      desc: "4 coins visibles",
      descFull: "Assurez-vous que les quatre coins de la carte sont visibles.",
    },
    {
      icon: <IoEyeOutline className="text-sky-500 text-base sm:text-lg md:text-xl" />,
      title: "Lisibilité",
      desc: "CIN et nom nets",
      descFull: "Vérifiez que le numéro CIN et le nom sont parfaitement nets.",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-indigo-100 dark:border-indigo-800/30">
      <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-4 sm:mb-5 flex items-center gap-2 text-xs sm:text-sm">
        <RiShieldCheckLine className="text-sm sm:text-base" />
        Conseils photo
      </h4>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {tips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white/50 to-white/30 dark:from-slate-800/50 dark:to-slate-800/30 border border-indigo-100 dark:border-indigo-800/40 p-3 sm:p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg cursor-default"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center flex-shrink-0 shadow-sm mx-auto sm:mx-0">
                {tip.icon}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 mb-0.5 sm:mb-1">
                  {tip.title}
                </p>
                <p className="text-[9px] sm:text-[10px] md:text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed hidden sm:block">
                  {tip.descFull}
                </p>
                <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed block sm:hidden">
                  {tip.desc}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Sync Section (affiché dans le modal) ──────────────────────────────
interface MobileSyncSectionProps {
  onFilesReceived: (rectoFile: File, versoFile: File, selfieFile: File) => void;
  userId: string | null | undefined;
  onClose: () => void;
}

function MobileSyncSection({ onFilesReceived, userId, onClose }: MobileSyncSectionProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    const startSync = async () => {
      setIsLoading(true);
      setUploadProgress(0);

      try {
        const res = await fetch("/api/mobile-upload/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        const data = await res.json();
        const currentSessionId = data.sessionId;

        if (currentSessionId) {
          setSessionId(currentSessionId);
          setQrUrl(data.qrUrl);
          setUploadProgress(0);

          intervalRef.current = setInterval(async () => {
            try {
              const sessionRes = await fetch(`/api/mobile-upload/session?sessionId=${currentSessionId}`);
              
              if (sessionRes.status === 404 || sessionRes.status === 410) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setIsLoading(false);
                return;
              }

              const sessionData = await sessionRes.json();
              const filesCount = Object.keys(sessionData.files || {}).length;
              setUploadProgress(filesCount);

              if (filesCount === 3) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                
                const files = sessionData.files;
                
                const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
                  const byteCharacters = atob(base64);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  return new File([byteArray], filename, { type: mimeType });
                };

                let rectoFile: File | null = null;
                let versoFile: File | null = null;
                let selfieFile: File | null = null;

                if (files.recto?.data) {
                  rectoFile = base64ToFile(files.recto.data, "recto.jpg", files.recto.type);
                }
                if (files.verso?.data) {
                  versoFile = base64ToFile(files.verso.data, "verso.jpg", files.verso.type);
                }
                if (files.selfie?.data) {
                  selfieFile = base64ToFile(files.selfie.data, "selfie.jpg", files.selfie.type);
                }

                if (rectoFile && versoFile && selfieFile) {
                  onFilesReceived(rectoFile, versoFile, selfieFile);
                }
                
                setIsLoading(false);
              }
            } catch (error) {
              console.error("Erreur polling:", error);
            }
          }, 2000);

          setTimeout(() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsLoading(false);
          }, 600000);
        }
      } catch (error) {
        console.error("Erreur création session:", error);
        setIsLoading(false);
      }
    };

    startSync();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, onFilesReceived]);

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 dark:from-indigo-500/5 dark:to-purple-500/0 rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden border border-indigo-200 dark:border-indigo-800/30">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/20 blur-[60px] rounded-full" />
      
      <div className="flex justify-end mb-2">
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-4 border border-emerald-500/30">
            <span className="text-sm">⚡</span>
            <span>Fast Path Optimized</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">Sync via Nexus Mobile</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Utilisez votre smartphone pour une vérification instantanée. Transfert crypté garantissant une confidentialité maximale.
          </p>
          
          {uploadProgress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progression</span>
                <span className="font-mono font-bold">{uploadProgress}/3</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${(uploadProgress / 3) * 100}%` }}
                />
              </div>
              {uploadProgress === 3 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center justify-center md:justify-start gap-1">
                  <IoCheckmarkCircle className="w-4 h-4" />
                  Documents reçus avec succès !
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl shadow-lg relative transition-transform duration-500 hover:scale-105">
            {qrUrl ? (
              <QRCodeSVG value={qrUrl} size={120} level="M" className="sm:w-[140px] sm:h-[140px]" />
            ) : (
              <div className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 hover:opacity-100 transition-opacity rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> 1. Scannez</span>
          <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> 2. Upload</span>
          <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> 3. Auto</span>
        </div>
      </div>
    </div>
  );
}

// ─── Props Interface ──────────────────────────────────────────────────
interface IdentityPageProps {
  onClose?: () => void;
  onSuccess?: (data: { rectoFile: File; versoFile: File | null }) => void;
  initialRejectionReason?: string;
  userId?: string | null | undefined;
}

// ─── MAIN MODAL PAGE ──────────────────────────────────────────────────
export default function IdentityPage({ onClose, onSuccess, initialRejectionReason, userId }: IdentityPageProps = {}) {
  const [showMobileSync, setShowMobileSync] = useState(false);
  const [rectoPreview, setRectoPreview] = useState<string | null>(null);
  const [versoPreview, setVersoPreview] = useState<string | null>(null);
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleFile = (side: "recto" | "verso") => (f: File) => {
    const url = URL.createObjectURL(f);
    if (side === "recto") {
      setRectoPreview(url);
      setRectoFile(f);
    } else {
      setVersoPreview(url);
      setVersoFile(f);
    }
  };

  const handleRemove = (side: "recto" | "verso") => () => {
    if (side === "recto") {
      if (rectoPreview) URL.revokeObjectURL(rectoPreview);
      setRectoPreview(null);
      setRectoFile(null);
    } else {
      if (versoPreview) URL.revokeObjectURL(versoPreview);
      setVersoPreview(null);
      setVersoFile(null);
    }
  };

  const handleMobileFilesReceived = (recto: File, verso: File) => {
    setRectoFile(recto);
    setRectoPreview(URL.createObjectURL(recto));
    setVersoFile(verso);
    setVersoPreview(URL.createObjectURL(verso));
    setShowMobileSync(false); // Fermer la section après réception
  };

  const handleClose = () => {
    if (rectoPreview) URL.revokeObjectURL(rectoPreview);
    if (versoPreview) URL.revokeObjectURL(versoPreview);
    if (onClose) onClose();
  };

  const handleSubmit = async () => {
    if (!rectoFile) return;
    
    setSubmitting(true);
    
    try {
      if (onSuccess) {
        await onSuccess({ rectoFile, versoFile });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setDone(true);
      } else {
        await new Promise(r => setTimeout(r, 2000));
        setDone(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (rectoPreview) URL.revokeObjectURL(rectoPreview);
      if (versoPreview) URL.revokeObjectURL(versoPreview);
    };
  }, [rectoPreview, versoPreview]);

  const isReady = rectoPreview && versoPreview;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-hidden">
        <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-in zoom-in-95 duration-200">
          
          {/* Header avec bouton Mobile Sync */}
          <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/10 dark:to-purple-950/10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <RiShieldCheckLine className="text-white text-base sm:text-xl" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Vérification d'identité</h2>
                <p className="text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                  Carte d'identité nationale
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {userId && !showMobileSync && (
                <button
                  onClick={() => setShowMobileSync(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Sync via Mobile</span>
                  <span className="sm:hidden">Mobile</span>
                </button>
              )}
              <button 
                onClick={handleClose} 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors text-gray-500 dark:text-gray-400"
              >
                <IoCloseOutline className="text-base sm:text-xl" />
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {done ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
                  <IoCheckmarkCircle className="text-white text-3xl sm:text-4xl" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Dossier déposé !</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md">
                  Merci ! Votre carte d'identité a été envoyée à notre équipe. 
                  Vous recevrez une réponse sous 24h.
                </p>
                <button 
                  onClick={handleClose}
                  className="px-5 sm:px-6 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Rejection Alert */}
                {initialRejectionReason && (
                  <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3 border border-red-200 dark:border-red-800/50">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <IoInformationCircleOutline className="text-red-500 text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-400">
                        Dernier refus
                      </p>
                      <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-300 mt-0.5">
                        {initialRejectionReason}
                      </p>
                      <p className="text-[8px] sm:text-[10px] text-red-500/70 dark:text-red-400/70 mt-1">
                        Veuillez soumettre des documents valides et lisibles.
                      </p>
                    </div>
                  </div>
                )}

                {/* Mobile Sync Section - s'affiche quand on clique sur le bouton */}
                {showMobileSync && userId && (
                  <MobileSyncSection 
                    onFilesReceived={handleMobileFilesReceived}
                    userId={userId}
                    onClose={() => setShowMobileSync(false)}
                  />
                )}

                {/* Divider - caché quand la section mobile est affichée */}
                {!showMobileSync && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-slate-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-white dark:bg-slate-900 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Soumission manuelle
                      </span>
                    </div>
                  </div>
                )}

                {/* Upload Zones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <UploadZone 
                    label="Recto (Face avant)" 
                    required 
                    preview={rectoPreview} 
                    onFile={handleFile("recto")} 
                    onRemove={handleRemove("recto")}
                  />
                  <UploadZone 
                    label="Verso (Face arrière)" 
                    required 
                    preview={versoPreview} 
                    onFile={handleFile("verso")} 
                    onRemove={handleRemove("verso")}
                  />
                </div>

                {/* Tips Cards */}
                <TipsCard />
              </div>
            )}
          </div>

          {/* Footer */}
          {!done && (
            <footer className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${rectoPreview ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600"}`} />
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${versoPreview ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600"}`} />
                <span className="text-[8px] sm:text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                  {isReady ? "Prêt pour l'envoi" : "2 fichiers requis"}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={handleClose} 
                  className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !isReady}
                  className="px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] sm:text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Envoi...</span>
                    </>
                  ) : (
                    <>
                      <IoSendOutline className="text-[10px] sm:text-xs" />
                      <span className="hidden sm:inline">Soumettre</span>
                      <span className="sm:hidden">Envoyer</span>
                    </>
                  )}
                </button>
              </div>
            </footer>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-emerald-500 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2">
            <IoCheckmarkCircle className="text-xs sm:text-base" />
            <span className="text-[10px] sm:text-xs font-medium">Documents envoyés avec succès !</span>
          </div>
        </div>
      )}
    </>
  );
}