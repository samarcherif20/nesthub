// app/mobile-upload/[sessionId]/page.tsx

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";

// ============================================================
// ICONS
// ============================================================

function IconChevronLeft({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  );
}

function IconBadge({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 7h-5V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM9 12c.83 0 1.5.67 1.5 1.5S9.83 15 9 15s-1.5-.67-1.5-1.5S8.17 12 9 12zm3 6H6v-.75c0-1 2-1.5 3-1.5s3 .5 3 1.5V18zm1-9h-2V4h2v5zm2 3.5c0-.28.22-.5.5-.5h2c.28 0 .5.22.5.5s-.22.5-.5.5h-2c-.28 0-.5-.22-.5-.5zm3 2c0 .28-.22.5-.5.5h-2c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h2c.28 0 .5.22.5.5zM18 18h-3c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h3c.28 0 .5.22.5.5s-.22.5-.5.5z" />
    </svg>
  );
}

function IconAddPhoto({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z" />
    </svg>
  );
}

function IconFace({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 11.75a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zm6 0a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37a9.974 9.974 0 008.37 4.73H18c.35 0 .69-.02 1.03-.07.3.85.47 1.77.47 2.72 0 3.44-2.17 6.36-5.22 7.49A7.946 7.946 0 0112 20z" />
    </svg>
  );
}

