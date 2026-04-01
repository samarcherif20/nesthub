"use client";

import { useState, useRef } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Loader2, X, Upload, Crop as CropIcon } from "lucide-react";

interface ImageCropperProps {
  onCropComplete: (croppedFile: File) => void;
  onClose: () => void;
  side: "recto" | "verso";
}

export default function ImageCropper({
  onCropComplete,
  onClose,
  side,
}: ImageCropperProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 60,
    x: 5,
    y: 20,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (max 5MB)");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result as string);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImage = (): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (!imgRef.current || !completedCrop) {
        reject(new Error("Image non chargée"));
        return;
      }

      const canvas = document.createElement("canvas");
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas non supporté"));
        return;
      }

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Erreur de conversion"));
            return;
          }
          const croppedFile = new File(
            [blob],
            `cin-${side}-${Date.now()}.jpg`,
            {
              type: "image/jpeg",
            },
          );
          resolve(croppedFile);
        },
        "image/jpeg",
        0.95,
      );
    });
  };

  const handleConfirm = async () => {
    if (!completedCrop) return;

    setLoading(true);
    try {
      const croppedFile = await getCroppedImage();
      onCropComplete(croppedFile);
      onClose();
    } catch (error) {
      console.error("Erreur recadrage:", error);
      alert("Erreur lors du recadrage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-[#1E90FF]/30">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Recadrer la CIN - {side === "recto" ? "Recto" : "Verso"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Ajustez le cadre pour inclure toute la carte d'identité
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all hover:scale-110"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!src ? (
            <div
              onClick={() => inputRef.current?.click()}
              className="border-3 border-dashed border-indigo-300 dark:border-indigo-700 rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/10 transition-all group"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Upload size={40} className="text-indigo-500" />
              </div>
              <p className="font-semibold text-lg text-slate-700 dark:text-slate-300">
                Cliquez pour choisir une photo
              </p>
              <p className="text-sm text-slate-500 mt-2">JPG, PNG — Max 5MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Instructions */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
                <CropIcon
                  size={20}
                  className="text-blue-600 dark:text-blue-400 mt-0.5"
                />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">💡 Astuce :</span> Faites
                  glisser les coins du cadre pour recadrer votre CIN.
                  Assurez-vous que toutes les informations sont visibles.
                </div>
              </div>

              {/* Crop area - plus grande */}
              <div className="flex justify-center bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4">
                <div className="max-w-full max-h-[50vh] overflow-auto">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={undefined}
                    className="max-w-full"
                  >
                    <img
                      ref={imgRef}
                      src={src}
                      alt="CIN à recadrer"
                      className="max-w-full rounded-lg shadow-lg"
                      onLoad={() => setLoading(false)}
                    />
                  </ReactCrop>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => setSrc(null)}
                  className="px-5 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Upload size={16} />
                  Changer photo
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!completedCrop || loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-xl hover:shadow-indigo-500/30 text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CropIcon size={18} />
                      Confirmer le recadrage
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
