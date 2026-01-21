'use client';

import { WeatherData } from '@/lib/types';

interface WeatherDisplayProps {
  weather: WeatherData | null;
  loading?: boolean;
  error?: string | null;
}

function WeatherIcon({ sunPosition, cloudCover }: { sunPosition: WeatherData['sunPosition']; cloudCover: number }) {
  const style = { width: 20, height: 20 };

  // Night
  if (sunPosition === 'night') {
    return (
      <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }

  // Twilight
  if (sunPosition === 'twilight') {
    return (
      <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        <circle cx="12" cy="12" r="4" strokeDasharray="2 2" />
      </svg>
    );
  }

  // Cloudy
  if (cloudCover > 70) {
    return (
      <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    );
  }

  // Partly cloudy
  if (cloudCover > 30) {
    return (
      <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="10" r="4" />
        <path d="M12 2v2M12 16v2M4 10H2M22 10h-2M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M5.64 14.36l1.42-1.42" />
        <path d="M17 18h-5a4 4 0 0 1 0-8" />
      </svg>
    );
  }

  // Golden hour sun
  if (sunPosition === 'golden') {
    return (
      <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    );
  }

  // Default sun
  return (
    <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function VisibilityIcon() {
  return (
    <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function WeatherDisplay({ weather, loading, error }: WeatherDisplayProps) {
  if (loading) {
    return (
      <div className="weather-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--text-tertiary)', opacity: 0.3 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 12, width: 96, background: 'var(--text-tertiary)', borderRadius: 4, opacity: 0.3, marginBottom: 8 }} />
            <div style={{ height: 10, width: 128, background: 'var(--text-tertiary)', borderRadius: 4, opacity: 0.2 }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-card">
        <div className="guidance-label">
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
    <div className="weather-card">
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            <WeatherIcon sunPosition={weather.sunPosition} cloudCover={weather.cloudCover} />
          </div>
          <div>
            <div className="guidance-value" style={{ marginBottom: 2 }}>
              {weather.conditions}
            </div>
            <div className="guidance-label">
              {weather.locationName}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="guidance-label">
            {sunPositionLabel}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
          <VisibilityIcon />
          <span className="guidance-label">{weather.visibility}km</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
          <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
          <span className="guidance-label">{weather.cloudCover}%</span>
        </div>
      </div>

      {/* Light quality */}
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <div className="guidance-value">
          {weather.lightQuality}
        </div>
      </div>

      {/* Shooting note */}
      <div className="guidance-note" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
        {weather.shootingNote}
      </div>
    </div>
  );
}
