// components/ui/LoadingSpinner.tsx
import React from 'react';
import { LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'ring';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'white';
  fullScreen?: boolean;
  text?: string;
  className?: string;
  iconClassName?: string;
  speed?: 'fast' | 'normal' | 'slow' | 'very-slow'; // New prop for speed control
}

export default function LoadingSpinner({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  fullScreen = false,
  text,
  className = '',
  iconClassName = '',
  speed = 'normal', // Default to normal speed
}: LoadingSpinnerProps) {

  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorsMap = {
    primary: 'text-primary',
    secondary: 'text-slate-500',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
    white: 'text-white',
  };

  // Speed classes mapping - you'll need to add these to your global CSS
  const speedClasses = {
    fast: 'animate-spin-fast',      // 0.75s rotation
    normal: 'animate-spin',          // 1s rotation (default)
    slow: 'animate-spin-slow',       // 1.5s rotation
    'very-slow': 'animate-spin-very-slow', // 2.5s rotation
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <LoaderIcon
            role="status"
            aria-label="Loading"
            className={cn(
              sizes[size],
              colorsMap[color],
              speedClasses[speed], // Use speed class here
              iconClassName
            )}
          />
        );

      case 'dots':
        return (
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <LoaderIcon
                key={i}
                className={cn(
                  sizes.xs,
                  colorsMap[color],
                  "animate-bounce",
                  iconClassName
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <LoaderIcon
            role="status"
            aria-label="Loading"
            className={cn(
              sizes[size],
              colorsMap[color],
              "animate-pulse",
              iconClassName
            )}
          />
        );

      case 'ring':
        return (
          <div className="relative">
            <LoaderIcon
              role="status"
              aria-label="Loading"
              className={cn(
                sizes[size],
                colorsMap[color],
                speedClasses[speed], // Use speed class for ring variant too
                iconClassName
              )}
            />
            <div className={cn(
              "absolute inset-0 rounded-full border-2",
              colorsMap[color].replace('text', 'border'),
              "opacity-25"
            )} />
          </div>
        );

      default:
        return null;
    }
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      {renderSpinner()}
      {text && (
        <p className={cn("text-sm animate-pulse", colorsMap[color])}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

// Version simplifiée pour une utilisation rapide
export function SimpleSpinner({ className, speed = 'normal', ...props }: React.ComponentProps<"svg"> & { speed?: 'fast' | 'normal' | 'slow' | 'very-slow' }) {
  const speedClasses = {
    fast: 'animate-spin-fast',
    normal: 'animate-spin',
    slow: 'animate-spin-slow',
    'very-slow': 'animate-spin-very-slow',
  };

  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4", speedClasses[speed], className)}
      {...props}
    />
  );
}