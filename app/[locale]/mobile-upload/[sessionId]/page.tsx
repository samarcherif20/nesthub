// app/mobile-upload/[sessionId]/page.tsx

"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Camera, Upload, CheckCircle, Loader2 } from "lucide-react";

export default function MobileUploadPage() {
  const { sessionId } = useParams();
  const [files, setFiles] = useState({
    recto: null as File | null,
    verso: null as File | null,
    selfie: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState({
    recto: false,
    verso: false,
    selfie: false,
  });
  
  const handleFileChange = (type: 'recto' | 'verso' | 'selfie') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
    }
  };
  
  const uploadFile = async (type: 'recto' | 'verso' | 'selfie') => {
    const file = files[type];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('sessionId', sessionId as string);
    formData.append('type', type);
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/mobile-upload/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        setUploaded(prev => ({ ...prev, [type]: true }));
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };
  
  const allUploaded = uploaded.recto && uploaded.verso && uploaded.selfie;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Camera className="w-12 h-12 mx-auto mb-3 text-purple-500" />
          <h1 className="text-2xl font-bold">Upload vos documents</h1>
          <p className="text-slate-500">Prenez les 3 photos nécessaires</p>
        </div>
        
        <div className="space-y-4">
          {/* CIN Recto */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold mb-2">📄 CIN - Recto</h3>
            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange('recto')} className="mb-2" />
            {files.recto && !uploaded.recto && (
              <button onClick={() => uploadFile('recto')} disabled={uploading} className="w-full py-2 bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                Uploader
              </button>
            )}
            {uploaded.recto && <div className="text-green-600 flex items-center gap-2"><CheckCircle size={16} /> Uploadé !</div>}
          </div>
          
          {/* CIN Verso */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold mb-2">📄 CIN - Verso</h3>
            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange('verso')} className="mb-2" />
            {files.verso && !uploaded.verso && (
              <button onClick={() => uploadFile('verso')} disabled={uploading} className="w-full py-2 bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                Uploader
              </button>
            )}
            {uploaded.verso && <div className="text-green-600 flex items-center gap-2"><CheckCircle size={16} /> Uploadé !</div>}
          </div>
          
          {/* Selfie */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold mb-2">🤳 Selfie</h3>
            <input type="file" accept="image/*" capture="user" onChange={handleFileChange('selfie')} className="mb-2" />
            {files.selfie && !uploaded.selfie && (
              <button onClick={() => uploadFile('selfie')} disabled={uploading} className="w-full py-2 bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                Uploader
              </button>
            )}
            {uploaded.selfie && <div className="text-green-600 flex items-center gap-2"><CheckCircle size={16} /> Uploadé !</div>}
          </div>
        </div>
        
        {allUploaded && (
          <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium">Tous les documents reçus !</p>
            <p className="text-sm text-slate-500">Vous pouvez fermer cette page</p>
          </div>
        )}
      </div>
    </div>
  );
}