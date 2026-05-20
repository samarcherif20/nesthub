"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaPassport, FaIdCard } from "react-icons/fa";
import { CheckCircle, Loader2, CloudUpload } from "lucide-react";
import { toast, Toaster } from "sonner";
import { DocumentTypeSelector } from "@/components/ui/DocumentTypeSelector";
import { DocumentUploader } from "@/components/ui/DocumentUploader";

export default function TestPassportPage() {
  const [documentType, setDocumentType] = useState<"cin" | "passport">("passport");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Fonction pour analyser le document
  const analyzeDocument = async () => {
    if (!documentFile) {
      toast.error("Veuillez d'abord sélectionner un fichier");
      return;
    }

    setIsAnalyzing(true);
    setExtractedData(null);

    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append(documentType === "passport" ? "passportFile" : "cinFile", documentFile);
      formData.append("userId", "test-user-123");

      const res = await fetch("/api/registration/upload-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Réponse API:", data);

      if (!res.ok) {
        throw new Error(data.error || "Erreur d'analyse");
      }

      if (data.extracted) {
        setExtractedData(data.extracted);
        setUploadedUrl(data.urls?.[documentType]);
        toast.success(`${documentType === "passport" ? "Passeport" : "Carte d'identité"} analysé avec succès !`);
      } else {
        toast.warning("Aucune donnée extraite, veuillez remplir manuellement");
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de l'analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset quand le type change
  const handleDocumentTypeChange = (type: "cin" | "passport") => {
    setDocumentType(type);
    setDocumentFile(null);
    setExtractedData(null);
    setUploadedUrl(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-10 px-4">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-4">
            {documentType === "passport" ? (
              <FaPassport className="w-8 h-8 text-blue-600" />
            ) : (
              <FaIdCard className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Test Upload {documentType === "passport" ? "Passeport" : "Carte d'Identité"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Testez l'OCR et l'upload de document ici
          </p>
        </div>

        {/* Document Type Selector */}
        <DocumentTypeSelector 
          value={documentType} 
          onChange={handleDocumentTypeChange} 
        />

        {/* Zone d'upload avec DocumentUploader */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
          <div className="p-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              📸 Upload du {documentType === "passport" ? "passeport" : "CIN"}
            </label>
            
            {/* 👇 DocumentUploader intégré ici */}
            <DocumentUploader
              file={documentFile}
              fileUrl={uploadedUrl}
              onFile={setDocumentFile}
              onRemove={() => {
                setDocumentFile(null);
                setExtractedData(null);
                setUploadedUrl(null);
              }}
              isUploading={isAnalyzing}
              accept="image/*"
              placeholder={documentType === "passport" ? "Upload du passeport" : "Upload de la carte d'identité"}
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={analyzeDocument}
                disabled={!documentFile || isAnalyzing}
                className="flex-1 bg-gradient-to-r from-sky-500 to-purple-500 hover:from-sky-600 hover:to-purple-600 disabled:from-sky-300 disabled:to-purple-300 text-white font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    Analyser le {documentType === "passport" ? "passeport" : "CIN"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Résultats de l'OCR */}
        {extractedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Données extraites du {documentType === "passport" ? "passeport" : "CIN"}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Prénom</label>
                  <p className="text-slate-900 dark:text-white font-medium mt-1">
                    {extractedData.firstName || "—"}
                  </p>
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Nom</label>
                  <p className="text-slate-900 dark:text-white font-medium mt-1">
                    {extractedData.lastName || "—"}
                  </p>
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    {documentType === "passport" ? "N° Passeport" : "N° CIN"}
                  </label>
                  <p className="text-slate-900 dark:text-white font-medium mt-1 font-mono">
                    {extractedData.documentNumber || extractedData.passportNumber || "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Date de naissance</label>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {extractedData.dateOfBirth || "—"}
                  </p>
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Date d'expiration</label>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {extractedData.expiryDate || "—"}
                  </p>
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Pays</label>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {extractedData.country || "—"}
                  </p>
                </div>
              </div>

              {uploadedUrl && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <label className="text-xs font-semibold text-slate-500 uppercase">URL du fichier uploadé</label>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 break-all">
                    {uploadedUrl}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            📝 <span className="font-semibold">Instructions :</span>
          </p>
          <ul className="text-xs text-amber-600 dark:text-amber-400 mt-2 space-y-1 list-disc list-inside">
            <li>Sélectionnez le type de document (CIN ou Passeport)</li>
            <li>Cliquez ou glissez-déposez une photo claire du document</li>
            <li>L'API va extraire automatiquement nom, prénom, numéro, dates</li>
            <li>Vérifiez que votre API Google Vision est configurée</li>
            <li>Les fichiers sont uploadés vers Vercel Blob (max 10MB)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}