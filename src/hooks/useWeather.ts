'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WeatherData } from '@/lib/types';
import { fetchWeather } from '@/lib/weather';

interface UseWeatherResult {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Minimum distance (meters) to trigger a weather update
const MIN_DISTANCE_CHANGE = 500;

// Minimum time between weather fetches (ms)
const MIN_FETCH_INTERVAL = 60000; // 1 minute

// Calculate distance between two coordinates (Haversine formula)
function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useWeather(): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lastFetchRef = useRef<{ lat: number; lon: number; time: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const fetchWeatherData = useCallback(async (lat: number, lon: number, force = false) => {
    const now = Date.now();
    const last = lastFetchRef.current;

    // Check if we should skip this fetch (too recent or too close)
    if (!force && last) {
      const timeSinceLast = now - last.time;
      const distance = getDistance(last.lat, last.lon, lat, lon);

      if (timeSinceLast < MIN_FETCH_INTERVAL && distance < MIN_DISTANCE_CHANGE) {
        return;
      }
    }

    try {
      const data = await fetchWeather(lat, lon);
      if (data) {
        setWeather(data);
        setError(null);
        lastFetchRef.current = { lat, lon, time: now };
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to fetch weather');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (lastFetchRef.current) {
      fetchWeatherData(lastFetchRef.current.lat, lastFetchRef.current.lon, true);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeatherData(pos.coords.latitude, pos.coords.longitude, true),
        () => setError('Location access denied')
      );
    }
  }, [fetchWeatherData]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherData(position.coords.latitude, position.coords.longitude, true);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Enable location for weather');
        } else {
          setError('Unable to get location');
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    // Watch for position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        fetchWeatherData(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        console.warn('Position watch error:', err);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 30000
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [fetchWeatherData]);

  return {
    weather,
    loading,
    error,
    refresh
  };
}
