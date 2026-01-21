'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  AppState,
  LightCondition,
  Environment,
  Intent,
  FilmType,
  FilmFormat,
  Recommendation,
  WeatherData
} from '@/lib/types';
import { getRecommendation as generateRecommendation } from '@/lib/recommendation';

const initialState: AppState = {
  light: null,
  environment: null,
  intent: null,
  filmType: 'color',
  filmFormat: '35mm',
  location: null,
  weather: null,
  recommendation: null,
  locked: false,
  rollNumber: null,
  lockedAt: null
};

export function useAppState() {
  const [state, setState] = useState<AppState>(initialState);
  const [screen, setScreen] = useState<'conditions' | 'recommendation' | 'locked'>('conditions');

  // Load persisted state on mount
  useEffect(() => {
    const stored = localStorage.getItem('rollplanner_current');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.locked) {
          setState(parsed);
          setScreen('locked');
        }
      } catch {
        // Invalid stored state, ignore
      }
    }
  }, []);

  // Setters
  const setLight = useCallback((light: LightCondition | null) => {
    setState(prev => ({ ...prev, light }));
  }, []);

  const setEnvironment = useCallback((environment: Environment | null) => {
    setState(prev => ({ ...prev, environment }));
  }, []);

  const setIntent = useCallback((intent: Intent | null) => {
    setState(prev => ({ ...prev, intent }));
  }, []);

  const setFilmType = useCallback((filmType: FilmType) => {
    setState(prev => ({ ...prev, filmType }));
  }, []);

  const setFilmFormat = useCallback((filmFormat: FilmFormat) => {
    setState(prev => ({ ...prev, filmFormat }));
  }, []);

  const setWeather = useCallback((weather: WeatherData | null) => {
    setState(prev => ({ ...prev, weather }));
  }, []);

  const setLocation = useCallback((location: GeolocationCoordinates | null) => {
    setState(prev => ({ ...prev, location }));
  }, []);

  // Check if we can generate a recommendation
  const canGetRecommendation = Boolean(state.light && state.environment && state.intent);

  // Generate recommendation
  const getRecommendation = useCallback(() => {
    if (!state.light || !state.environment || !state.intent) return;

    const recommendation = generateRecommendation(
      state.light,
      state.environment,
      state.intent,
      state.weather, // Pass full weather data for optimized algorithm
      state.filmType,
      state.filmFormat
    );

    setState(prev => ({ ...prev, recommendation }));
    setScreen('recommendation');
  }, [state.light, state.environment, state.intent, state.weather, state.filmType, state.filmFormat]);

  // Lock the roll
  const lockRoll = useCallback(() => {
    const rollCount = parseInt(localStorage.getItem('rollplanner_roll_count') || '0', 10);
    const newRollNumber = rollCount + 1;
    localStorage.setItem('rollplanner_roll_count', newRollNumber.toString());

    const newState: AppState = {
      ...state,
      locked: true,
      rollNumber: newRollNumber,
      lockedAt: new Date().toISOString()
    };

    setState(newState);
    localStorage.setItem('rollplanner_current', JSON.stringify(newState));
    setScreen('locked');
  }, [state]);

  // Start over
  const startOver = useCallback(() => {
    localStorage.removeItem('rollplanner_current');
    setState(initialState);
    setScreen('conditions');
  }, []);

  // Go back to conditions
  const goBack = useCallback(() => {
    setScreen('conditions');
  }, []);

  return {
    state,
    screen,
    setLight,
    setEnvironment,
    setIntent,
    setFilmType,
    setFilmFormat,
    setWeather,
    setLocation,
    canGetRecommendation,
    getRecommendation,
    lockRoll,
    startOver,
    goBack
  };
}
