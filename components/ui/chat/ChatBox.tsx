// components/ui/ChatBox.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
  IoInformationCircleOutline,
  IoEllipsisVerticalOutline,
  IoSendSharp,
  IoAlertCircleOutline, // ← AJOUTER CETTE LIGNE
  IoCloseOutline,
  IoCheckmarkOutline,
  IoCheckmarkDoneOutline,
  IoShieldOutline,
  IoLockClosedOutline,
  IoHomeOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoCardOutline,
  IoDocumentTextOutline,
  IoPersonOutline,
  IoFlagOutline,
  IoBanOutline,
  IoTrashOutline,
  IoStarOutline,
  IoBedOutline,
  IoPeopleOutline,
  IoMicOutline,
  IoStopCircleOutline,
  IoReturnUpBackOutline,
  IoHappyOutline,
  IoPlayOutline,
  IoPauseOutline,
} from "react-icons/io5";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useChatSocket } from "@/hooks/useChatSocket";
import EmojiPicker from "emoji-picker-react";

// ─── pip helper ────────────────────────────────────────────────────────────────
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

// ─── Design tokens ─────────────────────────────────────────────────────────────
const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const GRAD_TEXT =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";
const BTN_GRAD = `${GRAD} text-white hover:opacity-90 active:scale-[.98] transition-all`;

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  createdAt: string;
  isBlocked: boolean;
  isRead: boolean;
  isSystem?: boolean;
  type?: "text" | "voice";
  voiceUrl?: string;
  duration?: number;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
}

interface ListingInfo {
  id: string;
  title: string;
  image?: string;
  pricePerNight?: number;
  location?: string;
  rating?: number;
  bedrooms?: number;
  maxGuests?: number;
  type?: string;
  infoRequestId?: string;
  cleaningFee?: number;
}

interface ChatBoxProps {
  conversationId: string;
  recipientId: string;
  recipientName: string;
  recipientImage?: string;
  listingTitle?: string;
  listing?: ListingInfo;
  userRole?: "TENANT" | "PROPERTY_OWNER";
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    info: "bg-sky-500",
  };

  const Icon =
    type === "success"
      ? IoCheckmarkCircleOutline
      : type === "error"
        ? IoCloseCircleOutline
        : IoInformationCircleOutline;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[90] flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-xl animate-in slide-in-from-bottom-3 duration-300 ${styles[type]}`}
    >
      <Icon className="text-base flex-shrink-0" />
      {message}
    </div>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({
  src,
  name,
  size = 36,
  online,
}: {
  src?: string;
  name: string;
  size?: number;
  online?: boolean;
}) {
  const [err, setErr] = useState(false);
  const url = src ? pipAvatar(src) : null;
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-white bg-gradient-to-br from-sky-500 to-purple-600"
        style={{ fontSize: size * 0.38 }}
      >
        {url && !err ? (
          <img
            src={url}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setErr(true)}
          />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-900 ${
            online ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600"
          }`}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}

// ─── Status ticks ───────────────────────────────────────────────────────────────
function MsgStatus({ isRead, isOwn }: { isRead: boolean; isOwn: boolean }) {
  if (!isOwn) return null;
  return isRead ? (
    <IoCheckmarkDoneOutline className="text-white/70 text-xs" />
  ) : (
    <IoCheckmarkOutline className="text-white/50 text-xs" />
  );
}
// ─── Voice Message Component (VERSION FINALE) ─────────────────────────────────
function VoiceMessage({ url, duration }: { url: string; duration: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const apiUrl = `/api/messages/voice?url=${encodeURIComponent(url)}`;
        const res = await fetch(apiUrl);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        setAudioSrc(objectUrl);
      } catch (error) {
        console.error("Erreur chargement:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudio();

    return () => {
      if (audioSrc) URL.revokeObjectURL(audioSrc);
    };
  }, [url]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((e) => console.error("Play error:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener("ended", handleEnded);
      return () => audio.removeEventListener("ended", handleEnded);
    }
  }, [audioSrc]);

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
        <div className="flex-1 h-1.5 bg-white/30 rounded-full animate-pulse" />
        <span className="text-xs text-white/50">Chargement...</span>
      </div>
    );
  }

  if (!audioSrc) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
          <IoAlertCircleOutline className="text-red-400 text-sm" />
        </div>
        <span className="text-xs text-white/70">Audio non disponible</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        {isPlaying ? (
          <IoPauseOutline className="text-sm" />
        ) : (
          <IoPlayOutline className="text-sm ml-0.5" />
        )}
      </button>
      <div className="flex-1">
        <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/60 rounded-full transition-all duration-300"
            style={{ width: isPlaying ? "100%" : "0%" }}
          />
        </div>
      </div>
      <span className="text-xs text-white/70 font-mono">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
