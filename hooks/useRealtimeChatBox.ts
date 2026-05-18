"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

interface ChatBoxStatus {
  isClosed: boolean;
  status: string;
  isBlocked: boolean;
  blockReason: string | null;
  isUserBlocked: boolean;
  hasBlockedUser: boolean;
  lastUpdate?: Date;
}

export function useRealtimeChatBox(conversationId: string, recipientId?: string) {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [chatBoxStatus, setChatBoxStatus] = useState<ChatBoxStatus>({
    isClosed: false,
    status: "OPEN",
    isBlocked: false,
    blockReason: null,
    isUserBlocked: false,
    hasBlockedUser: false
  });
  
  const [isChecking, setIsChecking] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Récupérer l'ID utilisateur depuis clerk
  useEffect(() => {
    if (clerkUser?.id) {
      setCurrentUserId(clerkUser.id);
    }
  }, [clerkUser]);

  const checkStatus = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const token = await getToken();
      
      // 1. Vérifier le statut de la conversation (modération)
      const convResponse = await fetch(`/api/conversations/${conversationId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let isClosedByModeration = false;
      let convData = null;
      
      if (convResponse.ok) {
        convData = await convResponse.json();
        isClosedByModeration = convData.isClosed;
      }
      
      // 2. Vérifier les blocages utilisateur (si recipientId est fourni)
      let isClosedByBlock = false;
      let blockReasonText = null;
      let hasBlockedUser = false;
      let isBlockedByUser = false;
      
      if (recipientId && currentUserId) {
        const blockResponse = await fetch(`/api/users/block-status?userId=${recipientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (blockResponse.ok) {
          const blockData = await blockResponse.json();
          hasBlockedUser = blockData.hasBlockedUser;
          isBlockedByUser = blockData.isBlockedByUser;
          isClosedByBlock = hasBlockedUser || isBlockedByUser;
          
          if (hasBlockedUser) {
            blockReasonText = `Vous avez bloqué ${blockData.recipientName}. Débloquez cet utilisateur pour lui envoyer des messages.`;
          } else if (isBlockedByUser) {
            blockReasonText = `${blockData.recipientName} vous a bloqué. Vous ne pouvez plus lui envoyer de messages.`;
          }
        }
      }
      
      // La chatbox est fermée si modération OU blocage utilisateur
      const isClosed = isClosedByModeration ;
      const finalBlockReason = convData?.blockReason || blockReasonText;
      
      setChatBoxStatus({
        isClosed,
        status: convData?.status || "OPEN",
        isBlocked: convData?.isBlocked || false,
        blockReason: finalBlockReason,
        isUserBlocked: isBlockedByUser,
        hasBlockedUser: hasBlockedUser
      });
      
      setIsChecking(false);
    } catch (error) {
      console.error("Error checking status:", error);
      setIsChecking(false);
    }
  }, [conversationId, recipientId, getToken, currentUserId]);

  // Polling toutes les 3 secondes
  useEffect(() => {
    if (!conversationId) return;

    checkStatus();

    intervalRef.current = setInterval(() => {
      checkStatus();
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [conversationId, checkStatus]);

  return {
    chatBoxStatus,
    isChecking,
    isClosed: chatBoxStatus.isClosed,
    blockReason: chatBoxStatus.blockReason,
    status: chatBoxStatus.status,
    isUserBlocked: chatBoxStatus.isUserBlocked,
    hasBlockedUser: chatBoxStatus.hasBlockedUser
  };
}