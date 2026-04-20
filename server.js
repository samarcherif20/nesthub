/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: ".env.local" });
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Stockage temporaire des utilisateurs connectés
const userSockets = new Map();

// 🔥 MODÈLES IA GLOBAUX
let toxicityClassifier = null;
let nerClassifier = null;
let intentClassifier = null;

// Variable pour l'instance socket.io (sera exposée à l'API)
let globalIo = null;

// 🔥 FONCTION POUR CHARGER TOUS LES MODÈLES AU DÉMARRAGE
async function preloadAIModel() {
  console.log("🤖 [PRELOAD] Chargement des modèles IA au démarrage...");
  console.log("⏳ Cela peut prendre 30-60 secondes la première fois...");

  try {
    const { pipeline } = await import("@xenova/transformers");

    console.log("📦 Chargement du modèle de toxicité...");
    const startTime1 = Date.now();
    toxicityClassifier = await pipeline(
      "text-classification",
      "Xenova/toxic-bert",
    );
    console.log(`✅ Modèle toxicité chargé en ${Date.now() - startTime1}ms`);

    console.log("📦 Chargement du modèle NER multilingue...");
    const startTime2 = Date.now();
    nerClassifier = await pipeline(
      "token-classification",
      "Xenova/bert-base-multilingual-cased-ner-hrl",
    );
    console.log(`✅ Modèle NER chargé en ${Date.now() - startTime2}ms`);

    console.log("📦 Chargement du modèle Zero-shot...");
    const startTime3 = Date.now();
    intentClassifier = await pipeline(
      "zero-shot-classification",
      "Xenova/nli-deberta-v3-xsmall",
    );
    console.log(`✅ Modèle Zero-shot chargé en ${Date.now() - startTime3}ms`);

    global.toxicityClassifier = toxicityClassifier;
    global.nerClassifier = nerClassifier;
    global.intentClassifier = intentClassifier;

    console.log("✅ [PRELOAD] Tous les modèles IA chargés avec succès");
  } catch (error) {
    console.error("❌ [PRELOAD] Erreur préchargement IA:", error);
  }
}

// 🔥 Fonction pour détecter les messages vocaux
function isVoiceMessage(content) {
  return (
    content === "🎤 Message vocal" ||
    content === "[Message vocal]" ||
    content?.startsWith("🎤")
  );
}

// Fonction pour obtenir l'instance io (exposée à l'API)
function getIo() {
  return globalIo;
}

