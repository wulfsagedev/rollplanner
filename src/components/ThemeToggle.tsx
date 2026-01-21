'use client';

import { useEffect, useState } from 'react';

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

    // Preload all themes by briefly toggling each class
    // This forces browser to compute styles for all themes upfront
    const preloadThemes = () => {
      const html = document.documentElement;
      const currentlyDark = html.classList.contains('dark');

      // All time-of-day theme classes to preload
      const timeThemes = ['time-sunrise', 'time-golden', 'time-morning', 'time-day', 'time-afternoon', 'time-blue-hour', 'time-night'];

      // Temporarily disable transitions
      html.style.transition = 'none';

      // Preload dark/light themes
      if (currentlyDark) {
        html.classList.remove('dark');
      } else {
        html.classList.add('dark');
      }
      void html.offsetHeight;

      // Toggle back
      if (currentlyDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
      void html.offsetHeight;

      // Preload all time-of-day themes
      timeThemes.forEach(theme => {
        html.classList.add(theme);
        void html.offsetHeight;
        html.classList.remove(theme);
      });

      // Force final recalculation
      void html.offsetHeight;

      // Re-enable transitions
      requestAnimationFrame(() => {
        html.style.transition = '';
      });
    };

    // Run preload after a short delay to not block initial render
    const timer = setTimeout(preloadThemes, 100);
    return () => clearTimeout(timer);
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
      <button className="theme-toggle" aria-label="Toggle theme">
        <span style={{ width: 20, height: 20 }} />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        // Sun icon
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // Moon icon
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
