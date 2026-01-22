'use client';

import { useState } from 'react';
import { WeatherData } from '@/lib/types';

interface WeatherDisplayProps {
  weather: WeatherData | null;
  loading?: boolean;
  error?: string | null;
  locationDenied?: boolean;
  onManualLocation?: (lat: number, lon: number) => void;
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

// Common cities for quick selection
const QUICK_LOCATIONS = [
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
];

export function WeatherDisplay({ weather, loading, error, locationDenied, onManualLocation }: WeatherDisplayProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [customLocation, setCustomLocation] = useState('');

  const handleQuickLocation = (lat: number, lon: number) => {
    onManualLocation?.(lat, lon);
    setShowLocationPicker(false);
  };

  const handleCustomSubmit = async () => {
    if (!customLocation.trim()) return;

    // Try to geocode the location using a simple approach
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customLocation)}&limit=1`
      );
      const data = await response.json();
      if (data && data[0]) {
        onManualLocation?.(parseFloat(data[0].lat), parseFloat(data[0].lon));
        setShowLocationPicker(false);
        setCustomLocation('');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

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

  if (locationDenied && onManualLocation) {
    return (
      <div className="weather-card">
        {!showLocationPicker ? (
          <div className="weather-location-prompt">
            <div className="guidance-label">Location access denied</div>
            <button
              className="weather-location-btn"
              onClick={() => setShowLocationPicker(true)}
            >
              Enter Location Manually
            </button>
          </div>
        ) : (
          <div className="weather-location-picker">
            <div className="weather-location-picker-header">
              <span className="guidance-label">Select or enter location</span>
              <button
                className="weather-location-close"
                onClick={() => setShowLocationPicker(false)}
              >
                ×
              </button>
            </div>
            <div className="weather-quick-locations">
              {QUICK_LOCATIONS.map(loc => (
                <button
                  key={loc.name}
                  className="weather-quick-location"
                  onClick={() => handleQuickLocation(loc.lat, loc.lon)}
                >
                  {loc.name}
                </button>
              ))}
            </div>
            <div className="weather-custom-location">
              <input
                type="text"
                className="weather-location-input"
                placeholder="City or address..."
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
              />
              <button
                className="weather-location-submit"
                onClick={handleCustomSubmit}
              >
                Go
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error && !locationDenied) {
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
