'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { WeatherData } from '@/lib/types';
import { searchLocations, fetchForecastWeather, getSunTimes, LocationResult, SunTimes } from '@/lib/weather';

interface ShootPlannerProps {
  onForecastChange: (weather: WeatherData | null) => void;
  onModeChange: (isPlanning: boolean) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Time slot configuration for cleaner rendering
const TIME_SLOTS = [
  { key: 'sunrise', label: 'Sunrise' },
  { key: 'goldenMorning', label: 'Golden' },
  { key: 'midMorning', label: 'Mid AM' },
  { key: 'midday', label: 'Noon' },
  { key: 'midAfternoon', label: 'Mid PM' },
  { key: 'goldenEvening', label: 'Golden' },
  { key: 'sunset', label: 'Sunset' },
  { key: 'twilight', label: 'Dusk' },
] as const;

export function ShootPlanner({ onForecastChange, onModeChange }: ShootPlannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);
  const [forecast, setForecast] = useState<WeatherData | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Memoize available dates
  const availableDates = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      value: date.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    };
  }), []);

  // Handle location selection - fetch sun times immediately
  const selectLocation = useCallback(async (location: LocationResult) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setShowResults(false);
    setSearchResults([]);

    // Immediately fetch sun times for instant UI update
    const date = new Date(selectedDate);
    const times = await getSunTimes(location.lat, location.lon, date);
    if (times) {
      setSunTimes(times);
      // Auto-select golden evening as default (most popular shoot time)
      setSelectedTime(formatTime(times.goldenEvening));
    }
  }, [selectedDate]);

  // Fast debounced location search - 100ms for instant feel
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    // If query matches selected location, don't search
    if (selectedLocation && selectedLocation.name.toUpperCase() === searchQuery.toUpperCase()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Cancel any in-flight search request
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    searchAbortRef.current = new AbortController();

    // Very fast debounce - cached searches are instant
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(searchQuery);

        // Only update if this search wasn't aborted
        if (!searchAbortRef.current?.signal.aborted) {
          setSearchResults(results);
          setIsSearching(false);
          setShowResults(results.length > 0);
        }
      } catch {
        if (!searchAbortRef.current?.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 100);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, selectedLocation]);

  // Fetch sun times when date changes (location already handled in selectLocation)
  useEffect(() => {
    if (!selectedLocation) {
      setSunTimes(null);
      return;
    }

    const fetchSunTimesData = async () => {
      const date = new Date(selectedDate);
      const times = await getSunTimes(selectedLocation.lat, selectedLocation.lon, date);
      if (times) {
        setSunTimes(times);
        // Keep selected time if still valid, otherwise select golden evening
        if (!selectedTime) {
          setSelectedTime(formatTime(times.goldenEvening));
        }
      }
    };

    fetchSunTimesData();
  }, [selectedLocation, selectedDate, selectedTime]);

  // Fast forecast fetch - minimal debounce since cache handles repeat requests
  useEffect(() => {
    if (!selectedLocation || !selectedTime) {
      setForecast(null);
      onForecastChange(null);
      return;
    }

    // Cancel any pending fetch
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    setIsFetching(true);

    // Minimal debounce - just enough to batch rapid clicks
    fetchTimeoutRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const targetDate = new Date(selectedDate);
      targetDate.setHours(hours, minutes, 0, 0);

      try {
        const data = await fetchForecastWeather(
          selectedLocation.lat,
          selectedLocation.lon,
          targetDate
        );

        if (!abortControllerRef.current?.signal.aborted) {
          setForecast(data);
          onForecastChange(data);
          setIsFetching(false);
        }
      } catch {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsFetching(false);
        }
      }
    }, 50);

    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [selectedLocation, selectedDate, selectedTime, onForecastChange]);

  const handleClear = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    setForecast(null);
    setSunTimes(null);
    setSearchResults([]);
    setShowResults(false);
    setSelectedTime('');
    onForecastChange(null);
    onModeChange(false);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setIsExpanded(true);
    onModeChange(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const setQuickTime = useCallback((time: Date) => {
    setSelectedTime(formatTime(time));
  }, []);

  if (!isExpanded) {
    return (
      <button onClick={handleExpand} className="shoot-planner-toggle">
        <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>Plan a shoot</span>
      </button>
    );
  }

  return (
    <div className="shoot-planner">
      {/* Minimal header */}
      <div className="shoot-planner-header">
        <span className="shoot-planner-title">Plan Shoot</span>
        <button onClick={handleClear} className="shoot-planner-close" aria-label="Close">
          <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Location Search - Compact */}
      <div className="shoot-planner-field">
        <div className="shoot-planner-search">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedLocation && e.target.value !== selectedLocation.name) {
                setSelectedLocation(null);
                setSunTimes(null);
                setForecast(null);
              }
            }}
            onKeyDown={(e) => {
              // Enter key selects first result
              if (e.key === 'Enter' && searchResults.length > 0 && !selectedLocation) {
                e.preventDefault();
                selectLocation(searchResults[0]);
              }
              // Escape closes dropdown
              if (e.key === 'Escape') {
                setShowResults(false);
                inputRef.current?.blur();
              }
            }}
            placeholder="Location"
            className="shoot-planner-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onFocus={() => searchResults.length > 0 && !selectedLocation && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
          />
          <div className="shoot-planner-status">
            {isSearching && <span className="shoot-planner-dots" />}
            {selectedLocation && !isSearching && (
              <svg style={{ width: 12, height: 12, color: 'var(--led-on)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="shoot-planner-results">
            {searchResults.slice(0, 4).map((result, index) => (
              <button
                key={index}
                onMouseDown={(e) => { e.preventDefault(); selectLocation(result); }}
                className="shoot-planner-result"
              >
                <span className="shoot-planner-result-name">{result.name}</span>
                <span className="shoot-planner-result-detail">
                  {result.displayName.split(',').slice(1, 3).join(', ')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date - Inline pills */}
      {selectedLocation && (
        <div className="shoot-planner-field">
          <div className="shoot-planner-date-row">
            {availableDates.slice(0, 5).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSelectedDate(value)}
                className={`shoot-planner-date-btn ${selectedDate === value ? 'active' : ''}`}
              >
                {label === 'Today' || label === 'Tomorrow' ? label : label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time Grid - Clean 4x2 */}
      {sunTimes && (
        <div className="shoot-planner-field">
          <div className="shoot-planner-times-grid">
            {TIME_SLOTS.map(({ key, label }) => {
              const time = sunTimes[key as keyof SunTimes];
              const timeStr = formatTime(time);
              return (
                <button
                  key={key}
                  onClick={() => setQuickTime(time)}
                  className={`shoot-planner-time-btn ${selectedTime === timeStr ? 'active' : ''}`}
                >
                  <span className="shoot-planner-time-value">{timeStr}</span>
                  <span className="shoot-planner-time-label">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Forecast - Clean card */}
      {(forecast || isFetching) && (
        <div className={`shoot-planner-forecast ${isFetching ? 'loading' : ''}`}>
          {isFetching ? (
            <div className="shoot-planner-forecast-loading">
              <span className="shoot-planner-pulse" />
            </div>
          ) : forecast && (
            <>
              <div className="shoot-planner-forecast-header">
                <span className="shoot-planner-forecast-location">{forecast.locationName}</span>
                <span className="shoot-planner-forecast-sun">{forecast.sunPosition}</span>
              </div>
              <div className="shoot-planner-forecast-condition">{forecast.conditions}</div>
              <div className="shoot-planner-forecast-light">{forecast.lightQuality}</div>
              <div className="shoot-planner-forecast-note">{forecast.shootingNote}</div>
            </>
          )}
        </div>
      )}

      {/* Minimal help */}
      {!selectedLocation && (
        <div className="shoot-planner-help">
          Enter a location to see conditions
        </div>
      )}
    </div>
  );
}
