// app/admin/contacts/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FaChevronRight, FaPaperPlane, FaTimes, FaUser, FaPhone, FaEnvelope, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaArrowLeft } from "react-icons/fa";
import { LuBadgeInfo } from "react-icons/lu";
import { RiDoubleQuotesR } from "react-icons/ri";
import { MdVerified, MdMarkEmailRead } from "react-icons/md";
import { Loader2 } from "lucide-react";
import RichTextEditor from "@/components/ui/editor/RichTextEditor";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  userId: string | null;
  message: string;
  status: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface ToastState {
  type: "success" | "error";
  message: string;
}

export default function AdminContactReplyPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("AdminContacts.reply");
  const [message, setMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    fetchMessage();
  }, [id]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchMessage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contact/list`);
      if (!res.ok) throw new Error(t("loading.error"));
      const data = await res.json();
      const found = data.messages.find((m: ContactMessage) => m.id === id);
      
      if (!found) throw new Error(t("errors.notFound"));
      
      setMessage(found);
      setReplyText(found?.reply || "");
      setReplySubject(`Re: ${found?.fullName} - ${t("page.title")}`);
    } catch (error) {
      setToast({ type: "error", message: t("toast.loadError") });
      setTimeout(() => router.push("/admin/contact-support"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!message) {
      setToast({ type: "error", message: t("toast.messageNotFound") });
      return;
    }
    
    if (!replyText.trim()) {
      setToast({ type: "error", message: t("toast.writeReply") });
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/admin/contact/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: message.id,
          replyMessage: replyText,
          subject: replySubject,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setToast({ type: "success", message: `${t("toast.replySent")} ${message.email}` });
        
        setTimeout(() => {
          router.push("/admin/contact-support");
        }, 2000);
      } else {
        throw new Error(data.error || t("toast.replyError"));
      }
    } catch (error) {
      setToast({ type: "error", message: t("toast.replyError") });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 dark:bg-slate-950/80 z-50">
        <LoadingSpinner />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          {t("loading.message")}
        </p>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <FaExclamationTriangle className="text-5xl text-amber-500" />
        <div className="text-slate-500 text-center">
          <p className="font-semibold">{t("errors.notFound")}</p>
          <p className="text-sm">{t("errors.notFoundDescription")}</p>
        </div>
        <button
          onClick={() => router.push("/admin/contact-support")}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
        >
          {t("errors.backToList")}
        </button>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <FaCheckCircle className="w-5 h-5" />
            ) : (
              <FaExclamationTriangle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-70"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-10 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 group"
                aria-label={t("header.back")}
              >
              </button>
              
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => router.push("/admin/contact-support")}
                  className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {t("header.inquiries")}
                </button>
                <FaChevronRight className="text-slate-400 dark:text-slate-600 text-xs" />
                <span className="text-slate-900 dark:text-white font-medium">
                  {t("header.replyTo")} {message.fullName.split(" ")[0]}
                </span>
              </div>
            </div>

            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${
              message.status === "PENDING"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            }`}>
              {message.status === "PENDING" ? (
                <>
                  <FaExclamationTriangle className="text-amber-500 text-xs" />
                  {t("status.pending")}
                </>
              ) : (
                <>
                  <FaCheckCircle className="text-emerald-500 text-xs" />
                  {t("status.replied")}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <FaEnvelope className="text-indigo-500 text-sm" />
                  </div>
                  <span className="text-sm font-medium text-slate-500 w-16">{t("form.to")}</span>
                  <span className="text-sm text-slate-900 dark:text-white font-medium">{message.email}</span>
                </div>
              </div>

              <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <MdMarkEmailRead className="text-violet-500 text-sm" />
                  </div>
                  <span className="text-sm font-medium text-slate-500 w-16">{t("form.subject")}</span>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="flex-1 bg-transparent border-none text-sm text-slate-900 dark:text-white focus:outline-none font-medium"
                    placeholder={t("form.subjectPlaceholder")}
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[500px]">
                <RichTextEditor
                  value={replyText}
                  onChange={setReplyText}
                  placeholder={t("form.editorPlaceholder")}
                  compact={false}
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-4 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/30">
                <button
                  onClick={() => router.back()}
                  className="px-5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm font-medium flex items-center gap-2"
                >
                  <FaTimes className="text-sm" />
                  {t("form.cancel")}
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("form.sending")}
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="text-sm" />
                      {t("form.send")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="w-[380px] flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto">
            <div className="p-5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                <LuBadgeInfo className="text-indigo-500 text-base" />
                {t("info.title")}
              </h3>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center">
                    <FaUser className="text-indigo-600 dark:text-indigo-400 text-lg" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {message.fullName}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      {message.email}
                    </p>
                    {message.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        {message.phone}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">{t("info.contactCard.receivedAt")}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{formatDate(message.createdAt)}</span>
                  </div>
                  {message.repliedAt && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">{t("info.contactCard.repliedAt")}</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{formatDate(message.repliedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <RiDoubleQuotesR className="text-indigo-500 text-sm" />
                  {t("info.originalMessage")}
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 relative">
                  <RiDoubleQuotesR className="text-3xl text-indigo-200 dark:text-indigo-800 absolute -top-2 left-3" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-2">
                    {message.message}
                  </p>
                </div>
              </div>

              {message.userId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-start gap-3">
                    <MdVerified className="text-blue-600 dark:text-blue-400 text-lg flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                        {t("info.connectedUser.title")}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400/80 mt-1">
                        {t("info.connectedUser.description")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                <div className="flex items-start gap-2">
                  <FaInfoCircle className="text-amber-600 dark:text-amber-400 text-sm flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {t("info.emailNote.message")} {message.userId && t("info.emailNote.andInApp")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}