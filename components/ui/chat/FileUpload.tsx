// components/ui/chat/FileUpload.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Image, X, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function FileUpload({ onFileSelect, onClose, isOpen }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Limiter à 5 fichiers max
    const filesToUpload = acceptedFiles.slice(0, 5);
    
    // Créer les previews pour les images
    const newPreviews = filesToUpload.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return '';
    });
    
    setPreviews(newPreviews);
    onFileSelect(filesToUpload);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc', '.docx'],
    }
  });

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full mb-2 left-0 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50">
      <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-sm font-semibold">Joindre un fichier</span>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div
        {...getRootProps()}
        className={`m-3 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' 
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isDragActive ? 'Déposez les fichiers ici' : 'Glissez ou cliquez pour ajouter'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
        Images, PDF, DOC (max 10MB)
        </p>
      </div>

      {previews.length > 0 && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-medium mb-2">Aperçu ({previews.length})</p>
          <div className="flex gap-2 flex-wrap">
            {previews.map((preview, i) => (
              preview && (
                <img key={i} src={preview} className="w-12 h-12 rounded-lg object-cover" />
              )
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="p-3 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Envoi en cours...</span>
        </div>
      )}
    </div>
  );
}