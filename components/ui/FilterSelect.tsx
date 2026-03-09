// components/ui/FilterSelect.tsx
'use client';

import { FaChevronDown } from 'react-icons/fa';

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  label?: string;
  className?: string;
}

export default function FilterSelect({
  value,
  onChange,
  options,
  label,
  className = '',
}: FilterSelectProps) {
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-500 whitespace-nowrap">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none appearance-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
    </div>
  );
}