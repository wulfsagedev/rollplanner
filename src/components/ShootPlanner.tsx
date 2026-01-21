'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WeatherData } from '@/lib/types';
import { searchLocations, fetchForecastWeather, getSunTimes, LocationResult } from '@/lib/weather';

interface ShootPlannerProps {
  onForecastChange: (weather: WeatherData | null) => void;
  onModeChange: (isPlanning: boolean) => void;
}

interface SunTimes {
  sunrise: Date;
  sunset: Date;
  goldenMorning: Date;
  goldenEvening: Date;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatTimeOption(date: Date, label: string): string {
  return `${formatTime(date)} · ${label}`;
}

export function ShootPlanner({ onForecastChange, onModeChange }: ShootPlannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('17:00');
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);
  const [forecast, setForecast] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced location search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
      setShowResults(results.length > 0);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch sun times when location or date changes
  useEffect(() => {
    if (!selectedLocation) {
      setSunTimes(null);
      return;
    }

    const fetchSunTimes = async () => {
      const date = new Date(selectedDate);
      const times = await getSunTimes(selectedLocation.lat, selectedLocation.lon, date);
      setSunTimes(times);
    };

    fetchSunTimes();
  }, [selectedLocation, selectedDate]);

  // Fetch forecast when location, date, or time changes
  const fetchForecast = useCallback(async () => {
    if (!selectedLocation) {
      setForecast(null);
      onForecastChange(null);
      return;
    }

    setLoading(true);

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const targetDate = new Date(selectedDate);
    targetDate.setHours(hours, minutes, 0, 0);

    const data = await fetchForecastWeather(
      selectedLocation.lat,
      selectedLocation.lon,
      targetDate
    );

    setForecast(data);
    onForecastChange(data);
    setLoading(false);
  }, [selectedLocation, selectedDate, selectedTime, onForecastChange]);

  useEffect(() => {
    if (selectedLocation) {
      fetchForecast();
    }
  }, [selectedLocation, selectedDate, selectedTime, fetchForecast]);

  const handleLocationSelect = (location: LocationResult) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setShowResults(false);
  };

  const handleClear = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    setForecast(null);
    onForecastChange(null);
    onModeChange(false);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setIsExpanded(true);
    onModeChange(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const setQuickTime = (time: Date) => {
    setSelectedTime(formatTime(time));
  };

  // Get available dates (today + next 7 days)
  const availableDates = Array.from({ length: 8 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      value: date.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    };
  });

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="shoot-planner-toggle"
      >
        <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>Plan a shoot</span>
      </button>
    );
  }

  return (
    <div className="shoot-planner">
      <div className="shoot-planner-header">
        <span className="shoot-planner-title">Plan Your Shoot</span>
        <button onClick={handleClear} className="shoot-planner-close">
          <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Location Search */}
      <div className="shoot-planner-field">
        <label className="shoot-planner-label">Location</label>
        <div className="shoot-planner-search">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city or place..."
            className="shoot-planner-input"
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
          />
          {selectedLocation && (
            <button
              onClick={() => {
                setSelectedLocation(null);
                setSearchQuery('');
                setForecast(null);
                onForecastChange(null);
              }}
              className="shoot-planner-clear"
            >
              <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="shoot-planner-results">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleLocationSelect(result)}
                className="shoot-planner-result"
              >
                <svg style={{ width: 14, height: 14, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div className="shoot-planner-result-text">
                  <span className="shoot-planner-result-name">{result.name}</span>
                  <span className="shoot-planner-result-detail">{result.displayName}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Selector */}
      <div className="shoot-planner-field">
        <label className="shoot-planner-label">Date</label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="shoot-planner-select"
        >
          {availableDates.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Time Selector */}
      <div className="shoot-planner-field">
        <label className="shoot-planner-label">Time</label>
        <input
          type="time"
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          className="shoot-planner-input"
        />

        {/* Quick Time Buttons */}
        {sunTimes && (
          <div className="shoot-planner-quick-times">
            <button
              onClick={() => setQuickTime(sunTimes.goldenMorning)}
              className="shoot-planner-quick-btn"
            >
              {formatTimeOption(sunTimes.goldenMorning, 'Golden AM')}
            </button>
            <button
              onClick={() => setQuickTime(sunTimes.goldenEvening)}
              className="shoot-planner-quick-btn"
            >
              {formatTimeOption(sunTimes.goldenEvening, 'Golden PM')}
            </button>
            <button
              onClick={() => setQuickTime(sunTimes.sunrise)}
              className="shoot-planner-quick-btn"
            >
              {formatTimeOption(sunTimes.sunrise, 'Sunrise')}
            </button>
            <button
              onClick={() => setQuickTime(sunTimes.sunset)}
              className="shoot-planner-quick-btn"
            >
              {formatTimeOption(sunTimes.sunset, 'Sunset')}
            </button>
          </div>
        )}
      </div>

      {/* Forecast Display */}
      {loading && (
        <div className="shoot-planner-loading">
          <span>Loading forecast...</span>
        </div>
      )}

      {forecast && !loading && (
        <div className="shoot-planner-forecast">
          <div className="shoot-planner-forecast-header">
            <span className="shoot-planner-forecast-condition">{forecast.conditions}</span>
            <span className="shoot-planner-forecast-light">{forecast.sunPosition}</span>
          </div>
          <div className="shoot-planner-forecast-detail">
            {forecast.lightQuality}
          </div>
          <div className="shoot-planner-forecast-note">
            {forecast.shootingNote}
          </div>
        </div>
      )}
    </div>
  );
}
