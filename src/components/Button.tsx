'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  pulse?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', pulse = false, disabled, children, ...props }, ref) => {
    const className = [
      variant === 'primary' ? 'btn-primary' : 'btn-secondary',
      pulse && !disabled ? 'pulse' : ''
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={className}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
