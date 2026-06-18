// app/components/MobileUploadQR.tsx

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, CheckCircle, Camera, Smartphone } from "lucide-react";

export function MobileUploadQR({ onFilesReceived }: { onFilesReceived: (files: any) => void }) {
  const t = useTranslations("MobileUploadQR");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [polling, setPolling] = useState(true);

  // Créer une session au chargement
  useEffect(() => {
    fetch('/api/mobile-upload/session', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setSessionId(data.sessionId);
        setQrUrl(data.qrUrl);
      });
  }, []);

  // Polling pour vérifier l'état de la session
  useEffect(() => {
    if (!sessionId || !polling) return;
    
    const interval = setInterval(async () => {
      const res = await fetch(`/api/mobile-upload/session?sessionId=${sessionId}`);
      const data = await res.json();
      setSession(data);
      
      if (data.status === 'completed') {
        setPolling(false);
        onFilesReceived?.(data.files);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [sessionId, polling]);

  if (!qrUrl) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const uploadedCount = session?.files ? Object.values(session.files).filter(Boolean).length : 0;

  return (
    <div className="text-center p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
      <Smartphone className="w-12 h-12 mx-auto mb-3 text-purple-500" />
      <h3 className="font-bold text-lg mb-2">{t("title")}</h3>
      <p className="text-sm text-slate-500 mb-4">
        {t("description")}
      </p>
      
      <div className="bg-white p-4 rounded-xl inline-block mx-auto mb-4">
        <QRCodeSVG value={qrUrl} size={180} />
      </div>
      
      <p className="text-xs text-slate-400 break-all px-4">{qrUrl}</p>
      
      {uploadedCount > 0 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>{t("progress")}</span>
            <span className="font-bold">{uploadedCount}/3</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all"
              style={{ width: `${(uploadedCount / 3) * 100}%` }}
            />
          </div>
          {session?.files.recto && <div className="text-green-600 text-xs mt-1">✓ {t("rectoReceived")}</div>}
          {session?.files.verso && <div className="text-green-600 text-xs">✓ {t("versoReceived")}</div>}
          {session?.files.selfie && <div className="text-green-600 text-xs">✓ {t("selfieReceived")}</div>}
        </div>
      )}
      
      {session?.status === 'completed' && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center gap-2">
          <CheckCircle className="text-green-600" />
          <span className="font-medium">{t("allReceived")}</span>
        </div>
      )}
    </div>
  );
}