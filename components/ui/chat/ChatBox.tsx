"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
  IoInformationCircleOutline,
  IoEllipsisVerticalOutline,
  IoSendSharp,
  IoAlertCircleOutline,
  IoCloseOutline,
  IoCheckmarkOutline,
  IoCheckmarkDoneOutline,
  IoShieldOutline,
  IoLockClosedOutline,
  IoHomeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoPersonOutline,
  IoFlagOutline,
  IoBanOutline,
  IoTrashOutline,
  IoBedOutline,
  IoPeopleOutline,
  IoMicOutline,
  IoStopCircleOutline,
  IoReturnUpBackOutline,
  IoHappyOutline,
  IoPlayOutline,
  IoPauseOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoTimerOutline,
  IoCardOutline,
  IoArrowForwardOutline,
  IoEyeOutline,
} from "react-icons/io5";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useChatSocket } from "@/hooks/useChatSocket";
import EmojiPicker from "emoji-picker-react";
import LoadingSpinner from "../LoadingSpinner";
import { useRealtimeChatBox } from "@/hooks/useRealtimeChatBox";

// ─── pip helpers ────────────────────────────────────────────────────────────────
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;
const pipListingImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

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
  reason?: string; // ← AJOUTEZ CETTE LIGNE

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
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

interface ChatBoxProps {
  conversationId: string;
  recipientId: string;
  recipientName: string;
  recipientImage?: string;
  listingTitle?: string;
  listing?: ListingInfo;
  userRole?: "TENANT" | "PROPERTY_OWNER";
  offerId?: string;
  offerStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  isPaid?: boolean; // 👈 AJOUTÉ
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
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-white bg-slate-200 dark:bg-slate-700"
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
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-900 ${online ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600"}`}
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
    <IoCheckmarkDoneOutline className="text-white/60 text-xs" />
  ) : (
    <IoCheckmarkOutline className="text-white/40 text-xs" />
  );
}

// ─── Voice Message Component ─────────────────────────────────────────────────
function VoiceMessage({
  url,
  duration,
  isOwn,
}: {
  url: string;
  duration: number;
  isOwn: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
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
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleEnded);
      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", handleEnded);
      };
    }
  }, [audioSrc]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
    <div className="flex items-center gap-2 min-w-[180px]">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        {isPlaying ? (
          <IoPauseOutline className="text-sm text-white" />
        ) : (
          <IoPlayOutline className="text-sm ml-0.5 text-white" />
        )}
      </button>
      <div className="flex-1">
        <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/60 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-white/70 font-mono min-w-[35px]">
        {formatTime(currentTime)} / {formatTime(duration)}
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
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const finalDuration = Math.floor(
          (Date.now() - startTimeRef.current) / 1000,
        );
        if (audioBlob.size > 1000 && finalDuration > 0)
          onSend(audioBlob, finalDuration);
        else alert("Message vocal trop court");
        if (streamRef.current)
          streamRef.current.getTracks().forEach((track) => track.stop());
      };
      recorder.start(100);
      setIsRecording(true);
      startTimeRef.current = Date.now();
      setRecordingTime(0);
      timerRef.current = setInterval(
        () => setRecordingTime((prev) => prev + 1),
        1000,
      );
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

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={isDisabled}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <IoMicOutline className="text-lg" />
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
    <div className="flex items-center justify-between px-3 py-2 bg-indigo-100 dark:bg-indigo-950/30 rounded-xl mb-2 border-l-4 border-indigo-500">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          Réponse à {replyTo.senderName}
        </p>
        <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 truncate">
          {replyTo.content.length > 60
            ? replyTo.content.substring(0, 60) + "..."
            : replyTo.content}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="p-1 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
      >
        <IoCloseOutline className="text-indigo-500 text-sm" />
      </button>
    </div>
  );
}