app.prepare().then(async () => {
  console.log("⏳ Démarrage du serveur, chargement des modèles IA...");
  await preloadAIModel();

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
    console.log("✅ Client connecté:", socket.id);

    const userId = socket.handshake.auth.userId;
    let currentConversationId = null;

    if (userId) {
      userSockets.set(socket.id, { userId, conversationId: null });
      console.log(`🔐 User ${userId} associé au socket ${socket.id}`);
    }

    // Rejoindre une conversation
    socket.on("join-conversation", (conversationId) => {
      if (!conversationId) {
        console.error("❌ join-conversation: conversationId manquant");
        return;
      }

      if (currentConversationId) {
        const oldRoom = `conv:${currentConversationId}`;
        socket.leave(oldRoom);
        console.log(`📤 Socket ${socket.id} a quitté ${oldRoom}`);
      }

      const roomName = `conv:${conversationId}`;
      socket.join(roomName);
      currentConversationId = conversationId;

      const userData = userSockets.get(socket.id);
      if (userData) {
        userData.conversationId = conversationId;
        userSockets.set(socket.id, userData);
      }

      console.log(`📌 Socket ${socket.id} a rejoint ${roomName}`);

      socket.emit("joined-conversation", {
        conversationId,
        room: roomName,
      });
    });

    // Envoyer un message
    socket.on("send-message", async (data) => {
      console.log("\n========== SOCKET: NOUVEAU MESSAGE ==========");
      console.log(`📤 Message reçu: ${data.content}`);
      console.log(`📨 Conversation: ${data.conversationId}`);
      console.log(`📨 Sender: ${data.userId}`);
      console.log(`📨 Type: ${data.type || "text"}`);

      let finalContent = data.content;
      let isBlocked = false;
      let blockedReason = null;

      const voiceMsg = isVoiceMessage(data.content) || data.type === "voice";

      if (voiceMsg) {
        console.log("🎤 [VOICE] Message vocal - skip modération");
      } else {
        try {
          console.log("🛡️ [REGEX] Vérification...");

          const phonePatterns = [
            /[0-9]{8}/,
            /[0-9]{2}[ \-\s][0-9]{2}[ \-\s][0-9]{2}[ \-\s][0-9]{2}/,
            /[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{2}/,
            /\+216[0-9]{8}/,
          ];

          if (phonePatterns.some((p) => p.test(data.content))) {
            isBlocked = true;
            blockedReason = "Numéro de téléphone détecté";
            finalContent = `[Message bloqué - ${blockedReason}]`;
            console.log(`🛡️ [REGEX] BLOQUÉ: ${blockedReason}`);
            socket.emit("message-blocked", { reason: blockedReason });
          } else if (
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(data.content)
          ) {
            isBlocked = true;
            blockedReason = "Adresse email détectée";
            finalContent = `[Message bloqué - ${blockedReason}]`;
            console.log(`🛡️ [REGEX] BLOQUÉ: ${blockedReason}`);
            socket.emit("message-blocked", { reason: blockedReason });
          } else if (/(https?:\/\/[^\s]+)/g.test(data.content)) {
            isBlocked = true;
            blockedReason = "Lien externe détecté";
            finalContent = `[Message bloqué - ${blockedReason}]`;
            console.log(`🛡️ [REGEX] BLOQUÉ: ${blockedReason}`);
            socket.emit("message-blocked", { reason: blockedReason });
          } else {
            let classifier = global.toxicityClassifier;
            let intent = global.intentClassifier;

            if (!classifier) {
              const { pipeline } = await import("@xenova/transformers");
              classifier = await pipeline(
                "text-classification",
                "Xenova/toxic-bert",
              );
              intent = await pipeline(
                "zero-shot-classification",
                "Xenova/nli-deberta-v3-xsmall",
              );
              global.toxicityClassifier = classifier;
              global.intentClassifier = intent;
            }

            if (intent) {
              console.log("🛡️ [IA-INTENT] Analyse des intentions...");
              const intentLabels = [
                "demander un rendez-vous",
                "proposer une rencontre",
                "donner des coordonnées",
                "planifier une visite",
                "contact personnel",
              ];
              const intentResult = await intent(data.content, intentLabels);
              console.log(`📊 Intent scores:`, intentResult.scores);

              if (intentResult.scores[0] > 0.7) {
                isBlocked = true;
                blockedReason = "Tentative de rendez-vous ou contact";
                finalContent = `[Message bloqué - ${blockedReason}]`;
                console.log(`🛡️ [IA-INTENT] BLOQUÉ: ${blockedReason}`);
                socket.emit("message-blocked", { reason: blockedReason });
              }
            }

            if (!isBlocked && classifier) {
              console.log("🛡️ [IA-TOXIC] Analyse de toxicité...");
              const toxicResults = await classifier(data.content);
              const badResult = toxicResults.find(
                (r) => r.label === "toxic" && r.score > 0.7,
              );
              if (badResult) {
                isBlocked = true;
                blockedReason = `Contenu inapproprié (${badResult.label})`;
                finalContent = `[Message bloqué - ${blockedReason}]`;
                console.log(
                  `🛡️ [IA-TOXIC] BLOQUÉ: ${badResult.label} (${badResult.score})`,
                );
                socket.emit("message-blocked", { reason: blockedReason });
              }
            }
          }
        } catch (error) {
          console.error("❌ Erreur modération:", error);
        }
      }

      const senderId = data.userId;

      if (!senderId || senderId === "unknown") {
        console.error("❌ Impossible de sauvegarder: userId manquant");
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
          console.error(`❌ Conversation ${data.conversationId} non trouvée`);
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
          console.error(`❌ Utilisateur ${senderId} non trouvé en DB`);
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

        console.log(`💾 Message sauvegardé en DB (ID: ${message.id})`);

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
        console.error("❌ Erreur sauvegarde DB:", dbError);
      }

      console.log("===========================================\n");
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
          `❌ Client déconnecté: ${socket.id} (User: ${userData.userId})`,
        );
      } else {
        console.log(`❌ Client déconnecté: ${socket.id}`);
      }
      userSockets.delete(socket.id);
    });
  });

  httpServer.listen(3000, (err) => {
    if (err) throw err;
    console.log("🚀 Serveur prêt sur http://localhost:3000");
    console.log("🔌 Socket.io actif sur /api/socket");
    console.log("✅ Tous les modèles IA préchargés et prêts à l'emploi");
  });
});

// Exporter pour l'API
module.exports = { getIo: () => globalIo };
