// hooks/useAdminUsers.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  User,
  UserActionLog,
  StatsData,
  PaginationData,
  UserFilters,
  EscalationLevel,
} from "@/lib/types/user";
import { useEmailNotification } from "@/hooks/useEmailNotifications";

export function useAdminUsers() {
  const { getToken } = useAuth();
  const { sendNotification } = useEmailNotification();

  // États données
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [actions, setActions] = useState<UserActionLog[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<
    string | undefined
  >(undefined);
  // Filtres
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: "ALL",
    status: "ALL",
    verificationStatus: "ALL",
    dateFrom: "",
    dateTo: "",
    minReliability: "",
    maxFraud: "",
  });

  // Sélection
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Visibilité des modales
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showLockUnlockModal, setShowLockUnlockModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showActionsHistory, setShowActionsHistory] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  // --- Fetch data ---
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: "my-app-template" });
      if (!token) throw new Error("Token non disponible");

      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, v]) => v && v !== "ALL" && v !== "",
        ),
      );

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...activeFilters,
      });

      console.log("📡 fetchUsers URL:", `/api/admin/users?${params}`);

      const res = await fetch(`/api/admin/users?${params}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📡 fetchUsers status:", res.status);

      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      console.log("✅ fetchUsers data:", data);

      data.users.forEach((u: User) => {
        if (u.email === "samar.cherif11@gmail.com") {
          console.log("🔍 UTILISATEUR CIBLÉ:", {
            id: u.id,
            email: u.email,
            escalationLevel: u.escalationLevel,
            status: u.status,
          });
        }
      });

      setUsers(data.users);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (err) {
      console.error("❌ fetchUsers error:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [getToken, filters, pagination.page, pagination.limit]);

  // 2. MODIFIE la fonction fetchActions pour accepter un userId
  const fetchActions = useCallback(
    async (page = 1, limit = 10, actionType?: string, userId?: string) => {
      try {
        const token = await getToken({ template: "my-app-template" });
        if (!token) {
          console.error("❌ Token non disponible pour fetchActions");
          return;
        }

        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (actionType && actionType !== "ALL") {
          params.append("actionType", actionType);
        }

        // ✅ AJOUTE CETTE LIGNE - Filtrer par userId si présent
        const targetUserId = userId || selectedUserForHistory;
        if (targetUserId) {
          params.append("userId", targetUserId);
        }

        console.log(
          "📡 fetchActions URL:",
          `/api/admin/users/actions?${params}`,
        );

        const res = await fetch(`/api/admin/users/actions?${params}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          console.log("✅ Actions reçues:", data);
          setActions(data.actions);
        } else {
          const error = await res.text();
          console.error("❌ Erreur fetchActions:", error);
        }
      } catch (error) {
        console.error("❌ Exception fetchActions:", error);
      }
    },
    [getToken, selectedUserForHistory],
  );

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    fetchUsers();
    fetchActions(1, 10, undefined, selectedUserForHistory);
  }, [fetchUsers, fetchActions, selectedUserForHistory]);

  useEffect(() => {
    fetchUsers();
    fetchActions(1, 10, undefined, selectedUserForHistory);
  }, [fetchUsers, fetchActions, refreshKey, selectedUserForHistory]);
  // --- Handlers d'actions API AVEC NOTIFICATIONS EMAIL ---

  const handleSuspend = async (
    userId: string,
    duration: number,
    reason: string,
    motif: string,
    notify: boolean,
  ) => {
    try {
      console.log("🚀 handleSuspend appelé avec:", {
        userId,
        duration,
        reason,
        motif,
        notify,
      });

      const token = await getToken({ template: "my-app-template" });
      console.log("🔑 Token récupéré:", token ? "OK" : "NULL");

      if (!token) {
        setError("Token non disponible");
        return;
      }

      const body = JSON.stringify({
        userId,
        action: "SUSPEND",
        duration,
        reason,
        motif,
        notify,
      });
      console.log("📦 Body envoyé:", body);

      const res = await fetch("/api/admin/users/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body,
      });

      console.log("📡 Réponse status:", res.status);

      const responseText = await res.text();
      console.log("📡 Réponse brute:", responseText);

      if (res.ok) {
        const data = JSON.parse(responseText);
        console.log("✅ Succès:", data);

        if (notify) {
          try {
            await sendNotification({
              userId,
              actionType: "SUSPEND",
              reason,
              motif,
              duration,
            });
            console.log("📧 Notification de suspension envoyée");
          } catch (emailError) {
            console.error("❌ Erreur envoi email suspension:", emailError);
          }
        }

        setSuccess("Utilisateur suspendu avec succès");
        refresh();
        setShowSuspendModal(false);
      } else {
        let errorMessage = "Erreur lors de la suspension";
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        console.log("❌ Erreur API:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.log("💥 Erreur catch:", err);
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleBan = async (userId: string, reason: string, motif: string) => {
    try {
      console.log("🚀 handleBan appelé avec:", { userId, reason, motif });

      const token = await getToken({ template: "my-app-template" });
      console.log("🔑 Token récupéré:", token ? "OK" : "NULL");

      if (!token) {
        setError("Token non disponible");
        return;
      }

      const body = JSON.stringify({
        userId,
        action: "BAN",
        reason,
        motif,
        notify: true,
      });
      console.log("📦 Body envoyé:", body);

      const res = await fetch("/api/admin/users/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body,
      });

      console.log("📡 Réponse status:", res.status);

      const responseText = await res.text();
      console.log("📡 Réponse brute:", responseText);

      if (res.ok) {
        const data = JSON.parse(responseText);
        console.log("✅ Succès:", data);

        try {
          await sendNotification({
            userId,
            actionType: "BAN",
            reason,
            motif,
          });
          console.log("📧 Notification de bannissement envoyée");
        } catch (emailError) {
          console.error("❌ Erreur envoi email bannissement:", emailError);
        }

        setSuccess("Utilisateur banni avec succès");
        refresh();
        setShowBanModal(false);
      } else {
        let errorMessage = "Erreur lors du bannissement";
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        console.log("❌ Erreur API:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.log("💥 Erreur catch:", err);
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      console.log("🚀 handleActivate appelé avec:", { userId });

      const token = await getToken({ template: "my-app-template" });
      console.log("🔑 Token récupéré:", token ? "OK" : "NULL");

      if (!token) {
        setError("Token non disponible");
        return;
      }

      const body = JSON.stringify({ userId, action: "ACTIVATE" });
      console.log("📦 Body envoyé:", body);

      const res = await fetch("/api/admin/users/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body,
      });

      console.log("📡 Réponse status:", res.status);

      const responseText = await res.text();
      console.log("📡 Réponse brute:", responseText);

      if (res.ok) {
        const data = JSON.parse(responseText);
        console.log("✅ Succès:", data);

        try {
          await sendNotification({
            userId,
            actionType: "ACTIVATE",
          });
          console.log("📧 Notification de réactivation envoyée");
        } catch (emailError) {
          console.error("❌ Erreur envoi email réactivation:", emailError);
        }

        setSuccess("Compte réactivé avec succès");
        refresh();
        setShowActivateModal(false);
      } else {
        let errorMessage = "Erreur lors de la réactivation";
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        console.log("❌ Erreur API:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.log("💥 Erreur catch:", err);
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleLock = async (userId: string, reason: string) => {
    try {
      console.log("🚀 handleLock appelé avec:", { userId, reason });

      const token = await getToken({ template: "my-app-template" });
      console.log("🔑 Token récupéré:", token ? "OK" : "NULL");

      if (!token) {
        setError("Token non disponible");
        return;
      }

      const body = JSON.stringify({ userId, action: "LOCK", reason });
      console.log("📦 Body envoyé:", body);

      const res = await fetch("/api/admin/users/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body,
      });

      console.log("📡 Réponse status:", res.status);

      const responseText = await res.text();
      console.log("📡 Réponse brute:", responseText);

      if (res.ok) {
        const data = JSON.parse(responseText);
        console.log("✅ Succès:", data);

        try {
          await sendNotification({
            userId,
            actionType: "LOCK",
            reason,
          });
          console.log("📧 Notification de blocage envoyée");
        } catch (emailError) {
          console.error("❌ Erreur envoi email blocage:", emailError);
        }

        setSuccess("Compte bloqué avec succès");
        refresh();
        setShowLockUnlockModal(false);
      } else {
        let errorMessage = "Erreur lors du blocage";
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        console.log("❌ Erreur API:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.log("💥 Erreur catch:", err);
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleUnlock = async (userId: string) => {
    try {
      console.log("🚀 handleUnlock appelé avec:", { userId });

      const token = await getToken({ template: "my-app-template" });
      console.log("🔑 Token récupéré:", token ? "OK" : "NULL");

      if (!token) {
        setError("Token non disponible");
        return;
      }

      const body = JSON.stringify({ userId, action: "UNLOCK" });
      console.log("📦 Body envoyé:", body);

      const res = await fetch("/api/admin/users/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body,
      });

      console.log("📡 Réponse status:", res.status);

      const responseText = await res.text();
      console.log("📡 Réponse brute:", responseText);

      if (res.ok) {
        const data = JSON.parse(responseText);
        console.log("✅ Succès:", data);

        try {
          await sendNotification({
            userId,
            actionType: "UNLOCK",
          });
          console.log("📧 Notification de déblocage envoyée");
        } catch (emailError) {
          console.error("❌ Erreur envoi email déblocage:", emailError);
        }

        setSuccess("Compte débloqué avec succès");
        refresh();
        setShowLockUnlockModal(false);
      } else {
        let errorMessage = "Erreur lors du déblocage";
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        console.log("❌ Erreur API:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.log("💥 Erreur catch:", err);
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleEscalate = async (
    userId: string,
    level: EscalationLevel,
    reason: string,
    notify: boolean,
  ) => {
    try {
      console.log("🚀 handleEscalate appelé avec:", { userId, level, reason });

      const token = await getToken({ template: "my-app-template" });
      console.log("🔑 Token récupéré:", token ? "OK" : "NULL");

      if (!token) {
        setError("Token non disponible");
        return;
      }

      const body = JSON.stringify({
        userId,
        action: "ESCALATE",
        level,
        reason,
        notify,
      });
      console.log("📦 Body envoyé:", body);

      const res = await fetch("/api/admin/users/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body,
      });

      console.log("📡 Réponse status:", res.status);

      const responseText = await res.text();
      console.log("📡 Réponse brute:", responseText);

      if (res.ok) {
        const data = JSON.parse(responseText);
        console.log("✅ Succès:", data);

        try {
          await sendNotification({
            userId,
            actionType: "ESCALATE",
            reason,
            level,
          });
          console.log("📧 Notification d'escalade envoyée");
        } catch (emailError) {
          console.error("❌ Erreur envoi email escalade:", emailError);
        }

        setSuccess(`Sanction niveau ${level} appliquée`);
        refresh();
        setShowEscalateModal(false);
      } else {
        let errorMessage = "Erreur lors de l'escalade";
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        console.log("❌ Erreur API:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.log("💥 Erreur catch:", err);
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleWarning = async (
    userId: string,
    reason: string,
    motif: string,
    notify: boolean,
  ) => {
    try {
      console.log("🚀 handleWarning appelé avec:", {
        userId,
        reason,
        motif,
        notify,
      });

      const token = await getToken({ template: "my-app-template" });
      console.log("🔑 Token récupéré:", token ? "OK" : "NULL");

      if (!token) {
        setError("Token non disponible");
        return;
      }

      const body = JSON.stringify({
        userId,
        action: "WARNING",
        reason,
        motif,
        notify,
      });
      console.log("📦 Body envoyé:", body);

      const res = await fetch("/api/admin/users/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body,
      });

      console.log("📡 Réponse status:", res.status);

      const responseText = await res.text();
      console.log("📡 Réponse brute:", responseText);

      if (res.ok) {
        const data = JSON.parse(responseText);
        console.log("✅ Succès:", data);

        if (notify) {
          try {
            await sendNotification({
              userId,
              actionType: "WARNING",
              reason,
              motif,
            });
            console.log("📧 Notification d'avertissement envoyée");
          } catch (emailError) {
            console.error("❌ Erreur envoi email avertissement:", emailError);
          }
        }

        setSuccess("Avertissement envoyé avec succès");
        refresh();
        setShowWarningModal(false);
      } else {
        let errorMessage = "Erreur lors de l'envoi de l'avertissement";
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        console.log("❌ Erreur API:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.log("💥 Erreur catch:", err);
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleAddNote = async (userId: string, content: string) => {
    try {
      console.log("🚀 handleAddNote appelé avec:", { userId, content });

      const token = await getToken({ template: "my-app-template" });
      console.log("🔑 Token récupéré:", token ? "OK" : "NULL");

      if (!token) {
        setError("Token non disponible");
        return;
      }

      const body = JSON.stringify({ userId, action: "NOTE", content });
      console.log("📦 Body envoyé:", body);

      const res = await fetch("/api/admin/users/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body,
      });

      console.log("📡 Réponse status:", res.status);

      const responseText = await res.text();
      console.log("📡 Réponse brute:", responseText);

      if (res.ok) {
        const data = JSON.parse(responseText);
        console.log("✅ Succès:", data);

        setSuccess("Note ajoutée avec succès");
        setShowAddNoteModal(false);
      } else {
        let errorMessage = "Erreur lors de l'ajout de la note";
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        console.log("❌ Erreur API:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.log("💥 Erreur catch:", err);
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleUndoAction = async (actionId: string) => {
    try {
      console.log("🚀 handleUndoAction appelé avec:", { actionId });

      const token = await getToken({ template: "my-app-template" });
      console.log("🔑 Token récupéré:", token ? "OK" : "NULL");

      if (!token) {
        setError("Token non disponible");
        return;
      }

      const res = await fetch(`/api/admin/users/actions/${actionId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📡 Réponse status:", res.status);

      const responseText = await res.text();
      console.log("📡 Réponse brute:", responseText);

      if (res.ok) {
        const data = JSON.parse(responseText);
        console.log("✅ Succès:", data);

        setSuccess("Action annulée avec succès");
        refresh();
      } else {
        let errorMessage = "Erreur lors de l'annulation";
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        console.log("❌ Erreur API:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.log("💥 Erreur catch:", err);
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleExport = async (format: "csv" | "pdf") => {
    try {
      console.log("🚀 handleExport appelé avec:", { format });

      const token = await getToken({ template: "my-app-template" });
      console.log("🔑 Token récupéré:", token ? "OK" : "NULL");

      if (!token) {
        setError("Token non disponible");
        return;
      }

      const body = JSON.stringify({ filters, selectedUsers });
      console.log("📦 Body envoyé:", body);

      const res = await fetch(`/api/admin/users/export?format=${format}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body,
      });

      console.log("📡 Réponse status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Erreur export:", errorText);
        throw new Error("Erreur export");
      }

      const contentDisposition = res.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `utilisateurs_${new Date().toISOString().split("T")[0]}.${format}`;

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      setShowExportOptions(false);
      console.log("✅ Export réussi");
    } catch (err) {
      console.log("💥 Erreur catch export:", err);
      setError(err instanceof Error ? err.message : "Erreur export");
    }
  };

  // --- Gestion de la sélection ---
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // --- Modification des filtres (remet à la page 1) ---
  const setFilter = <K extends keyof UserFilters>(
    key: K,
    value: UserFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      role: "ALL",
      status: "ALL",
      verificationStatus: "ALL",
      dateFrom: "",
      dateTo: "",
      minReliability: "",
      maxFraud: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // --- Ouverture/fermeture des modales ---
  const openSuspendModal = (user: User) => {
    setSelectedUser(user);
    setShowSuspendModal(true);
  };
  const openBanModal = (user: User) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };
  const openActivateModal = (user: User) => {
    setSelectedUser(user);
    setShowActivateModal(true);
  };
  const openLockUnlockModal = (user: User) => {
    setSelectedUser(user);
    setShowLockUnlockModal(true);
  };
  const openEscalateModal = (user: User) => {
    setSelectedUser(user);
    setShowEscalateModal(true);
  };
  const openAddNoteModal = (user: User) => {
    setSelectedUser(user);
    setShowAddNoteModal(true);
  };
  const openWarningModal = (user: User) => {
    setSelectedUser(user);
    setShowWarningModal(true);
  };
  const openActionsHistory = (userId?: string) => {
    setSelectedUserForHistory(userId);
    setShowActionsHistory(true);
  };
  const toggleExportOptions = () => setShowExportOptions((prev) => !prev);

  const closeModals = () => {
    setShowSuspendModal(false);
    setShowBanModal(false);
    setShowActivateModal(false);
    setShowLockUnlockModal(false);
    setShowEscalateModal(false);
    setShowAddNoteModal(false);
    setShowWarningModal(false);
    setShowActionsHistory(false);
    setShowExportOptions(false);
    setSelectedUserForHistory(undefined); // ✅ AJOUTE CETTE LIGNE
  };

  return {
    // Données
    users,
    stats,
    actions,
    pagination,
    loading,
    error,
    success,
    setSuccess,
    setError,

    // Filtres
    filters,
    setFilter,
    resetFilters,

    // Sélection
    selectedUsers,
    selectedUser,
    handleSelectAll,
    handleSelectUser,

    // Pagination
    setPage: (page: number) => setPagination((prev) => ({ ...prev, page })),

    // Modales
    showSuspendModal,
    showBanModal,
    showActivateModal,
    showLockUnlockModal,
    showEscalateModal,
    showAddNoteModal,
    showWarningModal,
    showActionsHistory,
    showExportOptions,
    openSuspendModal,
    openBanModal,
    openActivateModal,
    openLockUnlockModal,
    openEscalateModal,
    openAddNoteModal,
    openWarningModal,
    openActionsHistory,
    toggleExportOptions,
    closeModals,

    // Actions API
    handleSuspend,
    handleBan,
    handleActivate,
    handleLock,
    handleUnlock,
    handleEscalate,
    handleAddNote,
    handleWarning,
    handleUndoAction,
    handleExport,
    refresh,
    selectedUserForHistory,
  };
}
