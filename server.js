/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: ".env.local" });
process.env.NEXT_DISABLE_TURBOPACK = "1";
const hostname = "0.0.0.0";

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

//  IMPORT DU MODULE DE MODÉRATION (remplace tout l'ancien code IA)
const { moderateMessage } = require("./lib/moderation");

//  AUGMENTER LA LIMITE DES UPLOADS
const express = require("express");
const expressApp = express(); // ← Renommé pour éviter conflit

expressApp.use(express.json({ limit: "50mb" }));
expressApp.use(express.urlencoded({ limit: "50mb", extended: true }));


const prisma = new PrismaClient();
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname });
const handle = app.getRequestHandler();

// Stockage temporaire des utilisateurs connectés
const userSockets = new Map();

// Variable pour l'instance socket.io (sera exposée à l'API)
let globalIo = null;

//  Fonction pour détecter les messages vocaux (gardée)
function isVoiceMessage(content) {
  return (
    content === " Message vocal" ||
    content === "[Message vocal]" ||
    content?.startsWith("🎤")
  );
}

// Fonction pour obtenir l'instance io (exposée à l'API)
function getIo() {
  return globalIo;
}

app.prepare().then(async () => {
  console.log(" Démarrage du serveur...");
  console.log(" Module de modération importé depuis lib/moderation.js");

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  // Stocker l'instance io globalement
  globalIo = io;
  global.io = io; // Pour l'API

  io.on("connection", (socket) => {
    console.log(" Client connecté:", socket.id);

    const userId = socket.handshake.auth.userId;
    let currentConversationId = null;

    if (userId) {
      userSockets.set(socket.id, { userId, conversationId: null });
      console.log(` User ${userId} associé au socket ${socket.id}`);
    }

    // Rejoindre une conversation
    socket.on("join-conversation", (conversationId) => {
      if (!conversationId) {
        console.error(" join-conversation: conversationId manquant");
        return;
      }

      if (currentConversationId) {
        const oldRoom = `conv:${currentConversationId}`;
        socket.leave(oldRoom);
        console.log(` Socket ${socket.id} a quitté ${oldRoom}`);
      }

      const roomName = `conv:${conversationId}`;
      socket.join(roomName);
      currentConversationId = conversationId;

      const userData = userSockets.get(socket.id);
      if (userData) {
        userData.conversationId = conversationId;
        userSockets.set(socket.id, userData);
      }

      console.log(` Socket ${socket.id} a rejoint ${roomName}`);

      socket.emit("joined-conversation", {
        conversationId,
        room: roomName,
      });
    });

    // Envoyer un message
    socket.on("send-message", async (data) => {
      console.log("\n========== SOCKET: NOUVEAU MESSAGE ==========");
      console.log(` Message reçu: ${data.content}`);
      console.log(` Conversation: ${data.conversationId}`);
      console.log(` Sender: ${data.userId}`);
      console.log(` Type: ${data.type || "text"}`);

      let finalContent = data.content;
      let isBlocked = false;
      let blockedReason = null;

      const voiceMsg = isVoiceMessage(data.content) || data.type === "voice";

      if (voiceMsg) {
        console.log(" [VOICE] Message vocal - skip modération");
      } else {
        try {
          // ==========================================
          //  MODÉRATION AVEC LE MODULE EXTERNE
          // ==========================================
          console.log(" [MODERATION] Analyse du message...");

          const result = await moderateMessage(data.content, data.userId);

          if (result.isBlocked) {
            isBlocked = true;
            blockedReason = result.reason;
            finalContent = result.content;
            socket.emit("message-blocked", {
              reason: blockedReason,
              category: result.category,
              confidence: result.confidence,
            });
            console.log(
              ` [MODERATION] BLOQUÉ: ${result.reason} (${result.category})`,
            );
          } else {
            console.log(
              ` [MODERATION] AUTORISÉ (confiance: ${result.confidence})`,
            );
          }
        } catch (error) {
          console.error(" Erreur modération:", error);
        }
      }

      const senderId = data.userId;

      if (!senderId || senderId === "unknown") {
        console.error(" Impossible de sauvegarder: userId manquant");
        io.to(`conv:${data.conversationId}`).emit("new-message", {
          id: Date.now().toString(),
          content: finalContent,
          senderId: "unknown",
          senderName: "Utilisateur",
          senderImage: null,
          createdAt: new Date().toISOString(),
          isBlocked,
          isRead: false,
          type: voiceMsg ? "voice" : "text",
          voiceUrl: data.voiceUrl,
          duration: data.duration,
        });
        return;
      }

      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: data.conversationId },
          select: { id: true, ownerId: true, tenantId: true },
        });

        if (!conversation) {
          console.error(` Conversation ${data.conversationId} non trouvée`);
          return;
        }

        let sender = await prisma.user.findUnique({
          where: { clerkId: senderId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
          },
        });

        if (!sender) {
          sender = await prisma.user.findUnique({
            where: { id: senderId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
            },
          });
        }

        if (!sender) {
          console.error(` Utilisateur ${senderId} non trouvé en DB`);
          return;
        }

        let receiverId = data.receiverId;
        if (!receiverId) {
          receiverId =
            conversation.ownerId === sender.id
              ? conversation.tenantId
              : conversation.ownerId;
        }

        const messageData = {
          conversationId: data.conversationId,
          senderId: sender.id,
          receiverId: receiverId,
          content: finalContent,
          isBlocked,
          blockedReason,
          type: voiceMsg ? "voice" : "text",
        };

        if (voiceMsg && data.voiceUrl) {
          messageData.voiceUrl = data.voiceUrl;
          messageData.duration = data.duration || 0;
        }

        const message = await prisma.message.create({
          data: messageData,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
          },
        });

        console.log(` Message sauvegardé en DB (ID: ${message.id})`);

        const formattedMessage = {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          senderName:
            `${message.sender.firstName || ""} ${message.sender.lastName || ""}`.trim(),
          senderImage: message.sender.profilePictureUrl,
          createdAt: message.createdAt.toISOString(),
          isBlocked: message.isBlocked,
          isRead: message.isRead,
          type: message.type,
          voiceUrl: message.voiceUrl,
          duration: message.duration,
        };

        const roomName = `conv:${data.conversationId}`;
        console.log(`📡 Émission du message à la room: ${roomName}`);
        io.to(roomName).emit("new-message", formattedMessage);
      } catch (dbError) {
        console.error(" Erreur sauvegarde DB:", dbError);
      }

    });

    socket.on("typing-start", (data) => {
      socket.to(`conv:${data.conversationId}`).emit("user-typing", data);
    });

    socket.on("typing-stop", (data) => {
      socket.to(`conv:${data.conversationId}`).emit("user-stop-typing", data);
    });

    socket.on("disconnect", () => {
      const userData = userSockets.get(socket.id);
      if (userData) {
        console.log(
          ` Client déconnecté: ${socket.id} (User: ${userData.userId})`,
        );
      } else {
        console.log(` Client déconnecté: ${socket.id}`);
      }
      userSockets.delete(socket.id);
    });
  });

  httpServer.listen(3000, hostname, (err) => {
    if (err) throw err;
    console.log(` Serveur prêt sur http://${hostname}:3000`);
    console.log(" Socket.io actif sur /api/socket");
    console.log(" Modération IA active (GPT-4o-mini)");
  });
});

// Exporter pour l'API
module.exports = { getIo: () => globalIo };
