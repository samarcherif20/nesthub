// components/ui/FormSection.tsx
"use client";

interface FormSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="grid grid-cols-12 gap-6 lg:gap-8">
      <div className="col-span-12 lg:col-span-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
      <div className="col-span-12 lg:col-span-8 space-y-6">
        {children}
      </div>
    </div>
  );
}