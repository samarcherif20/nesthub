"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { ChatBox } from "@/components/ui/chat/ChatBox";
import { MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Conversation {
  id: string;
  listing: {
    id: string;
    title: string;
    image?: string;
    pricePerNight?: number;
    location?: string;
    bedrooms?: number;
    maxGuests?: number;
    cleaningFee?: number;
  };
  otherUser: {
    id: string;
    name: string;
    image?: string;
  };
  infoRequest?: {
    id: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
  lastMessage?: string;
  unreadCount: number;
}

export default function OwnerMessagesPage() {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Détecter l'écran mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      console.log("🔍 [Owner] Chargement des conversations...");
      const res = await fetch("/api/conversations");
      console.log("🔍 [Owner] Réponse status:", res.status);
      const data = await res.json();
      console.log("🔍 [Owner] Conversations reçues:", data);
      console.log("🔍 [Owner] Nombre de conversations:", data.length);
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    console.log("🔍 [Owner] Conversation sélectionnée:", conv);
    setSelectedConv(conv);
    if (isMobileView) {
      setShowChat(true);
    }
  };

  const handleBack = () => {
    setShowChat(false);
    setSelectedConv(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // Vue mobile
  if (isMobileView) {
    return (
      <div className="h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
        {showChat && selectedConv ? (
          <>
            <div className="flex items-center gap-3 p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100">
                {selectedConv.otherUser.image ? (
                  <img
                    src={selectedConv.otherUser.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full font-bold text-sm">
                    {selectedConv.otherUser.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium">{selectedConv.otherUser.name}</p>
                <p className="text-xs text-slate-500">
                  {selectedConv.listing.title}
                </p>
              </div>
            </div>
            <ChatBox
              conversationId={selectedConv.id}
              recipientId={selectedConv.otherUser.id}
              recipientName={selectedConv.otherUser.name}
              recipientImage={selectedConv.otherUser.image}
              listingTitle={selectedConv.listing.title}
              listing={{
                id: selectedConv.listing.id,
                title: selectedConv.listing.title,
                image: selectedConv.listing.image,
                pricePerNight: selectedConv.listing.pricePerNight,
                location: selectedConv.listing.location,
                bedrooms: selectedConv.listing.bedrooms,
                maxGuests: selectedConv.listing.maxGuests,
                cleaningFee: selectedConv.listing.cleaningFee,
                infoRequestId: selectedConv.infoRequest?.id,
              }}
              userRole="PROPERTY_OWNER"
            />
          </>
        ) : (
          <ConversationList
            conversations={conversations}
            onSelect={handleSelectConversation}
            selectedId={selectedConv?.id}
          />
        )}
      </div>
    );
  }

  // Vue desktop (side-by-side)
  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Liste des conversations - 30% */}
      <div className="w-[30%] min-w-[280px] bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Messages
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {conversations.length} conversation
            {conversations.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="overflow-y-auto h-[calc(100%-73px)]">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucune conversation</p>
              <p className="text-xs text-slate-400 mt-1">
                Les messages avec les locataires apparaîtront ici
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 ${
                  selectedConv?.id === conv.id
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500"
                    : ""
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                    {conv.otherUser.image ? (
                      <img
                        src={conv.otherUser.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full font-bold text-slate-600">
                        {conv.otherUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {conv.otherUser.name}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {conv.listing.title}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-xs text-slate-400 truncate mt-1">
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Zone de chat - 70% */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        {selectedConv ? (
          <ChatBox
            conversationId={selectedConv.id}
            recipientId={selectedConv.otherUser.id}
            recipientName={selectedConv.otherUser.name}
            recipientImage={selectedConv.otherUser.image}
            listingTitle={selectedConv.listing.title}
            listing={{
              id: selectedConv.listing.id,
              title: selectedConv.listing.title,
              image: selectedConv.listing.image,
              pricePerNight: selectedConv.listing.pricePerNight,
              location: selectedConv.listing.location,
              bedrooms: selectedConv.listing.bedrooms,
              maxGuests: selectedConv.listing.maxGuests,
              cleaningFee: selectedConv.listing.cleaningFee,
              infoRequestId: selectedConv.infoRequest?.id,
            }}
            userRole="PROPERTY_OWNER"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Sélectionnez une conversation</p>
              <p className="text-sm mt-1">pour commencer à discuter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant liste des conversations (pour mobile)
function ConversationList({
  conversations,
  onSelect,
  selectedId,
}: {
  conversations: Conversation[];
  onSelect: (conv: Conversation) => void;
  selectedId?: string;
}) {
  return (
    <div className="h-full bg-white dark:bg-slate-900">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Messages
        </h2>
      </div>
      <div className="overflow-y-auto h-[calc(100%-73px)]">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucune conversation</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
            >
              <div className="flex gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                  {conv.otherUser.image ? (
                    <img
                      src={conv.otherUser.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full font-bold text-slate-600 text-lg">
                      {conv.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {conv.otherUser.name}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {conv.listing.title}
                  </p>
                  {conv.lastMessage && (
                    <p className="text-xs text-slate-400 truncate mt-1">
                      {conv.lastMessage}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
