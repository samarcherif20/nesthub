"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Smartphone,
  Camera,
  RefreshCw,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Wifi,
  WifiOff,
  FileImage,
  File,
  AlertCircle,
} from "lucide-react";

interface UploadedFile {
  url: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface SessionData {
  id: string;
  expiresAt: number;
  files: {
    recto?: UploadedFile;
    verso?: UploadedFile;
    selfie?: UploadedFile;
  };
  status: "waiting" | "uploading" | "completed";
}

export default function TestMobileUploadPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localIp, setLocalIp] = useState<string>("");

  // Create a new session
  const createSession = useCallback(async () => {
    setIsCreating(true);
    setError(null);
    setPolling(true);
    
    try {
      const response = await fetch("/api/mobile-upload/session", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("✅ Session created:", data);
      
      setSessionId(data.sessionId);
      setQrUrl(data.qrUrl);
      setLocalIp(data.localIp || "unknown");
      setSession(null);
    } catch (err) {
      console.error("❌ Error creating session:", err);
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Poll for session updates
  useEffect(() => {
    if (!sessionId || !polling) return;

    let isMounted = true;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/mobile-upload/session?sessionId=${sessionId}`);
        
        if (response.status === 404 || response.status === 410) {
          if (isMounted) {
            setError("Session expired. Please create a new one.");
            setPolling(false);
          }
          return;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        if (isMounted) {
          setSession(data);
          console.log("📊 Session update:", {
            files: data.files,
            status: data.status,
            rectoType: data.files?.recto?.type,
            versoType: data.files?.verso?.type,
            selfieType: data.files?.selfie?.type,
          });
          
          // Stop polling when completed
          if (data.status === "completed") {
            setPolling(false);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
        if (isMounted) {
          setError("Error checking session status");
        }
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [sessionId, polling]);

  // Create session on mount
  useEffect(() => {
    createSession();
  }, [createSession]);

  const filesCount = session?.files ? Object.values(session.files).filter(Boolean).length : 0;
  const isComplete = filesCount === 3;
  const expiresAt = session?.expiresAt ? new Date(session.expiresAt) : null;
  const timeLeft = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000)) : 0;

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (type: string) => {
    setImageErrors(prev => ({ ...prev, [type]: true }));
  };

  // Helper pour formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper pour obtenir la couleur du type MIME
  const getMimeTypeColor = (mimeType: string): string => {
    if (mimeType === 'image/jpeg') return 'text-blue-500';
    if (mimeType === 'image/png') return 'text-green-500';
    if (mimeType === 'image/webp') return 'text-purple-500';
    if (mimeType === 'application/octet-stream') return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Mobile Upload Test
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test the QR code upload functionality - No signup required
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
            <button
              onClick={createSession}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN - QR Code */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <QrCodeIcon className="w-5 h-5 text-blue-500" />
                1. Scan QR Code
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Open your phone's camera and scan this code
              </p>
            </div>
            
            <div className="p-6 text-center">
              {isCreating ? (
                <div className="py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-slate-500">Creating session...</p>
                </div>
              ) : qrUrl ? (
                <>
                  <div className="bg-white p-4 rounded-xl inline-block mx-auto mb-4 shadow-lg border border-slate-200">
                    <QRCodeSVG value={qrUrl} size={220} level="H" />
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-4">
                    <p className="text-xs text-slate-500 break-all font-mono">
                      {qrUrl}
                    </p>
                  </div>
                  
                  {localIp && localIp !== 'localhost' && (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 mb-4">
                      <Wifi className="w-4 h-4" />
                      <span>Server IP: {localIp}</span>
                    </div>
                  )}
                  
                  {localIp === 'localhost' && (
                    <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400 mb-4">
                      <WifiOff className="w-4 h-4" />
                      <span>Using localhost - May not work on mobile!</span>
                    </div>
                  )}
                  
                  <button
                    onClick={createSession}
                    disabled={isCreating}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New Session
                  </button>
                </>
              ) : (
                <button
                  onClick={createSession}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium"
                >
                  Create Session
                </button>
              )}
            </div>
            
            {/* Session Info */}
            {sessionId && expiresAt && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Session ID:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{sessionId.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-slate-500">Expires in:</span>
                  <span className={timeLeft < 5 ? "text-red-500 font-medium" : "text-slate-700 dark:text-slate-300"}>
                    {timeLeft} minutes
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Upload Status */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-500" />
                2. Upload Status
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Photos will appear here as you upload them from your phone
              </p>
            </div>
            
            <div className="p-6">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Progress:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{filesCount}/3</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${(filesCount / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* File Cards with TYPE information */}
              <div className="space-y-4">
                {[
                  { type: "recto", label: "CIN - Front", icon: "🪪", color: "blue" },
                  { type: "verso", label: "CIN - Back", icon: "🪪", color: "purple" },
                  { type: "selfie", label: "Selfie Photo", icon: "🤳", color: "green" },
                ].map(({ type, label, icon, color }) => {
                  const file = session?.files?.[type as keyof typeof session.files];
                  const hasFile = !!file;
                  const hasError = imageErrors[type];
                  const isOctetStream = file?.type === 'application/octet-stream';
                  
                  return (
                    <div
                      key={type}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        hasFile 
                          ? isOctetStream
                            ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/20"
                            : "border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{icon}</span>
                            <span className="font-medium text-slate-900 dark:text-white">{label}</span>
                          </div>
                          {hasFile ? (
                            isOctetStream ? (
                              <AlertCircle className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                          )}
                        </div>
                        
                        {/* File Info Card - Affiche le type MIME */}
                        {hasFile && file && (
                          <div className="mb-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <FileImage className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-500">Type:</span>
                              </div>
                              <div className="font-mono">
                                <span className={getMimeTypeColor(file.type)}>
                                  {file.type || 'unknown'}
                                </span>
                                {isOctetStream && (
                                  <span className="ml-1 text-yellow-500 text-[10px]">
                                    ⚠️ Mauvais format!
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <File className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-500">Taille:</span>
                              </div>
                              <div className="font-mono text-slate-700 dark:text-slate-300">
                                {formatFileSize(file.size)}
                              </div>
                              
                              <div className="flex items-center gap-1 col-span-2">
                                <span className="text-slate-500">Nom:</span>
                                <span className="font-mono text-slate-600 dark:text-slate-400 truncate">
                                  {file.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {hasFile && file?.url && (
                          <div className="relative">
                            <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                              {!hasError ? (
                                <img
                                  src={`${file.url}?t=${Date.now()}`}
                                  alt={label}
                                  className="w-full h-full object-cover"
                                  onError={() => handleImageError(type)}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="text-center">
                                    <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500">Image unavailable</p>
                                    <p className="text-[10px] text-slate-400 mt-1 break-all">{file.url.slice(0, 50)}...</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            {file.uploadedAt && (
                              <p className="text-[10px] text-slate-400 mt-2">
                                Uploaded: {new Date(file.uploadedAt).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {!hasFile && (
                          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center">
                            <Camera className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-xs text-slate-500">Waiting for upload...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Raw Session Data for Debugging */}
              {session?.files && Object.keys(session.files).length > 0 && (
                <div className="mt-6 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <details>
                    <summary className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                      🔍 Debug: Raw file types
                    </summary>
                    <pre className="text-[10px] mt-2 p-2 bg-slate-900 text-green-400 rounded overflow-auto">
                      {JSON.stringify(
                        Object.fromEntries(
                          Object.entries(session.files).map(([key, value]) => [
                            key,
                            { type: value?.type, size: value?.size, name: value?.name }
                          ])
                        ),
                        null,
                        2
                      )}
                    </pre>
                  </details>
                </div>
              )}

              {/* Completion Message */}
              {isComplete && (
                <div className="mt-6 p-4 bg-green-100 dark:bg-green-950/40 rounded-xl text-center border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                  <p className="font-bold text-green-700 dark:text-green-400 text-lg">
                    All 3 photos received! ✓
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    Your test upload is complete. The photos are stored in Vercel Blob.
                  </p>
                </div>
              )}

              {/* Warning for octet-stream files */}
              {session?.files && Object.values(session.files).some(f => f?.type === 'application/octet-stream') && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
                        ⚠️ Warning: Some files have incorrect MIME type
                      </p>
                      <p className="text-[10px] text-yellow-600 dark:text-yellow-500 mt-1">
                        Files are being saved as 'application/octet-stream' instead of 'image/jpeg'.
                        This will cause Google Vision OCR to fail.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {sessionId && filesCount === 0 && !isComplete && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Waiting for uploads from your phone...
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                    Scan the QR code with your phone's camera
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions Footer */}
        <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">📱 How to test:</h3>
              <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>Make sure your phone is connected to the <strong>same WiFi network</strong> as your computer</li>
                <li>Open your phone's camera app and scan the QR code above</li>
                <li>Take/upload the 3 photos: CIN front, CIN back, and a selfie</li>
                <li>Watch this page - photos will appear automatically as they're uploaded</li>
                <li>The session expires after 60 minutes (create a new one if needed)</li>
              </ol>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-3">
                💡 Tip: If the QR code doesn't open, manually enter the URL shown below the QR code in your phone's browser.
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                🔍 <strong>Debug:</strong> Check the "Raw file types" section to see what MIME type each file has.
                Files should be 'image/jpeg', not 'application/octet-stream'.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom QR code icon component
function QrCodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2v2h-2z" />
      <path d="M18 14h2v6h-2z" />
      <path d="M14 18h6v2h-6z" />
    </svg>
  );
}