"use client";

import { useState, useRef } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Loader2 } from "lucide-react";

interface ImageCropperProps {
  onCropComplete: (croppedFile: File) => void;
  onClose: () => void;
  side: "recto" | "verso";
}

export default function ImageCropper({ onCropComplete, onClose, side }: ImageCropperProps) {
  const [src, setSrc] = useState<string | null>(null);
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
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getCroppedImage = (): Promise<File> => {
    return new Promise((resolve) => {
      if (!imgRef.current || !completedCrop) return;

      const canvas = document.createElement("canvas");
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], `cin-${side}-cropped.jpg`, {
          type: "image/jpeg",
        });
        resolve(croppedFile);
      }, "image/jpeg", 0.95);
    });
  };

  const handleConfirm = async () => {
    const croppedFile = await getCroppedImage();
    onCropComplete(croppedFile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-[#1E90FF]/20 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">
              Recadrer la CIN {side === "recto" ? "Recto" : "Verso"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ajustez le cadre pour inclure toute la carte d'identité
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!src ? (
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-[#1E90FF]/30 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-[#1E90FF] transition-all"
            >
              <div className="w-16 h-16 bg-[#1E90FF]/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">📷</span>
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Cliquez pour choisir une photo
              </p>
              <p className="text-xs text-slate-500 mt-1">JPG, PNG — Max 5MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                💡 Faites glisser les coins du cadre pour recadrer votre CIN
              </div>

              {/* Crop area */}
              <div className="flex justify-center max-h-96 overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={undefined}
                >
                  <img
                    ref={imgRef}
                    src={src}
                    alt="CIN à recadrer"
                    className="max-w-full rounded-lg"
                  />
                </ReactCrop>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSrc(null)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Changer photo
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!completedCrop}
                  className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white font-bold py-2.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  ✅ Confirmer le recadrage
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}