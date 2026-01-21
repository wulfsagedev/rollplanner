'use client';

import { WeatherData } from '@/lib/types';

interface WeatherDisplayProps {
  weather: WeatherData | null;
  loading?: boolean;
  error?: string | null;
}

function VisibilityIcon() {
  return (
    <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LiveLED() {
  return (
    <span className="weather-live-led" title="Live weather data">
      <span className="weather-live-led-dot" />
    </span>
  );
}

export function WeatherDisplay({ weather, loading, error }: WeatherDisplayProps) {
  if (loading) {
    return (
      <div className="weather-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 10, width: 80, background: 'rgba(255,255,255,0.2)', borderRadius: 3 }} />
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
    high: 'High Sun',
    low: 'Angled Light',
    twilight: 'Blue Hour',
    night: 'Night',
  }[weather.sunPosition];

  return (
    <div className="weather-card">
      {/* Header row: LED + conditions + location */}
      <div className="weather-header">
        <div className="weather-header-left">
          <LiveLED />
          <span className="weather-conditions">{weather.conditions}</span>
          <span className="weather-location">{weather.locationName}</span>
        </div>
      </div>

      {/* Stats row: sun position badge + visibility + cloud cover */}
      <div className="weather-stats">
        <span className="weather-sun-badge">{sunPositionLabel}</span>
        <div className="weather-stat">
          <VisibilityIcon />
          <span>{weather.visibility}km</span>
        </div>
        <div className="weather-stat">
          <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
          <span>{weather.cloudCover}%</span>
        </div>
      </div>

      {/* Light quality + shooting note */}
      <div className="weather-light-info">
        <div className="weather-light-quality">{weather.lightQuality}</div>
        <div className="weather-shooting-note">{weather.shootingNote}</div>
      </div>
    </div>
  );
}