// ─── Voice Recorder Component ─────────────────────────────────────────────────
function VoiceRecorder({
  onSend,
  isDisabled,
}: {
  onSend: (blob: Blob, duration: number) => void;
  isDisabled?: boolean;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          console.error("❌ Pas de données audio");
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const finalDuration = Math.floor(
          (Date.now() - startTimeRef.current) / 1000,
        );

        console.log(
          "🎤 Durée:",
          finalDuration,
          "s, Taille:",
          audioBlob.size,
          "bytes",
        );

        if (audioBlob.size > 1000 && finalDuration > 0) {
          onSend(audioBlob, finalDuration);
        } else {
          alert("Message vocal trop court");
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start(100);
      setIsRecording(true);
      startTimeRef.current = Date.now();
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Erreur microphone:", error);
      alert("Impossible d'accéder au microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={isDisabled}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          title="Message vocal"
        >
          <IoMicOutline className="text-[17px]" />
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full">
          <span className="animate-pulse text-red-500 text-xs font-bold">
            ● REC {formatTime(recordingTime)}
          </span>
          <button onClick={stopRecording} className="text-red-500">
            <IoStopCircleOutline className="text-base" />
          </button>
        </div>
      )}
    </div>
  );
}
// ─── Reply Preview Component ─────────────────────────────────────────────────
function ReplyPreview({
  replyTo,
  onCancel,
}: {
  replyTo: Message;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl mb-2 border-l-4 border-indigo-500">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          Réponse à {replyTo.senderName}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
          {replyTo.content.length > 60
            ? replyTo.content.substring(0, 60) + "..."
            : replyTo.content}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="p-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
      >
        <IoCloseOutline className="text-indigo-500 text-sm" />
      </button>
    </div>
  );
}
// ─── Context Menu Component ──────────────────────────────────────────────────
function ContextMenu({
  x,
  y,
  onReply,
  onDelete,
  onClose,
}: {
  x: number;
  y: number;
  onReply: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);

  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden"
      style={{ top: y, left: x }}
    >
      <button
        onClick={() => {
          onReply();
          onClose();
        }}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors"
      >
        <IoReturnUpBackOutline className="text-indigo-500 text-sm" />
        <span className="text-gray-700 dark:text-gray-300">Répondre</span>
      </button>
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
      >
        <IoTrashOutline className="text-red-500 text-sm" />
        <span className="text-red-600 dark:text-red-400">Supprimer</span>
      </button>
    </div>
  );
}