// ─── System Message Component ─────────────────────────────────────────────────
function SystemMessage({
  content,
  senderName,
}: {
  content: string;
  senderName?: string;
}) {
  let cleanContent = content
    .replace(/[🔄📅👥💰⏰⚠️🚫🗑️🏷️✅❌⭐🔊🎤📎💬]/g, "")
    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold text-indigo-700 dark:text-indigo-300">$1</strong>',
    );

  if (
    cleanContent.includes("Offre de réservation") ||
    cleanContent.includes("offre de réservation")
  ) {
    const dateMatch = cleanContent.match(
      /(\d{2}\/\d{2}\/\d{4})\s*→\s*(\d{2}\/\d{2}\/\d{4})/,
    );
    const nightsMatch = cleanContent.match(/(\d+)\s*nuit/);
    const guestsMatch = cleanContent.match(/(\d+)\s*voyageur/);
    const priceMatch = cleanContent.match(/Total[:\s]*(\d+)\s*TND/);

    if (dateMatch && nightsMatch && guestsMatch && priceMatch) {
      const userName = senderName || "L'utilisateur";
      const nights = parseInt(nightsMatch[1]);
      cleanContent = `${userName} a créé une offre de réservation d'une durée de ${nights} nuit${nights > 1 ? "s" : ""} du ${dateMatch[1]} au ${dateMatch[2]} pour ${guestsMatch[1]} voyageur${parseInt(guestsMatch[1]) > 1 ? "s" : ""} estimée à ${priceMatch[1]} TND. Le propriétaire dispose de 24 heures pour répondre.`;
    }
  }

  if (
    cleanContent.includes("réservation confirmée") ||
    cleanContent.includes("Réservation confirmée")
  ) {
    cleanContent = cleanContent.replace(
      /Réservation confirmée|réservation confirmée/,
      "Réservation confirmée",
    );
    cleanContent += " ✅ La réservation a été validée.";
  }

  return (
    <div className="flex justify-center my-2">
      <div className="max-w-[85%] px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl text-center border border-indigo-100 dark:border-indigo-800/50">
        <p
          className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />
      </div>
    </div>
  );
}

