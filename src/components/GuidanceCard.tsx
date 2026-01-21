'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GuidanceCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  note?: string;
}

export function GuidanceCard({ icon, title, children, note }: GuidanceCardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] p-4 mb-4',
        'bg-[var(--bg-inset)] dark:bg-[#3a3a3e]',
        'shadow-[inset_0_1px_3px_rgba(0,0,0,0.06),0_1px_0_var(--bevel-light)]',
        'dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)]'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--border-subtle)]">
        <span className="w-[18px] h-[18px] text-[var(--text-secondary)] dark:text-[#a8a8ac]">
          {icon}
        </span>
        <span className="text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] dark:text-[#a8a8ac]">
          {title}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">
        {children}
      </div>

      {/* Note */}
      {note && (
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs font-medium tracking-wide uppercase text-[var(--text-tertiary)] dark:text-[#78787c] leading-relaxed">
          {note}
        </div>
      )}
    </div>
  );
}

interface GuidanceRowProps {
  label: string;
  value: string;
}

export function GuidanceRow({ label, value }: GuidanceRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs font-medium tracking-wider uppercase text-[var(--text-tertiary)] dark:text-[#78787c]">
        {label}
      </span>
      <span className="text-sm font-medium tracking-wide uppercase text-[var(--text-primary)] dark:text-[#f0f0f2]">
        {value}
      </span>
    </div>
  );
}

interface MeteringTipProps {
  children: ReactNode;
  secondary?: boolean;
}

export function MeteringTip({ children, secondary = false }: MeteringTipProps) {
  return (
    <div
      className={cn(
        'text-xs font-medium tracking-wide uppercase leading-relaxed pl-3 border-l-2',
        secondary
          ? 'text-[var(--text-secondary)] dark:text-[#a8a8ac] border-[var(--border-strong)] dark:border-[rgba(255,255,255,0.2)]'
          : 'text-[var(--text-primary)] dark:text-[#f0f0f2] border-[var(--text-primary)] dark:border-[#f0f0f2]'
      )}
    >
      {children}
    </div>
  );
}
