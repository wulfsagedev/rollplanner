'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for stored preference or system preference
    const stored = localStorage.getItem('rollplanner_theme');
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
      if (stored === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // Add transition class
    document.documentElement.classList.add('theme-transitioning');

    // Switch theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 500);

    setTheme(newTheme);
    localStorage.setItem('rollplanner_theme', newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center"
        aria-label="Toggle theme"
      >
        <span className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center',
        'bg-[var(--bg-inset)]',
        'shadow-[inset_0_1px_3px_rgba(0,0,0,0.06),0_1px_0_var(--bevel-light)]',
        'dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)]',
        'hover:bg-[#d4d4d8] dark:hover:bg-[#3a3a3e]',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-[var(--led-on)] focus-visible:outline-offset-2'
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        // Sun icon
        <svg
          className="w-5 h-5 text-[var(--text-secondary)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        // Moon icon
        <svg
          className="w-5 h-5 text-[var(--text-secondary)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
