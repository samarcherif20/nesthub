"use client";

import { motion } from "framer-motion";
import { FaIdCard} from "react-icons/fa";
import { GiPassport } from "react-icons/gi";

interface DocumentTypeSelectorProps {
  value: "cin" | "passport";
  onChange: (type: "cin" | "passport") => void;
}

export function DocumentTypeSelector({ value, onChange }: DocumentTypeSelectorProps) {
  return (
    <div className="mb-0">
      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Type de document d'identité <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => onChange("cin")}
          className={`
            flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border transition-all backdrop-blur-sm text-sm
            ${value === "cin"
              ? "border-blue-400/50 bg-gradient-to-r from-blue-400/10 to-purple-400/10 text-blue-600 dark:text-blue-400 shadow-sm"
              : "border-gray-200/50 dark:border-gray-700/50 bg-white/5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 text-gray-600 dark:text-gray-400"
            }
          `}
        >
          <FaIdCard className={`text-base ${value === "cin" ? "text-blue-500" : "text-gray-400 dark:text-gray-500"}`} />
          <span className={`font-medium text-xs ${value === "cin" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}>
            Carte d'identité (CIN)
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => onChange("passport")}
          className={`
            flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border transition-all backdrop-blur-sm text-sm
            ${value === "passport"
              ? "border-blue-400/50 bg-gradient-to-r from-blue-400/10 to-purple-400/10 text-blue-600 dark:text-blue-400 shadow-sm"
              : "border-gray-200/50 dark:border-gray-700/50 bg-white/5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 text-gray-600 dark:text-gray-400"
            }
          `}
        >
          <GiPassport className={`text-base ${value === "passport" ? "text-blue-500" : "text-gray-400 dark:text-gray-500"}`} />
          <span className={`font-medium text-xs ${value === "passport" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}>
            Passeport
          </span>
        </motion.button>
      </div>
    </div>
  );
}