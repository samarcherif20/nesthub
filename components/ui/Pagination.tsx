// components/ui/Pagination.tsx
'use client';

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;  // Optionnel
  pageSize?: number;     // Optionnel
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}: PaginationProps) {
  // Calcul des plages uniquement si totalItems et pageSize sont fournis
  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <div className={`flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 ${className}`}>
      {/* Afficher les infos seulement si les données sont disponibles */}
      {totalItems !== undefined && pageSize !== undefined && (
        <p className="text-sm text-slate-500">
          Affichage{' '}
          <span className="font-medium text-slate-900 dark:text-white">{startItem}</span> à{' '}
          <span className="font-medium text-slate-900 dark:text-white">{endItem}</span> sur{' '}
          <span className="font-medium text-slate-900 dark:text-white">{totalItems}</span> résultats
        </p>
      )}

      {/* Espace vide pour maintenir l'alignement si pas d'infos */}
      {(!totalItems || !pageSize) && <div />}

      <div className="flex items-center gap-2">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaChevronLeft className="text-xs" />
        </button>

        {/* Page numbers */}
        {(() => {
          const maxVisible = 4;
          const pages: number[] = [];
          
          if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
          } else if (currentPage <= 3) {
            for (let i = 1; i <= maxVisible; i++) pages.push(i);
          } else if (currentPage >= totalPages - 2) {
            for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
          } else {
            for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
          }

          return pages.map((pageNum) => {
            const isActive = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30 border-0'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {pageNum}
              </button>
            );
          });
        })()}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaChevronRight className="text-xs" />
        </button>
      </div>
    </div>
  );
}