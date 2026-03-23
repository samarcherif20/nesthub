import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <div className="relative">
      {/* Ombre portée 3D fixe */}
      <div className="absolute inset-0 bg-slate-300 dark:bg-slate-700 rounded-xl translate-y-1.5 translate-x-1.5"></div>
      
      {/* Carte principale */}
      <div className="relative bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center shadow-inner`}>
            {icon}
          </div>
        </div>
        
        {/* Petit effet de brillance */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}