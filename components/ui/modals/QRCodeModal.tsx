// components/ui/modals/QRCodeModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Modal from "../Modal";
import { Download, Copy, Check, Share2, Printer, Sparkles } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
}: QRCodeModalProps) {
  const t = useTranslations("OwnerListings.qrCodeModal");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [withGradient, setWithGradient] = useState(true);
  const [withLogo, setWithLogo] = useState(true);

  useEffect(() => {
    if (isOpen && listingId) {
      generateQRCode();
    }
  }, [isOpen, listingId, withGradient, withLogo]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const locale = window.location.pathname.split("/")[1];
      const res = await fetch(
        `/api/listings/${listingId}/qrcode?baseUrl=${baseUrl}&locale=${locale}&gradient=${withGradient}&logo=${withLogo}`,
      );
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCode);
        setUrl(data.url);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;
    const link = document.createElement("a");
    link.download = `qr-${listingId}-nesthub.png`;
    link.href = qrCode;
    link.click();
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listingTitle,
          text: `Découvrez cette annonce sur NestHub: ${listingTitle}`,
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      copyUrl();
    }
  };

  const printQRCode = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && qrCode) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${listingTitle}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: #f8fafc;
              }
              .container {
                text-align: center;
                padding: 2rem;
              }
              img {
                width: 300px;
                height: 300px;
                margin: 20px auto;
                border-radius: 24px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
              }
              h2 {
                color: #1e293b;
                margin-bottom: 0.5rem;
              }
              .footer {
                margin-top: 2rem;
                font-size: 12px;
                color: #94a3b8;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>${listingTitle}</h2>
              <img src="${qrCode}" alt="QR Code" />
              <div class="footer">NestHub - ${new Date().toLocaleDateString("fr-FR")}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      className="max-w-md"
    >
      <div className="flex flex-col items-center p-6 space-y-5">
        <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white">
          {listingTitle}
        </h3>

        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-2xl blur-lg opacity-30 transition-opacity" />
          <div className="relative bg-white rounded-2xl p-3 shadow-xl">
            {loading ? (
              <div className="w-48 h-48 bg-gradient-to-r from-indigo-100 via-purple-100 to-cyan-100 animate-pulse rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : qrCode ? (
              <img
                src={qrCode}
                alt="QR Code"
                className="w-48 h-48 rounded-xl transition-transform duration-300 hover:scale-105"
              />
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={downloadQRCode}
            disabled={!qrCode}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Download size={16} /> {t("download")}
          </button>

          <button
            onClick={shareQRCode}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
          >
            <Share2 size={16} /> {t("share")}
          </button>

          
          <button
            onClick={copyUrl}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
          >
            {copied ? (
              <Check
                size={16}
                className="text-emerald-600 dark:text-emerald-400"
              />
            ) : (
              <Copy size={16} />
            )}
            {copied ? t("copied") : t("copyLink")}
          </button>
        </div>

        
        <div className="flex items-center gap-2 pt-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 animate-pulse" />
          <p className="text-xs text-slate-400 text-center">{t("scanHint")}</p>
        </div>
      </div>
    </Modal>
  );
}
