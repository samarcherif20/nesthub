"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CloudUpload, X, CheckCircle, Loader2, FlipHorizontal } from "lucide-react";
import { FaPassport } from "react-icons/fa";
import { useTranslations } from "next-intl";

interface DocumentUploaderProps {
  file: File | null;
  fileUrl?: string | null;
  onFile: (file: File) => void;
  onRemove: () => void;
  accept?: string;
  placeholder?: string;
  isUploading?: boolean;
}

export function DocumentUploader({
  file,
  fileUrl,
  onFile,
  onRemove,
  accept = "image/*",
  placeholder = "Upload document",
  isUploading = false,
}: DocumentUploaderProps) {
  const t = useTranslations("Inscription");
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Gérer l'aperçu
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (fileUrl) {
      setPreview(fileUrl);
    } else {
      setPreview(null);
    }
  }, [file, fileUrl]);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("Le fichier ne doit pas dépasser 10MB");
      return;
    }
    onFile(selectedFile);
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md flex items-center justify-center bg-purple-500/20 text-purple-500">
            <FlipHorizontal className="w-2.5 h-2.5" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t("passportDocument") || "Passeport"}
          </span>
        </div>
        {file && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-red-500/30 text-slate-500 hover:text-red-500 flex items-center justify-center transition-all"
          >
            <X className="w-2.5 h-2.5" />
          </motion.button>
        )}
      </div>

      <motion.div
        animate={drag ? { scale: 1.02 } : { scale: 1 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFileSelect(f);
        }}
        onClick={() => !isUploading && document.getElementById("document-upload")?.click()}
        className={`
          relative group cursor-pointer overflow-hidden
          rounded-xl transition-all duration-300 border-2 border-dashed h-36
          ${preview
            ? "border-blue-500/40 bg-blue-500/5 dark:border-indigo-500/40 dark:bg-indigo-500/5"
            : drag
              ? "border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/10"
              : "border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-400 dark:hover:border-slate-600"
          }
          ${isUploading ? "opacity-50 cursor-wait" : ""}
        `}
      >
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
        
        {preview ? (
          <>
            <img src={preview} alt="aperçu" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30"
            >
              <CheckCircle className="w-2.5 h-2.5" />
              OK
            </motion.div>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
              <CloudUpload className="w-5 h-5 text-white/80" />
              <span className="text-white text-[10px] font-semibold">
                {t("replace") || "Remplacer"}
              </span>
            </div>
            {!isUploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-sm text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
            <div
              className={`relative flex items-center justify-center w-10 h-7 transition-colors ${
                drag
                  ? "border-blue-400 text-blue-400"
                  : "border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500"
              }`}
            >
              <FaPassport className="w-12 h-12 text-current" />
            </div>
            <p className="text-[12px] text-slate-500 text-center group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400 transition-colors leading-snug">
              <span className="text-blue-500 font-semibold">
                {t("click") || "Cliquez"}
              </span>{" "}
              {t("orDrag") || "ou glissez"}
              <br />
              <span className="text-[11px] text-slate-400 dark:text-slate-600">
                {t("acceptedFormats") || "JPG, PNG, WEBP jusqu'à 10MB"}
              </span>
            </p>
          </div>
        )}
        
        <input
          id="document-upload"
          type="file"
          accept={accept}
          className="hidden"
          disabled={isUploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
            e.target.value = "";
          }}
        />
      </motion.div>
    </div>
  );
}