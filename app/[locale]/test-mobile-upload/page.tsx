// app/test-mobile-upload/page.tsx

"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Loader2,
  CheckCircle,
  Camera,
  Smartphone,
  Trash2,
  Upload,
} from "lucide-react";

export default function TestMobileUploadPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [polling, setPolling] = useState(true);
  const [receivedFiles, setReceivedFiles] = useState<{
    recto?: boolean;
    verso?: boolean;
    selfie?: boolean;
  }>({});
  const [previewImages, setPreviewImages] = useState<{
    recto?: string;
    verso?: string;
    selfie?: string;
  }>({});
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

  // Créer une session au chargement
  const createSession = async () => {
    const res = await fetch("/api/mobile-upload/session", { method: "POST" });
    const data = await res.json();
    setSessionId(data.sessionId);
    setQrUrl(data.qrUrl);
    setReceivedFiles({});
    setPreviewImages({});
    setPolling(true);
    setOcrResult(null);
  };

  useEffect(() => {
    createSession();
  }, []);

  // Polling pour vérifier l'état de la session
  useEffect(() => {
    if (!sessionId || !polling) return;

    const interval = setInterval(async () => {
      const res = await fetch(
        `/api/mobile-upload/session?sessionId=${sessionId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setSession(data);

        // Mettre à jour le statut des fichiers reçus
        const newFiles: any = {};
        if (data.files?.recto?.data) newFiles.recto = true;
        if (data.files?.verso?.data) newFiles.verso = true;
        if (data.files?.selfie?.data) newFiles.selfie = true;
        setReceivedFiles(newFiles);

        // Convertir les données base64 en URLs pour l'affichage
        const newPreviews: any = {};
        if (data.files?.recto?.data) {
          newPreviews.recto = `data:${data.files.recto.type || "image/jpeg"};base64,${data.files.recto.data}`;
        }
        if (data.files?.verso?.data) {
          newPreviews.verso = `data:${data.files.verso.type || "image/jpeg"};base64,${data.files.verso.data}`;
        }
        if (data.files?.selfie?.data) {
          newPreviews.selfie = `data:${data.files.selfie.type || "image/jpeg"};base64,${data.files.selfie.data}`;
        }
        setPreviewImages(newPreviews);

        if (data.status === "completed") {
          setPolling(false);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, polling]);

  const resetSession = () => {
    createSession();
  };

  const handleSubmitToOCR = async () => {
    if (!sessionId) return;

    setOcrProcessing(true);
    setOcrResult(null);

    try {
      const sessionRes = await fetch(
        `/api/mobile-upload/session?sessionId=${sessionId}`,
      );
      const sessionData = await sessionRes.json();

      if (
        !sessionData.files?.recto ||
        !sessionData.files?.verso ||
        !sessionData.files?.selfie
      ) {
        alert("Veuillez uploader les 3 photos d'abord");
        setOcrProcessing(false);
        return;
      }

      const formData = new FormData();

      // Convertir recto
      if (sessionData.files.recto?.data) {
        const byteCharacters = atob(sessionData.files.recto.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: sessionData.files.recto.type || "image/jpeg",
        });
        formData.append("cinRecto", blob, "recto.jpg");
      }

      // Convertir verso
      if (sessionData.files.verso?.data) {
        const byteCharacters = atob(sessionData.files.verso.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: sessionData.files.verso.type || "image/jpeg",
        });
        formData.append("cinVerso", blob, "verso.jpg");
      }

      // Convertir selfie (profilePhoto)
      if (sessionData.files.selfie?.data) {
        const byteCharacters = atob(sessionData.files.selfie.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: sessionData.files.selfie.type || "image/jpeg",
        });
        formData.append("profilePhoto", blob, "selfie.jpg");
      }

      console.log("📤 Envoi à l'OCR...");
      const ocrRes = await fetch("/api/registration/upload-cin", {
        method: "POST",
        body: formData,
      });

      const ocrData = await ocrRes.json();
      console.log("📊 Résultat OCR:", ocrData);

      if (ocrRes.ok) {
        setOcrResult(ocrData.extracted || ocrData);
      } else {
        alert("Erreur OCR: " + (ocrData.error || "Erreur inconnue"));
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'envoi à l'OCR");
    } finally {
      setOcrProcessing(false);
    }
  };

  if (!qrUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const uploadedCount = Object.values(previewImages).filter(Boolean).length;
  const allFilesReceived = uploadedCount === 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Camera className="w-16 h-16 mx-auto mb-4 text-purple-500" />
          <h1 className="text-3xl font-bold mb-2">Test Upload Mobile</h1>
          <p className="text-slate-500">
            Testez l'upload de photos depuis votre téléphone
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Colonne gauche: QR Code pour le mobile */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 text-center">
            <Smartphone className="w-10 h-10 mx-auto mb-3 text-purple-500" />
            <h2 className="text-xl font-bold mb-2">1. Scannez le QR code</h2>
            <p className="text-sm text-slate-500 mb-4">
              Ouvrez l'appareil photo de votre téléphone et scannez ce code
            </p>

            <div className="bg-white p-4 rounded-xl inline-block mx-auto mb-4 shadow-md">
              <QRCodeSVG value={qrUrl} size={200} />
            </div>

            <div className="text-xs text-slate-400 break-all bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
              {qrUrl}
            </div>

            <button
              onClick={resetSession}
              className="mt-4 px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 transition flex items-center justify-center gap-2 mx-auto"
            >
              <Trash2 size={14} />
              Nouvelle session
            </button>
          </div>

          {/* Colonne droite: Statut des uploads */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">2. État des uploads</h2>

            <div className="space-y-4">
              {/* Progression */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progression:</span>
                  <span className="font-bold">{uploadedCount}/3</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${(uploadedCount / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* Aperçu des images */}
              {(previewImages.recto ||
                previewImages.verso ||
                previewImages.selfie) && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-sm font-medium mb-3">
                    📸 Aperçu des photos:
                  </p>
                  <div className="flex gap-3 flex-wrap justify-center">
                    {previewImages.recto && (
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border-2 border-green-500 shadow-md">
                          <img
                            src={previewImages.recto}
                            alt="Recto"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[10px] mt-1 font-medium text-green-600">
                          Recto ✓
                        </p>
                      </div>
                    )}
                    {previewImages.verso && (
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border-2 border-green-500 shadow-md">
                          <img
                            src={previewImages.verso}
                            alt="Verso"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[10px] mt-1 font-medium text-green-600">
                          Verso ✓
                        </p>
                      </div>
                    )}
                    {previewImages.selfie && (
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border-2 border-green-500 shadow-md">
                          <img
                            src={previewImages.selfie}
                            alt="Selfie"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[10px] mt-1 font-medium text-green-600">
                          Selfie ✓
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status des fichiers */}
              <div className="space-y-2">
                <div
                  className={`p-2 rounded-lg text-sm text-center ${receivedFiles.recto ? "bg-green-100 dark:bg-green-900/30 text-green-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
                >
                  {receivedFiles.recto
                    ? "✅ CIN Recto reçu"
                    : "⏳ En attente du Recto..."}
                </div>
                <div
                  className={`p-2 rounded-lg text-sm text-center ${receivedFiles.verso ? "bg-green-100 dark:bg-green-900/30 text-green-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
                >
                  {receivedFiles.verso
                    ? "✅ CIN Verso reçu"
                    : "⏳ En attente du Verso..."}
                </div>
                <div
                  className={`p-2 rounded-lg text-sm text-center ${receivedFiles.selfie ? "bg-green-100 dark:bg-green-900/30 text-green-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
                >
                  {receivedFiles.selfie
                    ? "✅ Selfie reçu"
                    : "⏳ En attente du Selfie..."}
                </div>
              </div>

              {/* Bouton Valider pour OCR */}
              {allFilesReceived && (
                <div className="mt-4">
                  <button
                    onClick={handleSubmitToOCR}
                    disabled={ocrProcessing}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                  >
                    {ocrProcessing ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Upload size={20} />
                    )}
                    {ocrProcessing
                      ? "Traitement OCR..."
                      : "Valider & Lancer OCR"}
                  </button>
                </div>
              )}

              {/* Résultat OCR */}
              {ocrResult && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="font-bold mb-2">📊 Résultat OCR:</p>
                  <pre className="text-xs overflow-auto max-h-40">
                    {JSON.stringify(ocrResult, null, 2)}
                  </pre>
                </div>
              )}

              {allFilesReceived && !ocrResult && !ocrProcessing && (
                <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-bold text-green-700 dark:text-green-300">
                    ✓ Toutes les photos reçues !
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Cliquez sur "Valider" pour lancer l'OCR
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <h3 className="font-bold mb-2">📱 Instructions:</h3>
          <ol className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
            <li>1. Scannez le QR code avec votre téléphone</li>
            <li>2. Prenez les 3 photos demandées (CIN recto, verso, selfie)</li>
            <li>
              3. Cliquez sur "Uploader" pour chaque photo depuis le mobile
            </li>
            <li>4. Les photos apparaîtront ici en temps réel</li>
            <li>
              5. Cliquez sur "Valider & Lancer OCR" pour traiter les photos
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