// ─── Main ChatBox ────────────────────────────────────────────────────────────────
export function ChatBox({
  conversationId,
  recipientId,
  recipientName,
  recipientImage,
  listingTitle,
  listing,
  userRole = "TENANT",
}: ChatBoxProps) {
  const { user: clerkUser } = useUser();
  const isTenant = userRole === "TENANT";
  const isOwner = userRole === "PROPERTY_OWNER";

  // ── State ──────────────────────────────────────────────────────────────────
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [blockedNotification, setBlockedNotification] = useState<string | null>(
    null,
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Reply state
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: Message;
  } | null>(null);

  // Offer state (simplifié)
  const [showOfferCard, setShowOfferCard] = useState(false);
  const [showOfferButton, setShowOfferButton] = useState(false);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);

  // UI panels
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Voice recording
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const processedIds = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const emojiRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // ── Socket ────────────────────────────────────────────────────────────────
  const {
    socket,
    isConnected,
    messages: socketMessages,
    joinConversation,
    sendMessage: sendSocketMessage,
    startTyping,
    stopTyping,
  } = useChatSocket();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") =>
      setToast({ message, type }),
    [],
  );

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node))
        setShowEmojiPicker(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node))
        setShowMoreMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Load messages ─────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const loaded: Message[] = Array.isArray(data)
        ? data
        : (data.messages ?? []);

      loaded.forEach((m) => processedIds.current.add(m.id));
      setMessages(loaded);
      if (listing) setShowOfferCard(true);
    } catch (e) {
      console.error("❌ Error loading messages:", e);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, listing]);

  // ── Join + load on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (conversationId) {
      joinConversation(conversationId);
      loadMessages();
    }
  }, [conversationId, joinConversation, loadMessages]);

  // ── Sync socket messages ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socketMessages.length) return;

    setMessages((prev) => {
      const fresh = socketMessages.filter(
        (m) => !processedIds.current.has(m.id),
      );
      if (fresh.length > 0) {
        fresh.forEach((m) => processedIds.current.add(m.id));
        return [...prev, ...fresh];
      }
      return prev;
    });
  }, [socketMessages]);

  // ── Écoute directe du socket ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleDirectMessage = (message: Message) => {
      if (!processedIds.current.has(message.id)) {
        processedIds.current.add(message.id);
        setMessages((prev) => [...prev, message]);
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      }
    };

    socket.on("new-message", handleDirectMessage);
    return () => socket.off("new-message", handleDirectMessage);
  }, [socket]);

  // ── Auto scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Blocked messages ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const h = (d: { reason: string }) => {
      setBlockedNotification(d.reason);
      setTimeout(() => setBlockedNotification(null), 3000);
    };
    socket.on("message-blocked", h);
    return () => socket.off("message-blocked", h);
  }, [socket]);

  // ── Check offer conditions ────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      if (!conversationId || !listing) return;
      const nonSystem = messages.filter((m) => !m.isSystem).length;
      setShowOfferButton(nonSystem >= 3);
    };
    check();
  }, [conversationId, messages, listing]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  // Supprimer un message
  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages?messageId=${messageId}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
          showToast("Message supprimé", "success");
        } else {
          showToast("Erreur lors de la suppression", "error");
        }
      } catch (error) {
        showToast("Erreur de connexion", "error");
      }
    }
  };

  // Gestion du clic droit sur un message
  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    const isOwn = message.senderId !== recipientId;
    if (!isOwn) return;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isSending || !isConnected) return;

    setIsSending(true);
    let content = input.trim();

    if (replyTo) {
      content = `@${replyTo.senderName}: ${content}`;
    }

    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    sendSocketMessage(conversationId, content, recipientId);
    setReplyTo(null);

    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      80,
    );
    setIsSending(false);
  };

  const handleSendVoice = async (audioBlob: Blob, duration: number) => {
    setIsUploadingVoice(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `voice-${Date.now()}.webm`);
      formData.append("conversationId", conversationId);
      formData.append("recipientId", recipientId);
      formData.append("duration", duration.toString());

      const uploadRes = await fetch("/api/messages/voice", {
        method: "POST",
        body: formData,
      });

      if (uploadRes.ok) {
        const data = await uploadRes.json();

        if (data.message && !processedIds.current.has(data.message.id)) {
          processedIds.current.add(data.message.id);
          setMessages((prev) => [...prev, data.message]);
          setTimeout(
            () =>
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
            100,
          );
        }

        showToast("Message vocal envoyé", "success");
      } else {
        const error = await uploadRes.json();
        showToast(error.error || "Erreur lors de l'envoi", "error");
      }
    } catch (error) {
      console.error("Erreur envoi vocal:", error);
      showToast("Erreur de connexion", "error");
    } finally {
      setIsUploadingVoice(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    setInput(el.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    startTyping(conversationId);
    typingTimeoutRef.current = setTimeout(
      () => stopTyping(conversationId),
      2000,
    );
  };

  const insertEmoji = (emoji: any) => {
    setInput((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Actions menu
  const handleReportConversation = async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Comportement inapproprié" }),
      });
      if (res.ok) {
        showToast("Conversation signalée à l'équipe de modération", "success");
        sendSocketMessage(
          conversationId,
          "⚠️ Cette conversation a été signalée",
          recipientId,
        );
      } else {
        showToast("Erreur lors du signalement", "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    }
    setShowMoreMenu(false);
  };

  const handleBlockUser = async () => {
    try {
      const res = await fetch(`/api/users/${recipientId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setIsUserBlocked(true);
        showToast(`Utilisateur ${recipientName} bloqué avec succès`, "error");
        sendSocketMessage(
          conversationId,
          "🚫 L'utilisateur a été bloqué",
          recipientId,
        );
      } else {
        showToast("Erreur lors du blocage", "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    }
    setShowMoreMenu(false);
  };

  const handleClearHistory = async () => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir effacer tout l'historique de cette conversation ?",
      )
    ) {
      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages?deleteAll=true`,
          { method: "DELETE" },
        );
        if (res.ok) {
          setMessages([]);
          processedIds.current.clear();
          showToast("Historique effacé avec succès", "info");
          sendSocketMessage(
            conversationId,
            "🗑️ L'historique des messages a été effacé",
            recipientId,
          );
          setTimeout(() => loadMessages(), 500);
        } else {
          showToast("Erreur lors de l'effacement", "error");
        }
      } catch {
        showToast("Erreur de connexion", "error");
      }
    }
    setShowMoreMenu(false);
  };

  const handleCreateOffer = async () => {
    if (!conversationId || !listing) return;
    setIsCreatingOffer(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          infoRequestId: listing.infoRequestId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Offre créée avec succès !", "success");
        setShowOfferButton(false);
        sendSocketMessage(
          conversationId,
          `Offre de réservation — ${data.offer.totalPrice.toLocaleString("fr-FR")} TND`,
          recipientId,
        );
      } else {
        showToast(data.error || "Erreur", "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    } finally {
      setIsCreatingOffer(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-purple-600 animate-pulse" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden relative">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onReply={() => {
            setReplyTo(contextMenu.message);
            inputRef.current?.focus();
          }}
          onDelete={() => handleDeleteMessage(contextMenu.message.id)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
        <Avatar
          src={recipientImage}
          name={recipientName}
          size={38}
          online={isConnected}
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
            {recipientName}
          </p>
          {listingTitle && (
            <p className="text-xs text-gray-400 dark:text-gray-600 truncate">
              {listingTitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {isOwner && (
            <button
              onClick={() => setShowInfoPanel((p) => !p)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                showInfoPanel
                  ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
                  : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
              }`}
            >
              <IoInformationCircleOutline className="text-[17px]" />
            </button>
          )}

          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setShowMoreMenu((p) => !p)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                showMoreMenu
                  ? "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                  : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
              }`}
            >
              <IoEllipsisVerticalOutline className="text-[17px]" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 rounded-xl border shadow-xl z-30 overflow-hidden">
                <button
                  onClick={handleReportConversation}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors border-b"
                >
                  <IoFlagOutline className="text-base text-amber-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Signaler la conversation
                  </span>
                </button>
                <button
                  onClick={handleBlockUser}
                  disabled={isUserBlocked}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors border-b disabled:opacity-50"
                >
                  <IoBanOutline className="text-base text-red-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {isUserBlocked
                      ? "Utilisateur bloqué"
                      : "Bloquer cet utilisateur"}
                  </span>
                </button>
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <IoTrashOutline className="text-base text-gray-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Effacer l'historique
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {!isConnected && (
          <span className="text-[10px] text-amber-500 font-medium">
            Reconnexion…
          </span>
        )}
      </div>

      {/* ── Info panel (uniquement pour propriétaire) ───────────────────────────── */}
      {isOwner && showInfoPanel && listing && (
        <div className="bg-gray-50 dark:bg-slate-800/50 border-b px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            {listing.image ? (
              <img
                src={listing.image}
                alt={listing.title}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-200 to-purple-200 flex items-center justify-center flex-shrink-0">
                <IoHomeOutline className="text-indigo-400 text-xl" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                {listing.title}
              </p>
              {listing.location && (
                <p className="text-xs text-gray-400 dark:text-gray-600 truncate mt-0.5">
                  {listing.location}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {listing.pricePerNight && (
                  <span className={`text-sm font-extrabold ${GRAD_TEXT}`}>
                    {listing.pricePerNight.toLocaleString("fr-FR")} TND
                    <span className="text-[10px] font-normal text-gray-400 dark:text-gray-600 ml-0.5">
                      /nuit
                    </span>
                  </span>
                )}
                {listing.bedrooms && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <IoBedOutline className="text-sm" />
                    {listing.bedrooms} ch.
                  </span>
                )}
                {listing.maxGuests && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <IoPeopleOutline className="text-sm" />
                    {listing.maxGuests} pers.
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowInfoPanel(false)}
              className="text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors flex-shrink-0"
            >
              <IoCloseOutline className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* ── Status banners ────────────────────────────────────────────────── */}
      {blockedNotification && (
        <div className="mx-3 mt-2 flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl shrink-0 animate-pulse">
          <IoShieldOutline className="text-amber-500 text-sm flex-shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400">
            Message bloqué — {blockedNotification}
          </span>
        </div>
      )}

      {/* ── Listing offer card ────────────────────────────────────────────── */}
      {isTenant && listing && showOfferCard && !showOfferButton && (
        <div className="mx-3 mt-2 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700/60 shadow-sm">
            <div className="relative h-32 overflow-hidden">
              {listing.image ? (
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sky-200 to-purple-200 flex items-center justify-center">
                  <IoHomeOutline className="text-indigo-400 text-4xl" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
            <div className="p-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                {listing.title}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                {listing.location || "Emplacement non spécifié"}
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className={`text-lg font-extrabold ${GRAD_TEXT}`}>
                  {listing.pricePerNight?.toLocaleString("fr-FR")} TND
                  <span className="text-[10px] font-normal text-gray-400 dark:text-gray-600">
                    /nuit
                  </span>
                </p>
                <button
                  onClick={handleCreateOffer}
                  disabled={isCreatingOffer}
                  className={`px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1 ${BTN_GRAD}`}
                >
                  {isCreatingOffer ? (
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    "Réserver"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Messages area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-gray-50/40 dark:bg-slate-800/20">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <IoPersonOutline className="text-gray-300 dark:text-slate-600 text-xl" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-600 font-medium">
              Aucun message
            </p>
            <p className="text-xs text-gray-300 dark:text-gray-700 mt-1">
              Soyez le premier à envoyer un message
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId !== recipientId;

            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="text-[10px] italic text-gray-400 dark:text-gray-600 px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                onContextMenu={(e) => isOwn && handleContextMenu(e, msg)}
              >
                {!isOwn && (
                  <Avatar
                    src={msg.senderImage}
                    name={msg.senderName}
                    size={28}
                  />
                )}

                <div
                  className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isOwn
                      ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white rounded-br-[4px] shadow-md"
                      : "bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-[4px] shadow-sm border"
                  }`}
                >
                  {msg.replyTo && (
                    <div className="mb-1.5 pb-1.5 border-b border-white/20 text-[10px] text-white/60">
                      <span className="font-medium">
                        ↳ Réponse à {msg.replyTo.senderName}:
                      </span>
                      <div className="truncate">{msg.replyTo.content}</div>
                    </div>
                  )}

                  {msg.isBlocked ? (
                    <div className="flex items-center gap-2">
                      <IoShieldOutline className="text-amber-400 flex-shrink-0 text-sm" />
                      <span className="text-xs">{msg.content}</span>
                    </div>
                  ) : msg.type === "voice" && msg.voiceUrl ? (
                    <VoiceMessage
                      url={msg.voiceUrl}
                      duration={msg.duration || 0}
                    />
                  ) : (
                    <>
                      {!isOwn && (
                        <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mb-1">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="break-words whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${isOwn ? "text-white/50" : "text-gray-400"}`}
                      >
                        {formatDistanceToNow(new Date(msg.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                        <MsgStatus isRead={msg.isRead} isOwn={isOwn} />
                      </div>
                    </>
                  )}
                </div>

                {isOwn && <div className="w-7 flex-shrink-0" />}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ─────────────────────────────────────────────────────── */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {replyTo && (
          <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />
        )}

        <div className="flex items-end gap-2 bg-gray-50 dark:bg-slate-800 rounded-2xl px-3 py-2 border focus-within:border-indigo-300 transition-colors">
          {/* Emoji picker */}
          <div className="relative self-end pb-0.5" ref={emojiRef}>
            <button
              onClick={() => setShowEmojiPicker((p) => !p)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                showEmojiPicker
                  ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <IoHappyOutline className="text-[18px]" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 left-0 z-20">
                <EmojiPicker
                  onEmojiClick={insertEmoji}
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>

          {/* Voice recorder */}
          <VoiceRecorder
            onSend={handleSendVoice}
            isDisabled={!isConnected || isUserBlocked}
          />

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={adjustHeight}
            onKeyDown={handleKeyDown}
            placeholder={
              replyTo
                ? `Répondre à ${replyTo.senderName}...`
                : "Écrire un message…"
            }
            rows={1}
            disabled={!isConnected || isUserBlocked}
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none min-h-[28px] max-h-[120px] py-0.5"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={
              !input.trim() || isSending || !isConnected || isUserBlocked
            }
            className={`self-end w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0 ${
              input.trim() && !isSending && isConnected && !isUserBlocked
                ? `${GRAD} text-white shadow-md hover:opacity-90`
                : "bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSending ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <IoSendSharp className="text-sm ml-0.5" />
            )}
          </button>
        </div>

        <p className="text-[10px] text-gray-400 dark:text-gray-700 text-center mt-2 flex items-center justify-center gap-1">
          <IoLockClosedOutline className="text-xs" />
          Messages sécurisés · Ne partagez pas vos informations personnelles
        </p>
      </div>
    </div>
  );
}
