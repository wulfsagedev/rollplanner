'use client';

import { WeatherData } from '@/lib/types';

interface WeatherDisplayProps {
  weather: WeatherData | null;
  loading?: boolean;
  error?: string | null;
}

function WeatherIcon({ sunPosition, cloudCover }: { sunPosition: WeatherData['sunPosition']; cloudCover: number }) {
  // Night
  if (sunPosition === 'night') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }

  // Twilight
  if (sunPosition === 'twilight') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        <circle cx="12" cy="12" r="4" strokeDasharray="2 2" />
      </svg>
    );
  }

  // Cloudy
  if (cloudCover > 70) {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    );
  }

  // Partly cloudy
  if (cloudCover > 30) {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="10" r="4" />
        <path d="M12 2v2M12 16v2M4 10H2M22 10h-2M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M5.64 14.36l1.42-1.42" />
        <path d="M17 18h-5a4 4 0 0 1 0-8" />
      </svg>
    );
  }

  // Golden hour sun
  if (sunPosition === 'golden') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    );
  }

  // Default sun
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function VisibilityIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function WeatherDisplay({ weather, loading, error }: WeatherDisplayProps) {
  if (loading) {
    return (
      <div className="bg-[var(--bg-inset)] rounded-[var(--radius-md)] p-4 mb-6 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06),0_1px_0_var(--bevel-light)]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
          <div className="flex-1">
            <div className="h-3 w-24 bg-[var(--text-tertiary)] rounded animate-pulse mb-2" />
            <div className="h-2 w-32 bg-[var(--text-tertiary)] rounded animate-pulse opacity-50" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--bg-inset)] rounded-[var(--radius-md)] p-4 mb-6 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06),0_1px_0_var(--bevel-light)]">
        <div className="text-xs font-medium tracking-wide text-[var(--text-tertiary)]">
          {error}
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const sunPositionLabel = {
    golden: 'Golden Hour',
    high: 'Midday Sun',
    low: 'Low Sun',
    twilight: 'Twilight',
    night: 'Night',
  }[weather.sunPosition];

  return (
    <div className="bg-[var(--bg-inset)] rounded-[var(--radius-md)] p-4 mb-6 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06),0_1px_0_var(--bevel-light)]">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="text-[var(--text-secondary)]">
            <WeatherIcon sunPosition={weather.sunPosition} cloudCover={weather.cloudCover} />
          </div>
          <div>
            <div className="text-sm font-medium tracking-wide uppercase text-[var(--text-primary)]">
              {weather.conditions}
            </div>
            <div className="text-xs font-medium tracking-wide text-[var(--text-tertiary)]">
              {weather.locationName}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)]">
            {sunPositionLabel}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3 pb-3 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-1.5">
          <VisibilityIcon />
          <span className="text-xs font-medium tracking-wide text-[var(--text-secondary)]">
            {weather.visibility}km
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
          <span className="text-xs font-medium tracking-wide text-[var(--text-secondary)]">
            {weather.cloudCover}%
          </span>
        </div>
      </div>

      {/* Light quality */}
      <div className="mb-2">
        <div className="text-xs font-medium tracking-wide uppercase text-[var(--text-primary)]">
          {weather.lightQuality}
        </div>
      </div>

      {/* Shooting note */}
      <div className="text-xs font-medium tracking-wide text-[var(--text-tertiary)] leading-relaxed">
        {weather.shootingNote}
      </div>
    </div>
  );
}
