import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import io from "socket.io-client";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  createdAt: string;
  isBlocked: boolean;
  isRead: boolean;
}

let socketInstance: any = null;
let socketInitialized = false;

export function useChatSocket() {
  const { user } = useUser();
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const currentConvRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Si pas d'utilisateur, on ne fait rien
    if (!user?.id) return;

    // SI LE SOCKET EXISTE DÉJÀ, ON LE RÉUTILISE
    if (socketInstance) {
      setSocket(socketInstance);
      setIsConnected(socketInstance.connected);

      // Si le socket n'est pas connecté, on le reconnecte
      if (!socketInstance.connected) {
        socketInstance.connect();
      }
      return;
    }

    // CRÉER LE SOCKET UNE SEULE FOIS
    const userId = user?.id;
    socketInstance = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { userId: userId },
    });

    socketInstance.on("connect", () => {
      console.log("🔌 Socket connected:", socketInstance.id);
      if (isMountedRef.current) {
        setIsConnected(true);
        setSocket(socketInstance);
      }

      if (currentConvRef.current) {
        console.log(
          ` Reconnexion - Rejoin conversation: ${currentConvRef.current}`,
        );
        socketInstance.emit("join-conversation", currentConvRef.current);
      }
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      if (isMountedRef.current) {
        setIsConnected(false);
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connect error:", error.message);
    });

    socketInstance.on("new-message", (message: Message) => {
      console.log(" New message received via socket:", message);
      if (isMountedRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    socketInstance.on("message-blocked", (data) => {
      console.log(" Message blocked:", data);
    });

    socketInstance.on("user-typing", ({ userId, name }) => {
      console.log(" [TYPING] user-typing reçu:", { userId, name });

      if (isMountedRef.current) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.add(userId);
          return newSet;
        });

        setTimeout(() => {
          if (isMountedRef.current) {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(userId);
              return newSet;
            });
          }
        }, 3000);
      }
    });

    socketInstance.on("user-stop-typing", ({ userId }) => {
      console.log(" [TYPING] user-stop-typing reçu:", { userId });

      if (isMountedRef.current) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    });

    // Stocker le socket dans le state
    setSocket(socketInstance);

    // NE PAS DÉCONNECTER LE SOCKET ICI !
    // On garde le socket actif pour les autres composants
    return () => {
      isMountedRef.current = false;
      // ON NE DÉCONNECTE PAS LE SOCKET
      // socketInstance reste actif
    };
  }, [user?.id]); // Seulement quand l'utilisateur change

  const joinConversation = useCallback((conversationId: string) => {
    if (socketInstance && conversationId !== currentConvRef.current) {
      currentConvRef.current = conversationId;
      socketInstance.emit("join-conversation", conversationId);
      console.log(` Joined conversation: ${conversationId}`);
    }
  }, []);

  const sendMessage = useCallback(
    (conversationId: string, content: string, receiverId?: string) => {
      if (socketInstance && content.trim()) {
        console.log(
          ` Sending message via socket to ${conversationId}: ${content}`,
        );
        socketInstance.emit("send-message", {
          conversationId,
          content,
          userId: user?.id,
          receiverId: receiverId,
        });
      }
    },
    [user?.id],
  );

  const startTyping = useCallback(
    (conversationId: string) => {
      if (socketInstance && isConnected) {
        console.log("[SOCKET] startTyping émis pour:", conversationId);
        socketInstance.emit("typing", { conversationId });
      }
    },
    [isConnected],
  );

  const stopTyping = useCallback(
    (conversationId: string) => {
      if (socketInstance && isConnected) {
        console.log(" [SOCKET] stopTyping émis pour:", conversationId);
        socketInstance.emit("stop-typing", { conversationId });
      }
    },
    [isConnected],
  );

  const resetMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    socket,
    isConnected,
    messages,
    typingUsers,
    joinConversation,
    sendMessage,
    startTyping,
    stopTyping,
    setMessages,
    resetMessages,
  };
}
