"use client";

import { IoLockClosedOutline, IoWarningOutline, IoShieldOutline } from "react-icons/io5";

export function ChatLockedOverlay({ reason }: { reason: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-2xl border-2 border-red-200 dark:border-red-800">
      <div className="relative">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <IoLockClosedOutline className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <IoWarningOutline className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
        🔒 Conversation Verrouillée
      </h3>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 max-w-md text-center shadow-lg">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {reason || "Un modérateur a fermé cette conversation. Vous ne pouvez plus envoyer de messages."}
        </p>
      </div>
      
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <IoShieldOutline className="text-sm" />
        <span>Action de modération - Chatbox fermée automatiquement</span>
      </div>
    </div>
  );
}