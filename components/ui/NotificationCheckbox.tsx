// components/ui/NotificationCheckbox.tsx
"use client";

import { BiMailSend } from "react-icons/bi";

interface NotificationCheckboxProps {
  notify: boolean;
  setNotify: (value: boolean) => void;
  userEmail?: string;
  label?: string;
  message?: string;
  colorScheme?: "orange" | "red" | "yellow" | "green" | "blue" | "indigo" | "purple"; // Différentes couleurs
  className?: string;
}

const colorStyles = {
  orange: {
    checkbox: "accent-orange-500 focus:ring-orange-500",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    icon: "text-orange-600 dark:text-orange-400",
    title: "text-orange-700 dark:text-orange-300",
    text: "text-orange-600 dark:text-orange-400",
  },
  red: {
    checkbox: "accent-red-500 focus:ring-red-500",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    title: "text-red-700 dark:text-red-300",
    text: "text-red-600 dark:text-red-400",
  },
  yellow: {
    checkbox: "accent-yellow-500 focus:ring-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800",
    icon: "text-yellow-600 dark:text-yellow-400",
    title: "text-yellow-700 dark:text-yellow-300",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  green: {
    checkbox: "accent-green-500 focus:ring-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    title: "text-green-700 dark:text-green-300",
    text: "text-green-600 dark:text-green-400",
  },
  blue: {
    checkbox: "accent-blue-500 focus:ring-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    title: "text-blue-700 dark:text-blue-300",
    text: "text-blue-600 dark:text-blue-400",
  },
  purple: {
    checkbox: "accent-purple-500 focus:ring-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    icon: "text-purple-600 dark:text-purple-400",
    title: "text-purple-700 dark:text-purple-300",
    text: "text-purple-600 dark:text-purple-400",
  },
   indigo: {
    checkbox: "accent-indigo-500 focus:ring-indigo-500",
    bg: "bg-purple-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-800",
    icon: "text-indigo-600 dark:text-indigo-400",
    title: "text-indigo-700 dark:text-indigo-300",
    text: "text-indigo-600 dark:text-indigo-400",
  },



};

export default function NotificationCheckbox({
  notify,
  setNotify,
  userEmail,
  label = "Notifier l'utilisateur par email",
  message = "Un email sera envoyé à {email} pour le notifier.",
  colorScheme = "orange",
  className = "",
}: NotificationCheckboxProps) {
  const colors = colorStyles[colorScheme];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="notify-email"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          className={`w-4 h-4 rounded ${colors.checkbox}`}
        />
        <label
          htmlFor="notify-email"
          className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          {label}
        </label>
      </div>

      {/* Info Box */}
      {notify && userEmail && (
        <div className={`p-3 ${colors.bg} border ${colors.border} rounded-lg flex items-start gap-3 animate-fadeIn`}>
          <div className="shrink-0 mt-0.5">
            <BiMailSend  className={`h-4 w-4 ${colors.icon}`} />
          </div>
          <div className="flex-1">
           
            <p className={`text-xs ${colors.text} mt-0.5`}>
              {message.replace("{email}", userEmail)}
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
}