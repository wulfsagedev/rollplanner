'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  leftLabel: string;
  rightLabel: string;
  value: 'left' | 'right';
  onChange: (value: 'left' | 'right') => void;
}

export function Toggle({ leftLabel, rightLabel, value, onChange }: ToggleProps) {
  const handleClick = () => {
    onChange(value === 'left' ? 'right' : 'left');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'text-xs font-medium tracking-wider uppercase cursor-pointer select-none transition-colors duration-150',
          value === 'left'
            ? 'text-[var(--led-on)] [text-shadow:0_0_4px_var(--led-on-glow)]'
            : 'text-[var(--text-tertiary)]'
        )}
        onClick={() => value !== 'left' && onChange('left')}
      >
        {leftLabel}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={value === 'right'}
        className={cn(
          'relative w-[52px] h-7 rounded-full cursor-pointer border-none p-0',
          'bg-[#f0f0f4] dark:bg-[#3a3a3e]',
          'shadow-[inset_0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)]',
          'dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(0,0,0,0.15),0_1px_0_rgba(255,255,255,0.05)]',
          'transition-colors duration-200',
          'focus-visible:outline-2 focus-visible:outline-[var(--led-on)] focus-visible:outline-offset-2'
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <span
          className={cn(
            'absolute top-[3px] w-[22px] h-[22px] rounded-full pointer-events-none',
            'bg-white dark:bg-[#e8e8ec]',
            'shadow-[0_2px_4px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
            'dark:shadow-[0_2px_4px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]',
            'transition-[left] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            value === 'left' ? 'left-[3px]' : 'left-[27px]'
          )}
        />
      </button>

      <span
        className={cn(
          'text-xs font-medium tracking-wider uppercase cursor-pointer select-none transition-colors duration-150',
          value === 'right'
            ? 'text-[var(--led-on)] [text-shadow:0_0_4px_var(--led-on-glow)]'
            : 'text-[var(--text-tertiary)]'
        )}
        onClick={() => value !== 'right' && onChange('right')}
      >
        {rightLabel}
      </span>
    </div>
  );
}
