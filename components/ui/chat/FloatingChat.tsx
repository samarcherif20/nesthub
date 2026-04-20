// components/chat/FloatingChat.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { MessageSquare, X } from "lucide-react";
import { ChatBox } from "./ChatBox";

interface Conversation {
  id: string;
  listing: { id: string; title: string };
  otherUser: { id: string; name: string; image?: string };
  lastMessage?: string;
  unreadCount: number;
}

// Composant ConversationList intégré
function ConversationList({ 
  conversations, 
  onSelect,
  selectedId 
}: { 
  conversations: Conversation[]; 
  onSelect: (conv: Conversation) => void;
  selectedId?: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">Aucune conversation</p>
        <p className="text-xs mt-1">Vos messages apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv)}
          className={`w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 ${
            selectedId === conv.id ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
          }`}
        >
          <div className="flex gap-3">
            {/* Avatar */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
              {conv.otherUser.image ? (
                <img src={conv.otherUser.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full font-bold text-slate-600">
                  {conv.otherUser.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                  {conv.otherUser.name}
                </p>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">{conv.listing.title}</p>
              {conv.lastMessage && (
                <p className="text-xs text-slate-400 truncate mt-1">{conv.lastMessage}</p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function FloatingChat() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  // Charger les conversations
  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      try {
        const res = await fetch("/api/conversations");
        const data = await res.json();
        setConversations(data);
        
        // Calculer le total des messages non lus
        const unread = data.reduce((acc: number, conv: Conversation) => acc + (conv.unreadCount || 0), 0);
        setTotalUnread(unread);
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
  };

  const handleBack = () => {
    setSelectedConv(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedConv(null);
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all z-40"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[550px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {selectedConv ? (
              <>
                <button
                  onClick={handleBack}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  ← Retour
                </button>
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100">
                    {selectedConv.otherUser.image ? (
                      <img src={selectedConv.otherUser.image} alt="" className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full font-bold text-sm">
                        {selectedConv.otherUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedConv.otherUser.name}</p>
                    <p className="text-xs text-slate-500">{selectedConv.listing.title}</p>
                  </div>
                </div>
                <div className="w-8" /> {/* Espace pour équilibrer */}
              </>
            ) : (
              <>
                <h3 className="font-bold text-slate-900 dark:text-white">Messages</h3>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
              </div>
            ) : selectedConv ? (
              <ChatBox
                conversationId={selectedConv.id}
                recipientId={selectedConv.otherUser.id}
                recipientName={selectedConv.otherUser.name}
                recipientImage={selectedConv.otherUser.image}
                listingTitle={selectedConv.listing.title}
              />
            ) : (
              <ConversationList
                conversations={conversations}
                onSelect={handleSelectConversation}
                selectedId={selectedConv?.id}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}