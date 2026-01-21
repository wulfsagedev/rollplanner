'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SelectorCardProps {
  icon: ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function SelectorCard({ icon, label, selected, onClick }: SelectorCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-2 p-4 rounded-[var(--radius-md)]',
        'bg-[var(--bg-inset)] cursor-pointer select-none',
        'shadow-[inset_0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(0,0,0,0.04),0_1px_0_var(--bevel-light)]',
        'transition-all duration-150 ease-out',
        'hover:bg-[#d4d4d8] dark:hover:bg-[#3a3a3e]',
        'focus-visible:outline-2 focus-visible:outline-[var(--led-on)] focus-visible:outline-offset-2',
        selected && 'translate-y-[1px] bg-[#d0d0d4] dark:bg-[#2a2a2e]'
      )}
    >
      {/* LED indicator */}
      <span
        className={cn(
          'absolute top-2 right-2 w-[6px] h-[6px] rounded-full',
          'bg-[var(--border-strong)]',
          'transition-all duration-150',
          selected && [
            'bg-[var(--led-on)]',
            'shadow-[0_0_2px_var(--led-on),0_0_4px_var(--led-on-glow)]'
          ]
        )}
      />

      {/* Icon */}
      <span
        className={cn(
          'w-6 h-6 text-[var(--text-secondary)]',
          'transition-all duration-150',
          selected && [
            'text-[var(--led-on)]',
            '[filter:drop-shadow(0_0_2px_var(--led-on-glow))]'
          ]
        )}
      >
        {icon}
      </span>

      {/* Label */}
      <span className="text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">
        {label}
      </span>
    </button>
  );
}