// ─── Offer Card Component (Centered in Conversation) ──────────────────────────
function OfferCard({
  listing,
  checkIn,
  checkOut,
  guests,
  totalPrice,
  onConfirm,
  isCreating,
}: {
  listing: ListingInfo;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  onConfirm: () => void;
  isCreating?: boolean;
}) {
  const [imageErr, setImageErr] = useState(false);
  const listingImageUrl = listing?.image
    ? pipListingImage(listing.image)
    : null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  };

  const checkInDate = checkIn ? formatDate(checkIn) : "Date non définie";
  const checkOutDate = checkOut ? formatDate(checkOut) : "Date non définie";
  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
            86400000,
        )
      : 0;

  const pricePerNight = listing.pricePerNight || 0;
  const cleaningFee = listing.cleaningFee || 0;
  const serviceFee = Math.round(totalPrice * 0.05);
  const finalTotal = totalPrice + cleaningFee + serviceFee;

  return (
    <div className="flex justify-center my-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-blue-100 dark:border-blue-900/30">
        <div className="relative h-64">
          {listingImageUrl && !imageErr ? (
            <>
              <img
                src={listingImageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={() => setImageErr(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <IoHomeOutline className="text-white text-5xl opacity-70" />
            </div>
          )}

          <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg z-10">
            <IoCheckmarkCircleOutline className="text-blue-600 dark:text-blue-400 text-sm" />
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
              Offre de réservation
            </span>
          </div>

          <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-lg z-10">
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium uppercase">
              Prix estimé
            </p>
            <p className="font-headline font-extrabold text-base text-indigo-600 dark:text-indigo-400 leading-tight">
              {finalTotal.toLocaleString("fr-FR")} TND
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
            <h3 className="font-headline font-bold text-xl text-white drop-shadow-md mb-1">
              {listing.title}
            </h3>
            {listing.location && (
              <p className="text-xs text-white/90 flex items-center gap-1 drop-shadow-md">
                <IoLocationOutline className="text-xs" />
                {listing.location}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3">
              <p className="text-xs text-white/90 flex items-center gap-1 drop-shadow-md">
                <IoCalendarOutline className="text-xs" />
                {checkInDate} — {checkOutDate}
              </p>
              <p className="text-xs text-white/90 flex items-center gap-1 drop-shadow-md">
                <IoPeopleOutline className="text-xs" />
                {guests} voyageur{guests > 1 ? "s" : ""}
              </p>
            </div>

            <button
              onClick={onConfirm}
              disabled={isCreating}
              className="w-full mt-4 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-headline font-bold shadow-lg shadow-black/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Envoi en cours...
                </span>
              ) : (
                "Créer l'offre de réservation"
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-3">
              <IoTimerOutline className="text-sm text-amber-300" />
              <p className="text-[11px] text-amber-200 font-medium">
                Cette offre expirera dans 24h après création
              </p>
            </div>
          </div>
        </div>
      </div>
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
      className="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden"
      style={{ top: y, left: x }}
    >
      <button
        onClick={() => {
          onReply();
          onClose();
        }}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
      >
        <IoReturnUpBackOutline className="text-indigo-500 text-sm" />
        <span className="text-slate-700 dark:text-slate-300">Répondre</span>
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
  offerId,
  offerStatus,
  isPaid = false, // 👈 AJOUTÉ avec valeur par défaut
}: ChatBoxProps) {
  const { user: clerkUser } = useUser();
  const isTenant = userRole === "TENANT";
  const isOwner = userRole === "PROPERTY_OWNER";

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
  const [emojiTheme, setEmojiTheme] = useState<"light" | "dark">("light");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: Message;
  } | null>(null);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [listingImageErr, setListingImageErr] = useState(false);
  const [showOfferCard, setShowOfferCard] = useState(false);
  const [offerCreated, setOfferCreated] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [lastReportTime, setLastReportTime] = useState(0);
  const processedIds = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const emojiRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const [showBlockSheet, setShowBlockSheet] = useState(false);
  const [blockCooldown, setBlockCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const {
    socket,
    isConnected,
    messages: socketMessages,
    joinConversation,
    sendMessage: sendSocketMessage,
    startTyping,
    stopTyping,
  } = useChatSocket();
  // Ajouter après les autres useState
  const {
    isClosed,
    blockReason,
    isChecking,
    isUserBlocked: isBlockedByRecipient,
    hasBlockedUser,
  } = useRealtimeChatBox(conversationId, recipientId);

  const showToastMsg = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") =>
      setToast({ message, type }),
    [],
  );

  useEffect(() => {
    const checkTheme = () =>
      setEmojiTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light",
      );
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

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

  const showPaymentBanner = offerStatus === "ACCEPTED" && !isPaid; // 👈 MODIFIÉ - ajout de !isPaid

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

      const hasOffer = loaded.some(
        (m) =>
          m.content &&
          (m.content.includes("offre de réservation") ||
            m.content.includes("Offre de réservation")),
      );
      setOfferCreated(hasOffer);

      if (listing && !hasOffer) {
        setShowOfferCard(true);
      } else {
        setShowOfferCard(false);
      }
    } catch (e) {
      console.error("Error loading messages:", e);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, listing]);
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    }
  }, [isLoading, messages.length]);
  useEffect(() => {
    if (conversationId) {
      joinConversation(conversationId);
      loadMessages();
    }
  }, [conversationId, joinConversation, loadMessages]);

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

 useEffect(() => {
  if (!socket) return;
  const handleDirectMessage = (message: Message) => {
    if (!processedIds.current.has(message.id)) {
      processedIds.current.add(message.id);
      setMessages((prev) => [...prev, message]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      
      // JOUER LE SON SEULEMENT SI LE MESSAGE N'EST PAS DE MOI
      // Comparer l'ID de l'expéditeur avec recipientId
      if (message.senderId !== recipientId && notificationSoundRef.current) {
        notificationSoundRef.current.play().catch((err) => {
          console.log("Son non joué:", err);
        });
      }
    }
  };
  socket.on("new-message", handleDirectMessage);
  return () => socket.off("new-message", handleDirectMessage);
}, [socket, recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const h = (d: { reason: string }) => {
      setBlockedNotification(d.reason);
      setTimeout(() => setBlockedNotification(null), 3000);
    };
    socket.on("message-blocked", h);
    return () => socket.off("message-blocked", h);
  }, [socket]);
  
  useEffect(() => {
  notificationSoundRef.current = new Audio("/sounds/message.mp3");
  notificationSoundRef.current.load();
  return () => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current = null;
    }
  };
}, []);
  // Écouter l'état "en train d'écrire" de l'autre utilisateur
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data: {
      userId: string;
      conversationId: string;
    }) => {
      if (
        data.userId === recipientId &&
        data.conversationId === conversationId
      ) {
        setIsTyping(true);
        if (typingTimeout) clearTimeout(typingTimeout);
        const timeout = setTimeout(() => setIsTyping(false), 3000);
        setTypingTimeout(timeout);
      }
    };

    const handleUserStopTyping = (data: {
      userId: string;
      conversationId: string;
    }) => {
      if (
        data.userId === recipientId &&
        data.conversationId === conversationId
      ) {
        setIsTyping(false);
      }
    };

    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);

    return () => {
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [socket, recipientId, conversationId, typingTimeout]);
  const checkBlockCooldown = useCallback(() => {
    const lastBlockTime = localStorage.getItem(`block_${recipientId}`);
    if (lastBlockTime) {
      const timeDiff = Date.now() - parseInt(lastBlockTime);
      const hours48 = 48 * 60 * 60 * 1000;
      if (timeDiff < hours48) {
        const remaining = Math.ceil((hours48 - timeDiff) / (60 * 60 * 1000));
        setBlockCooldown(true);
        setCooldownRemaining(remaining);
        return false;
      }
    }
    setBlockCooldown(false);
    return true;
  }, [recipientId]);

  const handleOpenBlockSheet = () => {
    if (blockCooldown) {
      showToastMsg(
        `Bloque uniquement toutes les 48h. Encore ${cooldownRemaining}h`,
        "error",
      );
      return;
    }
    setShowBlockSheet(true);
    setShowMoreMenu(false);
  };

  const confirmBlock = async () => {
    setShowBlockSheet(false);
    await handleBlockUser();
    localStorage.setItem(`block_${recipientId}`, Date.now().toString());
    showToastMsg(`${recipientName} a été bloqué`, "error");
  };
  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages?messageId=${messageId}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
          showToastMsg("Message supprimé", "success");
        } else showToastMsg("Erreur lors de la suppression", "error");
      } catch {
        showToastMsg("Erreur de connexion", "error");
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    const isOwn = message.senderId !== recipientId;
    if (!isOwn) return;
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  };

  const handleSend = async () => {
    if (!input.trim() || isSending || !isConnected) return;
    setIsSending(true);
    let content = input.trim();
    if (replyTo) content = `@${replyTo.senderName}: ${content}`;
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
        showToastMsg("Message vocal envoyé", "success");
      } else {
        const error = await uploadRes.json();
        showToastMsg(error.error || "Erreur lors de l'envoi", "error");
      }
    } catch {
      showToastMsg("Erreur de connexion", "error");
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

  const handleReportConversation = async () => {
    // Vérifier si 5 minutes se sont écoulées
    const now = Date.now();
    if (now - lastReportTime < 5 * 60 * 1000) {
      showToastMsg(
        "Vous pouvez signaler une conversation toutes les 5 minutes",
        "error",
      );
      return;
    }

    try {
      const res = await fetch(`/api/conversations/${conversationId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Comportement inapproprié" }),
      });
      if (res.ok) {
        setLastReportTime(now); // Enregistrer l'heure du signalement
        showToastMsg(
          "Conversation signalée à l'équipe de modération",
          "success",
        );
      } else showToastMsg("Erreur lors du signalement", "error");
    } catch {
      showToastMsg("Erreur de connexion", "error");
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
        showToastMsg(
          `Utilisateur ${recipientName} bloqué avec succès`,
          "error",
        );

        // ✅ ENVOIE UN VRAI MESSAGE SYSTÈME VIA L'API
        const systemMsgRes = await fetch(
          `/api/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `🚫 Vous avez bloqué ${recipientName}. Vous ne recevrez plus ses messages.`,
              isSystem: true,
            }),
          },
        );

        if (systemMsgRes.ok) {
          const systemMessage = await systemMsgRes.json();
          setMessages((prev) => [...prev, systemMessage]);
          processedIds.current.add(systemMessage.id);
          setTimeout(
            () =>
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
            100,
          );
        }
      } else showToastMsg("Erreur lors du blocage", "error");
    } catch {
      showToastMsg("Erreur de connexion", "error");
    }
    setShowMoreMenu(false);
  };
  const handleUnblockUser = async () => {
    try {
      const res = await fetch(`/api/users/${recipientId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setIsUserBlocked(false); // ← Ajouter cette ligne
        showToastMsg(`${recipientName} a été débloqué`, "success");

        // ✅ ENVOIE UN VRAI MESSAGE SYSTÈME
        const systemMsgRes = await fetch(
          `/api/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `✅ Vous avez débloqué ${recipientName}. Vous pouvez à nouveau lui envoyer des messages.`,
              isSystem: true,
            }),
          },
        );

        if (systemMsgRes.ok) {
          const systemMessage = await systemMsgRes.json();
          setMessages((prev) => [...prev, systemMessage]);
          processedIds.current.add(systemMessage.id);
        }
      } else {
        showToastMsg("Erreur lors du déblocage", "error");
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      showToastMsg("Erreur de connexion", "error");
    }
  };
  const handleConfirmOffer = async () => {
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
        showToastMsg("Offre créée avec succès !", "success");
        setShowOfferCard(false);
        setOfferCreated(true);

        const checkInDate = listing.checkIn
          ? new Date(listing.checkIn)
          : new Date();
        const checkOutDate = listing.checkOut
          ? new Date(listing.checkOut)
          : new Date(checkInDate.getTime() + 86400000);
        const nights = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) / 86400000,
        );
        const formattedCheckIn = checkInDate.toLocaleDateString("fr-FR");
        const formattedCheckOut = checkOutDate.toLocaleDateString("fr-FR");
        const guests = listing.guests || 1;
        const totalPrice = data.offer?.totalPrice || listing.pricePerNight || 0;

        const offerMessage = `${recipientName} a créé une offre de réservation d'une durée de ${nights} nuit${nights > 1 ? "s" : ""} du ${formattedCheckIn} au ${formattedCheckOut} pour ${guests} voyageur${guests > 1 ? "s" : ""} estimée à ${totalPrice.toLocaleString("fr-FR")} TND. Le propriétaire dispose de 24 heures pour répondre.`;

        sendSocketMessage(conversationId, offerMessage, recipientId);
      } else {
        showToastMsg(data.error || "Erreur lors de la création", "error");
      }
    } catch {
      showToastMsg("Erreur de connexion", "error");
    } finally {
      setIsCreatingOffer(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner
          fullScreen={false}
          variant="spinner"
          size="sm"
          color="primary"
          text="Chargement de votre conversation..."
          speed="normal"
        />
      </div>
    );
  }
  const isAdminLocked =
    isClosed && !isChecking && !hasBlockedUser && !isBlockedByRecipient;
  const listingImageUrl = listing?.image
    ? pipListingImage(listing.image)
    : null;

  const checkInDate =
    listing?.checkIn || new Date().toISOString().split("T")[0];
  const checkOutDate =
    listing?.checkOut ||
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const nights = Math.ceil(
    (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
      86400000,
  );
  const totalPrice = (listing?.pricePerNight || 0) * nights;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <Avatar
          src={recipientImage}
          name={recipientName}
          size={38}
          online={isConnected}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
            {recipientName}
          </p>
          {/* Indicateur "en train d'écrire" */}
          {isTyping && isConnected && (
            <div className="flex items-center gap-1 mt-0.5">
              <div className="flex gap-0.5">
                <span
                  className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                {recipientName} est en train d'écrire...
              </span>
            </div>
          )}

          {/* Statut de connexion */}
          {!isTyping && (
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-slate-400"}`}
              ></span>
              <span className="text-[10px] ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}">
                {isConnected ? "En ligne" : "Hors ligne"}
              </span>
            </div>
          )}
          {listingTitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {listingTitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => !isAdminLocked && setShowMoreMenu((p) => !p)}
              disabled={isAdminLocked}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isAdminLocked ? "text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <IoEllipsisVerticalOutline className="text-lg" />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-xl z-30 overflow-hidden">
                <button
                  onClick={handleReportConversation}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors border-b border-slate-100 dark:border-slate-700"
                >
                  <IoFlagOutline className="text-slate-700 dark:text-slate-300 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    Signaler la conversation
                  </span>
                </button>
                <button
                  onClick={handleOpenBlockSheet}
                  disabled={isUserBlocked || blockCooldown}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors border-b border-slate-100 dark:border-slate-700 disabled:opacity-50"
                >
                  <IoBanOutline className="text-slate-700 dark:text-slate-300 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    {isUserBlocked
                      ? "Utilisateur bloqué"
                      : blockCooldown
                        ? `Bloqué (reste ${cooldownRemaining}h)`
                        : "Bloquer cet utilisateur"}
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
        {isAdminLocked && (
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full ml-2">
            Verrouillé
          </span>
        )}
      </div>
      {/* Safety Banner - Style Atlas Algorithm avec dégradé */}
      {isAdminLocked && (
        <div className="sticky top-0 z-40 px-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className=" backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-[0_8px_30px_-6px_rgba(79,70,229,0.2)] border border-red-200/50 dark:border-red-800/30 hover:shadow-[0_12px_40px_-8px_rgba(79,70,229,0.3)] transition-all duration-300">
            <div className="bg-red-500/60 p-2.5 rounded-full shadow-lg shadow-indigo-500/25">
              <IoShieldOutline className="text-white text-xl" />
            </div>
            <div className="flex-1">
              <p className="font-headline font-bold text-sm text-red-700 dark:from-indigo-300 dark:via-violet-300 dark:to-sky-300 bg-clip-text ">
                Algorithme de protection NESTHUB
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-400 leading-relaxed">
                {blockReason ||
                  "Notre système de sécurité a détecté un risque potentiel. Cette discussion est sous surveillance temporaire."}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Bandeau de paiement - uniquement si offre ACCEPTED ET paiement NON effectué */}
      {showPaymentBanner && offerId && (
        <div className="mx-4 mt-2 mb-1 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <IoCardOutline className="text-emerald-600 dark:text-emerald-400 text-sm" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Offre acceptée !
                </p>
                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70">
                  Procédez au paiement pour finaliser votre réservation
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                (window.location.href = `/fr/payment?offerId=${offerId}`)
              }
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-all"
            >
              Payer maintenant
              <IoArrowForwardOutline className="text-xs" />
            </button>
          </div>
        </div>
      )}
      {/* ============================================ */}
      {/* BANDEAUX DE BLOCAGE - STYLE MESSENGER */}
      {/* ============================================ */}

      {/* Cas 2 : La personne t'a bloqué */}
      {!isClosed && isBlockedByRecipient && (
        <div className="mx-4 mt-2 mb-1 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <IoShieldOutline className="text-slate-500 text-sm flex-shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {recipientName} vous a bloqué. Vous ne pouvez plus lui envoyer de
              messages.
            </span>
          </div>
        </div>
      )}
      {/* Info panel (pour le propriétaire) */}
      {isOwner && showInfoPanel && listing && (
        <div className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
              {listingImageUrl && !listingImageErr ? (
                <img
                  src={listingImageUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  onError={() => setListingImageErr(true)}
                />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <IoHomeOutline className="text-slate-400 text-xl" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                {listing.title}
              </p>
              {listing.location && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <IoLocationOutline className="text-xs" />
                  {listing.location}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {listing.pricePerNight && (
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {listing.pricePerNight.toLocaleString("fr-FR")} TND
                    <span className="text-[10px] font-normal text-slate-400">
                      /nuit
                    </span>
                  </span>
                )}
                {listing.bedrooms && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <IoBedOutline className="text-sm" />
                    {listing.bedrooms} ch.
                  </span>
                )}
                {listing.maxGuests && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <IoPeopleOutline className="text-sm" />
                    {listing.maxGuests} pers.
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowInfoPanel(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <IoCloseOutline className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* Blocked notification */}
      {blockedNotification && (
        <div className="mx-3 mt-2 flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl shrink-0">
          <IoShieldOutline className="text-amber-500 text-sm flex-shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400">
            Message bloqué — {blockedNotification}
          </span>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-slate-50/30 dark:bg-slate-800/10">
        {messages.length === 0 && !showOfferCard ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <IoPersonOutline className="text-slate-300 dark:text-slate-600 text-xl" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Aucun message</p>
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
              Soyez le premier à envoyer un message
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwn = msg.senderId !== recipientId;
              const isBlockedConversation = isUserBlocked;
              const isIAModerated =
                msg.isBlocked === true ||
                msg.content?.includes("[Message bloqué");
              const isOfferMessage =
                msg.content.includes("offre de réservation") ||
                msg.content.includes("Offre de réservation");
              const isBookingMessage =
                msg.content.includes("réservation confirmée") ||
                msg.content.includes("Réservation confirmée");

              // 1. MESSAGES SYSTÈME
              if (msg.isSystem) {
                let senderName = "";
                if (isOfferMessage && listingTitle) {
                  senderName = recipientName;
                }
                return (
                  <SystemMessage
                    key={msg.id}
                    content={msg.content}
                    senderName={senderName}
                  />
                );
              }

              // 2. MESSAGES BLOQUÉS PAR L'IA
              if (isIAModerated) {
                const badgePosition = isOwn
                  ? "-top-3 -left-3"
                  : "-top-3 -right-3";
                const blockReason = (msg as any).reason || "";

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {!isOwn && (
                      <div className="flex-shrink-0">
                        <Avatar
                          src={msg.senderImage}
                          name={msg.senderName}
                          size={28}
                        />
                      </div>
                    )}

                    <div
                      className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}
                    >
                      <div
                        className={`relative ${isOwn ? "bg-indigo-500 dark:bg-indigo-600" : "bg-slate-100 dark:bg-slate-800"} p-3 rounded-2xl ${isOwn ? "rounded-br-md" : "rounded-bl-md"} shadow-lg ${isOwn ? "text-white" : "text-slate-700 dark:text-slate-200"}`}
                      >
                        <div
                          className={`absolute ${badgePosition} bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-md border border-white/20 z-10`}
                        >
                          <IoAlertCircleOutline className="text-[10px]" />
                          SIGNALÉ
                        </div>

                        {!isOwn && (
                          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            {msg.senderName}
                          </p>
                        )}

                        <p className="text-sm leading-relaxed opacity-40 select-none blur-[1px]">
                          {msg.content}
                        </p>

                        <div className="mt-2 pt-2 border-t border-wgray-900 dark:border-slate-700 flex items-start gap-2">
                          <IoShieldOutline className="text-[10px] text-gray-700 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="text-[9px] text-gray-700 dark:text-slate-400 italic leading-relaxed">
                            Ce message viole nos conditions de sécurité{" "}
                            {blockReason ? `— ${blockReason}` : ""}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`flex gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <span
                          className="text-[10px] text-slate-400 dark:text-slate-500 cursor-default"
                          title={new Date(msg.createdAt).toLocaleString(
                            "fr-FR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        >
                          {formatDistanceToNow(new Date(msg.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>

                    {isOwn && <div className="w-7 flex-shrink-0" />}
                  </div>
                );
              }

              // 3. MESSAGES NORMAUX
              let messageBgClass = "";
              let messageTextClass = "";

              if (isOwn) {
                messageBgClass = "bg-indigo-500 dark:bg-indigo-600";
                messageTextClass = "text-white";
              } else {
                messageBgClass = "bg-slate-100 dark:bg-slate-800";
                messageTextClass = "text-slate-700 dark:text-slate-200";
              }

              if (!isOwn) {
                if (isBlockedConversation) {
                  messageBgClass =
                    "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800";
                  messageTextClass = "text-red-700 dark:text-red-300";
                } else if (isOfferMessage) {
                  messageBgClass =
                    "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800";
                  messageTextClass = "text-amber-800 dark:text-amber-300";
                } else if (isBookingMessage) {
                  messageBgClass =
                    "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800";
                  messageTextClass = "text-emerald-800 dark:text-emerald-300";
                }
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                  onContextMenu={(e) => isOwn && handleContextMenu(e, msg)}
                >
                  {!isOwn && (
                    <div className="flex-shrink-0">
                      <Avatar
                        src={msg.senderImage}
                        name={msg.senderName}
                        size={28}
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${messageBgClass} ${messageTextClass} ${isOwn ? "rounded-br-md" : "rounded-bl-md"} shadow-sm`}
                  >
                    {msg.replyTo && (
                      <div className="mb-1.5 pb-1.5 border-b border-white/20 dark:border-slate-700 text-[10px] text-white/60 dark:text-slate-400">
                        <span className="font-medium">
                          ↳ Réponse à {msg.replyTo.senderName}:
                        </span>
                        <div className="truncate">{msg.replyTo.content}</div>
                      </div>
                    )}
                    {!isOwn && (
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        {msg.senderName}
                      </p>
                    )}
                    {msg.type === "voice" && msg.voiceUrl ? (
                      <VoiceMessage
                        url={msg.voiceUrl}
                        duration={msg.duration || 0}
                        isOwn={isOwn}
                      />
                    ) : (
                      <>
                        <p className="break-words whitespace-pre-wrap text-[13px]">
                          {msg.content}
                        </p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isOwn ? "text-white/50" : "text-slate-400 dark:text-slate-500"}`}
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
            })}

            {/* Afficher la carte d'offre */}
            {isTenant && listing && showOfferCard && !offerCreated && (
              <OfferCard
                listing={listing}
                checkIn={checkInDate}
                checkOut={checkOutDate}
                guests={listing.guests || 1}
                totalPrice={totalPrice}
                onConfirm={handleConfirmOffer}
                isCreating={isCreatingOffer}
              />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Bottom Sheet style Messenger pour bloquer - dans la zone des messages */}
      {showBlockSheet && (
        <>
          <div
            className="absolute inset-0 bg-black/20 dark:bg-slate-800/50  z-[100] animate-in fade-in duration-200 rounded-xl"
            onClick={() => setShowBlockSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 z-[101] bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            {/* Barre de swipe */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
            </div>

            <div className="px-5 pb-6">
              <div className="flex items-center gap-3 mb-5">
                <Avatar src={recipientImage} name={recipientName} size={48} />
                <div>
                  <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                    Bloquer {recipientName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Vous ne pourrez plus lui envoyer de messages
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 mb-5 border border-amber-200 dark:border-amber-800/50">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Cette action est réversible après 48 heures
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBlockSheet(false)}
                  className="flex-1 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmBlock}
                  className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all active:scale-95 shadow-sm"
                >
                  Bloquer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Input area - Masquée si conversation verrouillée par admin */}
      {!isAdminLocked ? (
        hasBlockedUser ? (
          /* Message de blocage style Messenger */
          <div className="px-4 py-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <IoBanOutline className="text-slate-400 text-xl" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Vous avez bloqué {recipientName}
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Vous ne recevrez plus ses messages
              </p>
              <button
                onClick={handleUnblockUser}
                className="px-4 py-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-all active:scale-95"
              >
                Débloquer
              </button>
            </div>
          </div>
        ) : (
          /* Input normal */
          <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            {replyTo && (
              <ReplyPreview
                replyTo={replyTo}
                onCancel={() => setReplyTo(null)}
              />
            )}

            <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-300 transition-colors">
              <div className="relative self-end pb-0.5" ref={emojiRef}>
                <button
                  onClick={() => setShowEmojiPicker((p) => !p)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <IoHappyOutline className="text-xl" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-2 left-0 z-20">
                    <EmojiPicker
                      onEmojiClick={(emojiData: any) => {
                        setInput((prev) => prev + emojiData.emoji);
                        setShowEmojiPicker(false);
                        inputRef.current?.focus();
                      }}
                      theme={emojiTheme}
                      lazyLoadEmojis
                      searchPlaceholder="Rechercher..."
                      width={300}
                      height={400}
                    />
                  </div>
                )}
              </div>
              <VoiceRecorder
                onSend={handleSendVoice}
                isDisabled={
                  !isConnected ||
                  isUserBlocked ||
                  hasBlockedUser ||
                  isAdminLocked
                }
              />
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
                disabled={
                  !isConnected ||
                  isUserBlocked ||
                  hasBlockedUser ||
                  isAdminLocked
                }
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none min-h-[28px] max-h-[120px] py-0.5"
              />
              <button
                onClick={handleSend}
                disabled={
                  !input.trim() ||
                  isSending ||
                  !isConnected ||
                  isUserBlocked ||
                  hasBlockedUser ||
                  isAdminLocked
                }
                className={`self-end w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 flex-shrink-0 ${input.trim() && !isSending && isConnected && !isUserBlocked ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}
              >
                {isSending ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <IoSendSharp className="text-sm" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
              <IoLockClosedOutline className="text-xs" />
              Messages sécurisés · Ne partagez pas vos informations personnelles
            </p>
          </div>
        )
      ) : (
        /* Footer verrouillé par admin */
        <footer className="p-4 bg-gradient-to-t from-indigo-50/30 via-white/50 to-transparent dark:from-indigo-950/20 dark:via-slate-900/50 shrink-0">
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-5 shadow-[0_-10px_40px_-15px_rgba(79,70,229,0.15)] border border-indigo-100/50 dark:border-indigo-800/30 hover:shadow-[0_-15px_50px_-15px_rgba(79,70,229,0.25)] transition-all duration-300 flex flex-col items-center text-center gap-3">
              <div className="flex items-center gap-3">
                <div className="relative"></div>
                <span className="font-headline font-bold text-sm bg-gradient-to-r from-indigo-700 via-violet-700 to-sky-700 dark:from-indigo-300 dark:via-violet-300 dark:to-sky-300 bg-clip-text text-transparent">
                  Cette conversation est temporairement suspendue pour votre
                  sécurité
                </span>
              </div>

              <p className="text-xs text-black dark:text-white max-w-lg leading-relaxed">
                Afin de protéger vos données personnelles et d'éviter toute
                fraude, le système Atlas a restreint l'envoi de messages. Un
                modérateur NestHub examine actuellement cet échange.
              </p>

              <div className="flex gap-3 w-full sm:w-auto mt-2">
                <button
                  onClick={handleReportConversation}
                  className="group flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] uppercase tracking-wider border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-300 active:scale-95"
                >
                  <span className="flex items-center justify-center gap-2">
                    Signaler un problème
                  </span>
                </button>
                <button
                  onClick={() => window.open("/fr/security/rules", "_blank")}
                  className="group flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 text-white font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-300 active:scale-95"
                >
                  <span className="flex items-center justify-center gap-2">
                    Consulter nos règles
                    <IoArrowForwardOutline className="text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1" />
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-center items-center gap-2">
              <div className="relative">
                <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-500 opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </div>
              <span className="text-[10px] font-bold bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent uppercase tracking-wider animate-pulse">
                Alerte sécurité active
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
