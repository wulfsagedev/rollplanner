'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { WeatherData } from '@/lib/types';
import { searchLocations, fetchForecastWeather, getSunTimes, LocationResult, SunTimes } from '@/lib/weather';

// Time-of-day theme types for dynamic theming
export type TimeOfDay = 'sunrise' | 'golden' | 'morning' | 'day' | 'afternoon' | 'blue-hour' | 'night' | null;

interface ShootPlannerProps {
  onForecastChange: (weather: WeatherData | null) => void;
  onModeChange: (isPlanning: boolean) => void;
  onTimeOfDayChange?: (timeOfDay: TimeOfDay) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Time slot configuration with photography-focused descriptions
// Each slot has a unique timeOfDay theme for color differentiation
const TIME_SLOTS = [
  { key: 'sunrise', label: 'Sunrise', desc: 'Soft warm light', timeOfDay: 'sunrise' as TimeOfDay },
  { key: 'goldenMorning', label: 'Golden', desc: 'Warm directional', timeOfDay: 'golden' as TimeOfDay },
  { key: 'midMorning', label: 'Soft', desc: 'Morning soft', timeOfDay: 'morning' as TimeOfDay },
  { key: 'midday', label: 'Midday', desc: 'High contrast', timeOfDay: 'day' as TimeOfDay },
  { key: 'midAfternoon', label: 'Soft', desc: 'Afternoon soft', timeOfDay: 'afternoon' as TimeOfDay },
  { key: 'goldenEvening', label: 'Golden', desc: 'Warm directional', timeOfDay: 'golden' as TimeOfDay },
  { key: 'twilight', label: 'Blue Hour', desc: 'Cool ambient', timeOfDay: 'blue-hour' as TimeOfDay },
  { key: 'night', label: 'Night', desc: 'Low light', timeOfDay: 'night' as TimeOfDay },
] as const;

export function ShootPlanner({ onForecastChange, onModeChange, onTimeOfDayChange }: ShootPlannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    // If it's past midday (12:00), default to tomorrow
    if (now.getHours() >= 12) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);
  const [forecast, setForecast] = useState<WeatherData | null>(null);
  const [forecastCache, setForecastCache] = useState<Map<string, WeatherData>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSunTimes, setIsLoadingSunTimes] = useState(false);
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

  // Preload all forecasts for a given date and sun times
  const preloadForecasts = useCallback(async (
    location: LocationResult,
    dateStr: string,
    times: SunTimes
  ) => {
    const newCache = new Map<string, WeatherData>();

    // Fetch all time slots in parallel
    const fetchPromises = TIME_SLOTS.map(async ({ key }) => {
      const time = times[key as keyof SunTimes];
      const targetDate = new Date(dateStr);
      targetDate.setHours(time.getHours(), time.getMinutes(), 0, 0);

      try {
        const data = await fetchForecastWeather(location.lat, location.lon, targetDate);
        if (data) {
          return { key: `${dateStr}-${key}`, data };
        }
        return null;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);
    results.forEach(result => {
      if (result && result.data) {
        newCache.set(result.key, result.data);
      }
    });

    setForecastCache(prev => {
      const merged = new Map(prev);
      newCache.forEach((value, key) => merged.set(key, value));
      return merged;
    });

    return newCache;
  }, []);

  // Handle location selection - fetch sun times and preload all forecasts
  const selectLocation = useCallback(async (location: LocationResult) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setShowResults(false);
    setSearchResults([]);
    setIsLoadingSunTimes(true);
    setForecastCache(new Map()); // Clear cache for new location
    // Blur input to dismiss mobile keyboard
    inputRef.current?.blur();

    // Fetch sun times for the selected location
    const date = new Date(selectedDate);
    const times = await getSunTimes(location.lat, location.lon, date);

    setIsLoadingSunTimes(false);
    if (times) {
      setSunTimes(times);
      // Auto-select midday as default
      setSelectedTime(formatTime(times.midday));
      setSelectedTimeSlot('midday');
      onTimeOfDayChange?.('day');

      // Preload all forecasts for instant switching
      const cache = await preloadForecasts(location, selectedDate, times);

      // Set initial forecast from cache
      const cachedForecast = cache.get(`${selectedDate}-midday`);
      if (cachedForecast) {
        setForecast(cachedForecast);
        onForecastChange(cachedForecast);
      }
    }
  }, [selectedDate, onTimeOfDayChange, preloadForecasts, onForecastChange]);

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

  // Fetch sun times and preload forecasts when date changes
  useEffect(() => {
    if (!selectedLocation) {
      setSunTimes(null);
      return;
    }

    let isCancelled = false;

    const fetchSunTimesAndForecasts = async () => {
      // Check if we already have forecasts for this date
      const cacheKey = `${selectedDate}-midday`;
      const hasCachedData = forecastCache.has(cacheKey);

      if (!hasCachedData) {
        setIsLoadingSunTimes(true);
      }

      const date = new Date(selectedDate);
      const times = await getSunTimes(selectedLocation.lat, selectedLocation.lon, date);

      if (!isCancelled && times) {
        setSunTimes(times);
        setIsLoadingSunTimes(false);

        // Keep selected time slot, update the actual time value
        if (selectedTimeSlot) {
          const slotTime = times[selectedTimeSlot as keyof SunTimes];
          if (slotTime) {
            setSelectedTime(formatTime(slotTime));
          }
        }

        // Preload forecasts if not cached
        if (!hasCachedData) {
          const cache = await preloadForecasts(selectedLocation, selectedDate, times);

          // Update forecast from cache
          if (selectedTimeSlot && !isCancelled) {
            const cachedForecast = cache.get(`${selectedDate}-${selectedTimeSlot}`);
            if (cachedForecast) {
              setForecast(cachedForecast);
              onForecastChange(cachedForecast);
            }
          }
        }
      } else if (!isCancelled) {
        setIsLoadingSunTimes(false);
      }
    };

    fetchSunTimesAndForecasts();

    return () => {
      isCancelled = true;
    };
  }, [selectedLocation, selectedDate, selectedTimeSlot, forecastCache, preloadForecasts, onForecastChange]);

  // Use cached forecast when time slot changes - instant switching
  useEffect(() => {
    if (!selectedLocation || !selectedTimeSlot) {
      setForecast(null);
      onForecastChange(null);
      return;
    }

    // Check cache first for instant switching
    const cacheKey = `${selectedDate}-${selectedTimeSlot}`;
    const cachedForecast = forecastCache.get(cacheKey);

    if (cachedForecast) {
      // Instant update from cache
      setForecast(cachedForecast);
      onForecastChange(cachedForecast);
      setIsFetching(false);
      return;
    }

    // Fallback to fetching if not in cache (shouldn't happen normally)
    if (!selectedTime) return;

    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    setIsFetching(true);

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
  }, [selectedLocation, selectedDate, selectedTime, selectedTimeSlot, forecastCache, onForecastChange]);

  const handleClear = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    setForecast(null);
    setForecastCache(new Map());
    setSunTimes(null);
    setSearchResults([]);
    setShowResults(false);
    setSelectedTime('');
    setSelectedTimeSlot(null);
    onForecastChange(null);
    onModeChange(false);
    onTimeOfDayChange?.(null);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setIsExpanded(true);
    onModeChange(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleTimeSlotSelect = useCallback((time: Date, slotKey: string, timeOfDay: TimeOfDay) => {
    setSelectedTime(formatTime(time));
    setSelectedTimeSlot(slotKey);
    onTimeOfDayChange?.(timeOfDay);
  }, [onTimeOfDayChange]);

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
            enterKeyHint="search"
            inputMode="search"
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

      {/* Date Selection */}
      {selectedLocation && (
        <div className="shoot-planner-section">
          <div className="shoot-planner-section-label">Date</div>
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

      {/* Loading state for sun times */}
      {selectedLocation && isLoadingSunTimes && !sunTimes && (
        <div className="shoot-planner-loading">
          <span className="shoot-planner-loading-led" />
          <span className="shoot-planner-loading-text">Loading times...</span>
        </div>
      )}

      {/* Time Selection */}
      {sunTimes && !isLoadingSunTimes && (
        <div className="shoot-planner-section">
          <div className="shoot-planner-section-label">Time</div>
          <div className="shoot-planner-times-grid">
            {TIME_SLOTS.map(({ key, label, desc, timeOfDay }) => {
              const time = sunTimes[key as keyof SunTimes];
              const timeStr = formatTime(time);
              return (
                <button
                  key={key}
                  onClick={() => handleTimeSlotSelect(time, key, timeOfDay)}
                  className={`shoot-planner-time-btn ${selectedTimeSlot === key ? 'active' : ''}`}
                  title={desc}
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
              <span className="shoot-planner-loading-led" />
              <span className="shoot-planner-loading-text">Loading forecast...</span>
            </div>
          ) : forecast && selectedLocation && (
            <>
              <div className="shoot-planner-forecast-header">
                <span className="shoot-planner-forecast-location">{selectedLocation.name}</span>
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
