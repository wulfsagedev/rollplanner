'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  pulse?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', pulse = false, disabled, children, ...props }, ref) => {
    const baseStyles = `
      relative px-6 py-4 rounded-[var(--radius-md)]
      text-xs font-medium tracking-wider uppercase
      cursor-pointer select-none
      transition-all duration-150 ease-out
      active:translate-y-[2px]
      focus-visible:outline-2 focus-visible:outline-[var(--led-on)] focus-visible:outline-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0
    `;

    const primaryStyles = `
      bg-[var(--led-on)] text-white
      shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.1),0_4px_0_var(--led-on-deep),0_5px_10px_rgba(255,149,0,0.2)]
      hover:bg-[#ffa01a]
      active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.15),0_1px_0_var(--led-on-deep),0_2px_4px_rgba(255,149,0,0.15)]
    `;

    const secondaryStyles = `
      bg-[#d8d8dc] text-[var(--text-secondary)]
      shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.05),0_3px_0_#b8b8bc,0_4px_8px_rgba(0,0,0,0.1)]
      hover:bg-[#e2e2e6] hover:text-[var(--text-primary)]
      active:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.05),0_1px_0_#b8b8bc,0_2px_4px_rgba(0,0,0,0.08)]
      dark:bg-[#3a3a3e] dark:text-[var(--text-secondary)]
      dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.2),0_3px_0_#1a1a1c,0_4px_8px_rgba(0,0,0,0.3)]
      dark:hover:bg-[#4a4a4e] dark:hover:text-[var(--text-primary)]
    `;

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variant === 'primary' ? primaryStyles : secondaryStyles,
          pulse && !disabled && 'pulse-glow',
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