function IconCheckCircle({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

function IconShield({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </svg>
  );
}

function IconUpload({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
    </svg>
  );
}

function IconDiscard({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
    </svg>
  );
}

function IconDelete({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

function IconRetake({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  );
}

function IconArrowForward({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
    </svg>
  );
}

// ============================================================
// LOADING SPINNER
// ============================================================

function LoadingSpinner() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === "dark" : true;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white dark:bg-slate-950">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-3 border-gray-200 dark:border-slate-800" />
          <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-sky-500 border-r-purple-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 ${
        isDark ? "bg-slate-950" : "bg-white"
      }`}
    >
      <style>{`
        @keyframes spinLoader { to { transform: rotate(360deg) } }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 20px rgba(113,42,226,.3) }
          50% { box-shadow: 0 0 50px rgba(0,92,171,.6) }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>

      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-3 border-gray-200 dark:border-slate-800" />
        <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-sky-500 border-r-purple-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-10 h-10">
            <Image
              src="/logo/logo.png"
              alt="Logo"
              fill
              className="object-contain scale-[2]"
            />
          </div>
        </div>
      </div>

      <div
        className="flex flex-col items-center gap-2"
        style={{ animation: "fadeInUp .5s ease both .2s" }}
      >
        <p
          className={`text-sm font-semibold tracking-[.15em] uppercase ${isDark ? "text-white/70" : "text-gray-700"}`}
        >
          Chargement de l'interface...
        </p>
        <p
          className={`text-[10px] tracking-[.3em] uppercase ${isDark ? "text-white/25" : "text-gray-400"}`}
        >
          Préparation de votre session
        </p>
      </div>

      <div className="flex gap-2 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-purple-600"
            style={{
              animation: `pulseGlow 1.4s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// LOADER
// ============================================================

function Loader({ message = "Envoi en cours..." }: { message?: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-xl rounded-3xl ${isDark ? "bg-slate-950/90" : "bg-white/90"}`}
    >
      <div className="relative w-14 h-14 mb-4">
        <div
          className={`absolute inset-0 border-4 rounded-full ${isDark ? "border-slate-800" : "border-gray-100"}`}
        />
        <div className="absolute inset-0 border-4 border-transparent border-t-sky-500 border-r-purple-600 rounded-full animate-spin" />
      </div>
      <p
        className={`text-sm font-bold ${isDark ? "text-gray-200" : "text-gray-800"}`}
      >
        {message}
      </p>
    </div>
  );
}

// ============================================================
// TYPES
// ============================================================

type DocumentType = "recto" | "verso" | "selfie";

interface DocumentState {
  file: File | null;
  preview: string | null;
  status: "idle" | "captured" | "uploading" | "uploaded" | "error";
  errorMessage?: string;
}

const STEP_ORDER: DocumentType[] = ["recto", "verso", "selfie"];

const DOC_CONFIGS: Record<
  DocumentType,
  {
    title: string;
    subtitle: string;
    helper: string;
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
    ringClass: string;
    gradientFrom: string;
    gradientTo: string;
    capture: "environment" | "user";
    buttonLabel: string;
    stepNumber: number;
    isSelfie?: boolean;
  }
> = {
  recto: {
    title: "Pièce d'identité",
    subtitle: "Face avant de votre carte",
    helper:
      "Cadrez bien le recto de votre pièce d'identité dans un endroit bien éclairé",
    icon: <IconBadge className="w-6 h-6" />,
    colorClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-50 dark:bg-sky-950/30",
    ringClass: "ring-sky-500/20",
    gradientFrom: "#0ea5e9",
    gradientTo: "#3b82f6",
    capture: "environment",
    buttonLabel: "Photographier le recto",
    stepNumber: 1,
  },
  verso: {
    title: "Pièce d'identité",
    subtitle: "Face arrière de votre carte",
    helper:
      "Retournez votre carte et capturez le verso avec tous les détails visibles",
    icon: <IconBadge className="w-6 h-6" />,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-950/30",
    ringClass: "ring-purple-500/20",
    gradientFrom: "#8b5cf6",
    gradientTo: "#a855f7",
    capture: "environment",
    buttonLabel: "Photographier le verso",
    stepNumber: 2,
  },
  selfie: {
    title: "Selfie Live",
    subtitle: "Reconnaissance biométrique",
    helper:
      "Placez votre visage bien centré dans le cercle, dans un endroit lumineux",
    icon: <IconFace className="w-6 h-6" />,
    colorClass: "text-indigo-600 dark:text-indigo-400",
    bgClass: "bg-indigo-50 dark:bg-indigo-950/30",
    ringClass: "ring-indigo-500/20",
    gradientFrom: "#4f46e5",
    gradientTo: "#6366f1",
    capture: "user",
    buttonLabel: "Lancer la vérification",
    stepNumber: 3,
    isSelfie: true,
  },
};

// ============================================================
// STEP CARD COMPONENT
// ============================================================

interface StepCardProps {
  type: DocumentType;
  document: DocumentState;
  onCapture: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

function StepCard({
  type,
  document: doc,
  onCapture,
  onRemove,
  fileInputRef,
}: StepCardProps) {
  const config = DOC_CONFIGS[type];
  const isUploaded = doc.status === "uploaded";
  const isUploading = doc.status === "uploading";
  const isCaptured = doc.status === "captured";
  const isError = doc.status === "error";
  const isSelfie = type === "selfie";
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden transition-all duration-500
        ${
          isUploaded
            ? "bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-800 shadow-[0_0_40px_rgba(16,185,129,0.08)]"
            : isError
              ? "bg-white dark:bg-slate-950 border border-rose-200 dark:border-rose-800 shadow-[0_0_40px_rgba(244,63,94,0.08)]"
              : "bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 shadow-[0_8px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
        }
      `}
    >
      {isUploading && <Loader message={`Envoi ${config.title}…`} />}

      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background: isUploaded
            ? "linear-gradient(90deg, #10b981, #34d399)"
            : isError
              ? "linear-gradient(90deg, #f43f5e, #fb7185)"
              : `linear-gradient(90deg, ${config.gradientFrom}, ${config.gradientTo})`,
        }}
      />

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isUploaded
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                  : isError
                    ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                    : `${config.bgClass} ${config.colorClass}`
              }`}
            >
              {isUploaded ? (
                <IconCheckCircle className="w-6 h-6" />
              ) : (
                config.icon
              )}
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base tracking-tight flex items-center gap-2">
                {config.title}
                {isSelfie && (
                  <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent text-sm">
                    ●
                  </span>
                )}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                {isUploaded
                  ? "Document validé avec succès"
                  : isError
                    ? doc.errorMessage
                    : isCaptured
                      ? "Photo prête — continuez ou reprenez"
                      : config.subtitle}
              </p>
            </div>
          </div>

          {isUploaded && (
            <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide uppercase border border-emerald-200 dark:border-emerald-800">
              ✓ Validé
            </span>
          )}
          {isCaptured && (
            <span className="bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide uppercase border border-sky-200 dark:border-sky-800">
              Prêt
            </span>
          )}
          {isError && (
            <span className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide uppercase border border-rose-200 dark:border-rose-800">
              Erreur
            </span>
          )}
        </div>

        {/* Helper text */}
        {!doc.preview && (
          <p className="text-gray-400 dark:text-gray-500 text-xs leading-relaxed mb-5 pl-0.5">
            {config.helper}
          </p>
        )}

        {/* Photo area */}
        {doc.preview ? (
          <div className="space-y-3">
            <div className="relative w-full flex justify-center">
              <div
                className={`relative overflow-hidden shadow-lg ${
                  isSelfie
                    ? "w-full aspect-[1.586/1] rounded-xl flex items-center justify-center bg-gradient-to-br from-sky-50 to-purple-50 dark:from-sky-950/20 dark:to-purple-950/20"
                    : "w-full aspect-[1.586/1] rounded-xl"
                }`}
              >
                {isSelfie ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                      <img
                        src={doc.preview}
                        alt={config.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <img
                    src={doc.preview}
                    alt={config.title}
                    className="w-full h-full object-cover"
                  />
                )}
                {isUploaded && (
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none rounded-[inherit]" />
                )}
                {isUploaded && (
                  <div className="absolute bottom-3 right-3 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <IconCheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </div>

            {(isCaptured || isError) && (
              <div className="flex gap-2.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 rounded-xl bg-gray-50 dark:bg-slate-800/80 text-gray-700 dark:text-gray-200 
                             font-semibold text-xs flex items-center justify-center gap-2 
                             active:scale-[0.97] transition-all border border-gray-200 dark:border-slate-700
                             hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <IconRetake className="w-4 h-4" />
                  Reprendre
                </button>
                <button
                  onClick={onRemove}
                  className="py-3 px-5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 
                             font-semibold text-xs flex items-center justify-center gap-1.5 
                             active:scale-[0.97] transition-all border border-rose-200/60 dark:border-rose-800/40
                             hover:bg-rose-100 dark:hover:bg-rose-950/50"
                >
                  <IconDelete className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Capture zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative w-full overflow-hidden cursor-pointer 
                active:scale-[0.98] transition-all duration-200 group
                flex items-center justify-center
                aspect-[1.586/1] rounded-xl bg-gray-50 dark:bg-slate-800/40
                border border-dashed border-gray-300 dark:border-slate-600
                hover:border-sky-300 dark:hover:border-sky-500
              `}
            >
              {/* Content inside */}
              <div className="relative flex flex-col items-center justify-center gap-3">
                {isSelfie ? (
                  <>
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-950/50 dark:to-purple-950/50 flex items-center justify-center">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center ${config.bgClass}`}
                        >
                          <IconFace
                            className={`w-7 h-7 text-gray-400 dark:text-gray-500`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                        Appuyez pour capturer
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">
                        Caméra frontale
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bgClass}`}
                    >
                      <IconAddPhoto
                        className={`w-6 h-6 text-gray-400 dark:text-gray-500`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                        Appuyez pour capturer
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">
                        Caméra arrière
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={config.capture}
        className="hidden"
        onChange={onCapture}
      />
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function MobileUploadPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [mode, setMode] = useState<"inscription" | "reapply">("inscription");
  const [steps, setSteps] = useState<DocumentType[]>([
    "recto",
    "verso",
    "selfie",
  ]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [allUploaded, setAllUploaded] = useState(false);

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [animState, setAnimState] = useState<"idle" | "exit" | "enter">("idle");
  const [animDirection, setAnimDirection] = useState<"forward" | "backward">(
    "forward",
  );
  const [pendingStepIndex, setPendingStepIndex] = useState<number | null>(null);

  const [documents, setDocuments] = useState<
    Record<DocumentType, DocumentState>
  >({
    recto: { file: null, preview: null, status: "idle" },
    verso: { file: null, preview: null, status: "idle" },
    selfie: { file: null, preview: null, status: "idle" },
  });

  const fileInputRefs = {
    recto: useRef<HTMLInputElement>(null),
    verso: useRef<HTMLInputElement>(null),
    selfie: useRef<HTMLInputElement>(null),
  };

  const currentType = steps[currentStepIndex];
  const currentDocument = documents[currentType];

  const isTransitioning = animState !== "idle";

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(
          `/api/mobile-upload/session?sessionId=${sessionId}`,
        );
        const data = await res.json();
        setMode(data.mode || "inscription");
        // Si mode reapply, enlève le selfie des étapes
        if (data.mode === "reapply") {
          setSteps(["recto", "verso"]);
        } else {
          setSteps(["recto", "verso", "selfie"]);
        }
      } catch (error) {
        console.error("Erreur récupération session:", error);
      }
    };
    fetchSession();
  }, [sessionId]);
  const goToStep = useCallback(
    (nextIndex: number) => {
      if (
        nextIndex < 0 ||
        nextIndex > steps.length - 1 ||
        nextIndex === currentStepIndex ||
        animState !== "idle"
      )
        return;

      const dir = nextIndex > currentStepIndex ? "forward" : "backward";
      setAnimDirection(dir);
      setPendingStepIndex(nextIndex);
      setAnimState("exit");

      setTimeout(() => {
        setCurrentStepIndex(nextIndex);
        setAnimState("enter");

        setTimeout(() => {
          setAnimState("idle");
          setPendingStepIndex(null);
        }, 350);
      }, 280);
    },
    [currentStepIndex, animState, steps.length],
  );

  const goNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) goToStep(currentStepIndex + 1);
  }, [currentStepIndex, goToStep, steps.length]);

  // Déjà correcte, mais vérifie :
  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) goToStep(currentStepIndex - 1);
  }, [currentStepIndex, goToStep]);
  // ✅ Celle-ci est bonne car elle utilise currentStepIndex > 0

  const handleCapture = useCallback(
    (type: DocumentType) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        setDocuments((prev) => ({
          ...prev,
          [type]: {
            file: file,
            preview: reader.result as string,
            status: "captured",
          },
        }));
        const stepIndex = steps.indexOf(type);
        if (stepIndex < steps.length - 1) {
          setTimeout(() => goToStep(stepIndex + 1), 800);
        }
      };
      reader.readAsDataURL(file);
      if (fileInputRefs[type].current) {
        fileInputRefs[type].current!.value = "";
      }
    },
    [goToStep],
  );

  const handleRemove = useCallback((type: DocumentType) => {
    setDocuments((prev) => ({
      ...prev,
      [type]: { file: null, preview: null, status: "idle" },
    }));
  }, []);

  const handleDiscardAll = useCallback(() => {
    setDocuments({
      recto: { file: null, preview: null, status: "idle" },
      verso: { file: null, preview: null, status: "idle" },
      selfie: { file: null, preview: null, status: "idle" },
    });
    setAllUploaded(false);
    setUploadProgress(0);
    if (currentStepIndex !== 0) goToStep(0);
  }, [currentStepIndex, goToStep]);

  const handleUploadAll = useCallback(async () => {
    try {
      const sessionCheck = await fetch(
        `/api/mobile-upload/session?sessionId=${sessionId}`,
      );
      if (!sessionCheck.ok) {
        alert("La session a expiré. Veuillez re-scanner le QR code.");
        router.push("/");
        return;
      }
    } catch (error) {
      console.error("Session check failed:", error);
      alert("Erreur de connexion. Veuillez réessayer.");
      return;
    }
    const toUpload = Object.entries(documents).filter(
      ([, doc]) => doc.status === "captured" && doc.file,
    ) as [DocumentType, DocumentState][];

    if (toUpload.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < toUpload.length; i++) {
      const [type, doc] = toUpload[i];

      setDocuments((prev) => ({
        ...prev,
        [type]: { ...prev[type], status: "uploading" },
      }));

      const formData = new FormData();
      formData.append("sessionId", sessionId);
      formData.append("type", type);

      // ✅ CORRECTION: Forcer le bon type MIME
      let fileToUpload = doc.file!;
      if (fileToUpload.type === "application/octet-stream") {
        console.log("⚠️ Correction du type MIME pour:", type);
        const buffer = await fileToUpload.arrayBuffer();
        fileToUpload = new File(
          [buffer],
          fileToUpload.name.replace(".octet-stream", ".jpg"),
          {
            type: "image/jpeg",
          },
        );
      }
      formData.append("file", fileToUpload);

      try {
        const res = await fetch("/api/mobile-upload/upload", {
          method: "POST",
          body: formData,
        });

        let responseData;
        try {
          responseData = await res.json();
        } catch (e) {
          console.error("Failed to parse JSON:", e);
          responseData = {
            error: "Réponse invalide du serveur",
            success: false,
          };
        }

        console.log(`Upload ${type}:`, {
          status: res.status,
          data: responseData,
        });

        if (res.ok && responseData.success) {
          successCount++;
          setDocuments((prev) => ({
            ...prev,
            [type]: { ...prev[type], status: "uploaded" },
          }));
        } else {
          const errorMsg = responseData.error || "Erreur lors de l'envoi";
          errors.push(`${type}: ${errorMsg}`);
          setDocuments((prev) => ({
            ...prev,
            [type]: {
              ...prev[type],
              status: "error",
              errorMessage: errorMsg,
            },
          }));
        }
      } catch (error) {
        console.error(`Network error for ${type}:`, error);
        errors.push(`${type}: Erreur de connexion`);
        setDocuments((prev) => ({
          ...prev,
          [type]: {
            ...prev[type],
            status: "error",
            errorMessage: "Erreur de connexion au serveur",
          },
        }));
      }

      setUploadProgress(Math.round(((i + 1) / toUpload.length) * 100));
    }

    setUploading(false);

    if (successCount === 3) {
      setAllUploaded(true);
      setTimeout(() => {
        router.push("/dashboard/owner/profile");
      }, 2000);
    } else if (errors.length > 0) {
      console.error("Upload errors:", errors);
    }
  }, [documents, sessionId, router]);

  const uploadedCount = Object.values(documents).filter(
    (d) => d.status === "uploaded",
  ).length;
  const hasAnyContent = Object.values(documents).some(
    (d) => d.status !== "idle",
  );
  const allStepsReady = steps.every((type) => {
    const s = documents[type].status;
    return s === "captured";
  });

  const displayedStepIndex =
    pendingStepIndex !== null && animState === "enter"
      ? pendingStepIndex
      : currentStepIndex;

  let cardAnimClass = "";
  if (animState === "exit") {
    cardAnimClass =
      animDirection === "forward" ? "card-exit-left" : "card-exit-right";
  } else if (animState === "enter") {
    cardAnimClass =
      animDirection === "forward" ? "card-enter-right" : "card-enter-left";
  } else {
    cardAnimClass = "card-stable";
  }

  const barPct = allUploaded
    ? 100
    : ((currentStepIndex + (currentDocument.status !== "idle" ? 0.5 : 0)) /
        steps.length) *
      100;

  // Show loading spinner while mounting
  if (!mounted) {
    return <LoadingSpinner />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden transition-colors duration-300 ${
        isDark ? "bg-slate-950" : "bg-white"
      }`}
    >
      <style jsx global>{`
        @keyframes exitLeft {
          from {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          to {
            transform: translateX(-40px) scale(0.96);
            opacity: 0;
          }
        }
        @keyframes exitRight {
          from {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          to {
            transform: translateX(40px) scale(0.96);
            opacity: 0;
          }
        }
        @keyframes enterFromRight {
          from {
            transform: translateX(40px) scale(0.96);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes enterFromLeft {
          from {
            transform: translateX(-40px) scale(0.96);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes stableIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .card-exit-left {
          animation: exitLeft 280ms cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }
        .card-exit-right {
          animation: exitRight 280ms cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }
        .card-enter-right {
          animation: enterFromRight 350ms cubic-bezier(0, 0, 0.2, 1) forwards;
        }
        .card-enter-left {
          animation: enterFromLeft 350ms cubic-bezier(0, 0, 0.2, 1) forwards;
        }
        .card-stable {
          animation: stableIn 400ms cubic-bezier(0, 0, 0.2, 1) forwards;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Background - Clean light/dark */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-purple-950/20 transition-opacity duration-500" />
        <div className="absolute top-[-20%] left-[-15%] w-[70%] h-[70%] bg-sky-200/30 dark:bg-sky-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[70%] h-[70%] bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-100/20 dark:bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* HEADER */}
        <header
          className={`sticky top-0 w-full z-50 backdrop-blur-2xl border-b ${isDark ? "bg-slate-950/80 border-white/5" : "bg-white/80 border-gray-100"}`}
        >
          <div className="flex justify-between items-center px-4 py-3.5 max-w-lg mx-auto">
            <button
              onClick={() => {
                if (currentStepIndex > 0 && !isTransitioning) goPrev();
                else router.back();
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors active:scale-95 ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"}`}
            >
              <IconChevronLeft
                className={`w-5 h-5 ${isDark ? "text-white" : "text-gray-700"}`}
              />
            </button>

            <div className="lg:hidden flex items-center gap-3">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16">
                <Image
                  src="/logo/logo.png"
                  alt="NestHub Logo"
                  fill
                  className="object-contain scale-[3.75] translate-y-2.75"
                />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-transparent bg-clip-text translate-y-2.75">
                N E S T H U B
              </h2>
            </div>

            <div className="w-10 h-10" />
          </div>

          {/* Progress line */}
          <div className={`h-[2px] ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${barPct}%`,
                background: allUploaded
                  ? "#10b981"
                  : "linear-gradient(90deg, #0ea5e9, #8b5cf6)",
              }}
            />
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-grow px-4 sm:px-5 pt-6 pb-48 max-w-lg mx-auto w-full">
          <div className="mb-7">
            <div className="text-center">
              <h1
                className={`text-2xl sm:text-[1.7rem] font-bold tracking-tight leading-tight ${isDark ? "text-white" : "text-gray-800"}`}
              >
                {DOC_CONFIGS[steps[displayedStepIndex]].title}
              </h1>
              <p
                className={`text-sm mt-1 font-medium ${isDark ? "text-white/60" : "text-gray-500"}`}
              >
                Étape {displayedStepIndex + 1} sur {steps.length} ·{" "}
                {DOC_CONFIGS[steps[displayedStepIndex]].subtitle}
              </p>
            </div>

            {uploadedCount > 0 && (
              <div className="mt-4 flex justify-center">
                <div
                  className={`px-4 py-2 rounded-full inline-flex items-center gap-2 border ${isDark ? "bg-emerald-950/40 border-emerald-800/50" : "bg-emerald-50 border-emerald-200"}`}
                >
                  <IconCheckCircle className="w-4 h-4 text-emerald-500" />
                  <span
                    className={`text-xs font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                  >
                    {uploadedCount}/{steps.length} document
                    {uploadedCount > 1 ? "s" : ""} envoyé
                    {uploadedCount > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Animated card */}
          <div className="relative" style={{ minHeight: 420 }}>
            <div key={currentStepIndex} className={cardAnimClass}>
              <StepCard
                type={currentType}
                document={currentDocument}
                onCapture={handleCapture(currentType)}
                onRemove={() => handleRemove(currentType)}
                fileInputRef={fileInputRefs[currentType]}
              />
            </div>
          </div>

          {/* Mini steps */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {steps.map((type, index) => {
              const doc = documents[type];
              const cfg = DOC_CONFIGS[type];
              const isCurrent = index === displayedStepIndex;

              return (
                <button
                  key={type}
                  onClick={() => !isTransitioning && goToStep(index)}
                  className={`
                    flex-1 rounded-xl border px-3 py-2.5 text-left transition-all duration-300
                    ${
                      isCurrent
                        ? isDark
                          ? "bg-white/5 border-white/10 shadow-sm"
                          : "bg-white border-gray-200 shadow-sm"
                        : isDark
                          ? "bg-white/5 border-white/5"
                          : "bg-white/50 border-gray-100"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        doc.status === "uploaded"
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500"
                          : doc.status === "captured"
                            ? `${cfg.bgClass} ${cfg.colorClass}`
                            : isDark
                              ? "bg-white/5 text-gray-600"
                              : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {doc.status === "uploaded" ? (
                        <IconCheckCircle className="w-4 h-4" />
                      ) : (
                        <div className="scale-75">{cfg.icon}</div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-[11px] font-bold truncate leading-tight ${isDark ? "text-white" : "text-gray-800"}`}
                      >
                        {cfg.title}
                      </p>
                      <p
                        className={`text-[10px] truncate ${isDark ? "text-gray-500" : "text-gray-400"}`}
                      >
                        {doc.status === "uploaded"
                          ? "✓ Validé"
                          : doc.status === "captured"
                            ? "Prêt"
                            : "En attente"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Security note */}
          <div
            className={`mt-8 flex items-start gap-3 px-1 py-4 rounded-xl ${isDark ? "bg-white/5 border border-white/5" : "bg-gray-50/80 border border-gray-100"}`}
          >
            <IconShield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5 ml-3" />
            <p
              className={`text-xs leading-relaxed pr-3 ${isDark ? "text-white/50" : "text-gray-500"}`}
            >
              Vos données sont chiffrées de bout en bout et traitées uniquement
              pour la vérification d'identité, conformément au RGPD.
            </p>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="fixed bottom-0 left-0 w-full z-40 pb-[env(safe-area-inset-bottom)]">
          <div
            className={`bg-gradient-to-t pt-8 pb-6 px-4 sm:px-5 ${isDark ? "from-slate-950 via-slate-950/95 to-transparent" : "from-white via-white/95 to-transparent"}`}
          >
            <div className="max-w-lg mx-auto space-y-3">
              {!uploading &&
                !allUploaded &&
                currentStepIndex < steps.length - 1 &&
                (currentDocument.status === "captured" ||
                  currentDocument.status === "uploaded") && (
                  <button
                    onClick={goNext}
                    disabled={isTransitioning}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    Continuer
                    <IconArrowForward className="w-5 h-5" />
                  </button>
                )}

              {!uploading &&
                !allUploaded &&
                currentStepIndex === steps.length - 1 &&
                allStepsReady && (
                  <button
                    onClick={handleUploadAll}
                    disabled={isTransitioning}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    <IconUpload className="w-5 h-5" />
                    Envoyer tous les documents
                  </button>
                )}

              {uploading && (
                <div
                  className={`w-full py-4 rounded-xl border backdrop-blur-xl flex flex-col items-center gap-2.5 px-6 shadow-lg ${isDark ? "bg-slate-950/90 border-white/5" : "bg-white border-gray-200"}`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative w-6 h-6 flex-shrink-0">
                      <div
                        className={`absolute inset-0 border-[3px] rounded-full ${isDark ? "border-slate-800" : "border-gray-100"}`}
                      />
                      <div className="absolute inset-0 border-[3px] border-transparent border-t-sky-500 border-r-purple-600 rounded-full animate-spin" />
                    </div>
                    <div className="flex-1">
                      <div
                        className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-gray-100"}`}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold tabular-nums ${isDark ? "text-white" : "text-gray-800"}`}
                    >
                      {uploadProgress}%
                    </span>
                  </div>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Envoi des documents…
                  </p>
                </div>
              )}

              {allUploaded && !uploading && (
                <div className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20">
                  <IconCheckCircle className="w-5 h-5" />
                  Tous les documents envoyés !
                </div>
              )}

              {hasAnyContent && !uploading && !allUploaded && (
                <button
                  onClick={handleDiscardAll}
                  disabled={isTransitioning}
                  className={`w-full py-3.5 rounded-xl border font-medium text-sm tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${isDark ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10" : "bg-white/60 border-gray-200 text-gray-600 hover:bg-white"}`}
                >
                  <IconDiscard className="w-4 h-4" />
                  Tout effacer
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
