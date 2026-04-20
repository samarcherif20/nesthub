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

export function useChatSocket() {
  const { user } = useUser();
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const currentConvRef = useRef<string | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const userId = user?.id;

    const socketInstance = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { userId: userId },
    });

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      console.log("🔌 Socket connected:", socketInstance.id);
      setIsConnected(true);

      // 🔥 RECONNEXION : Rejoindre automatiquement la conversation précédente
      if (currentConvRef.current) {
        console.log(
          `🔄 Reconnexion - Rejoin conversation: ${currentConvRef.current}`,
        );
        socketInstance.emit("join-conversation", currentConvRef.current);
      }
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connect error:", error.message);
    });

    socketInstance.on("new-message", (message: Message) => {
      console.log("📩 New message received via socket:", message);
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socketInstance.on("message-blocked", (data) => {
      console.log("🛡️ Message blocked:", data);
    });

    socketInstance.on("user-typing", ({ userId, name }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(userId);
        return newSet;
      });
      setTimeout(() => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }, 2000);
    });

    socketInstance.on("user-stop-typing", ({ userId }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    Promise.resolve().then(() => {
      setSocket(socketInstance);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id]);

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current && conversationId !== currentConvRef.current) {
      currentConvRef.current = conversationId;
      socketRef.current.emit("join-conversation", conversationId);
      console.log(`📌 Joined conversation: ${conversationId}`);
    }
  }, []);

  const sendMessage = useCallback(
    (conversationId: string, content: string, receiverId?: string) => {
      if (socketRef.current && content.trim()) {
        console.log(
          `📤 Sending message via socket to ${conversationId}: ${content}`,
        );
        socketRef.current.emit("send-message", {
          conversationId,
          content,
          userId: user?.id,
          receiverId: receiverId,
        });
      }
    },
    [user?.id],
  );

  const startTyping = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("typing-start", { conversationId });
    }
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("typing-stop", { conversationId });
    }
  }, []);

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
