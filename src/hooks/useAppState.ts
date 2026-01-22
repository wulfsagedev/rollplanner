'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  AppState,
  LightCondition,
  Environment,
  Intent,
  FilmType,
  FilmFormat,
  WeatherData,
  FrameLog,
  RollFrameCount
} from '@/lib/types';
import { getRecommendation as generateRecommendation, getGuidanceForFilm } from '@/lib/recommendation';

const initialState: AppState = {
  light: null,
  environment: null,
  intent: null,
  filmType: 'color',
  filmFormat: '35mm',
  location: null,
  weather: null,
  recommendation: null,
  active: false,
  rollNumber: null,
  loadedAt: null,
  currentFrame: 1,
  totalFrames: 36,
  frameLog: []
};

// Helper to get default frame count based on format
function getDefaultFrameCount(format: FilmFormat): RollFrameCount {
  return format === '120' ? 12 : 36;
}

export function useAppState() {
  const [state, setState] = useState<AppState>(initialState);
  const [screen, setScreen] = useState<'conditions' | 'recommendation' | 'active'>('conditions');

  // Load persisted state on mount
  useEffect(() => {
    const stored = localStorage.getItem('rollplanner_active_roll');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migration: support old 'locked' key for backwards compatibility
        if (parsed.active || parsed.locked) {
          // Migrate old state shape if needed
          if (parsed.locked !== undefined) {
            parsed.active = parsed.locked;
            delete parsed.locked;
          }
          if (parsed.lockedAt !== undefined) {
            parsed.loadedAt = parsed.lockedAt;
            delete parsed.lockedAt;
          }
          setState(parsed);
          setScreen('active');
        }
      } catch {
        // Invalid stored state, ignore
      }
    }
    // Also migrate old localStorage key
    const oldStored = localStorage.getItem('rollplanner_current');
    if (oldStored && !stored) {
      try {
        const parsed = JSON.parse(oldStored);
        if (parsed.locked) {
          parsed.active = parsed.locked;
          delete parsed.locked;
          if (parsed.lockedAt) {
            parsed.loadedAt = parsed.lockedAt;
            delete parsed.lockedAt;
          }
          setState(parsed);
          setScreen('active');
          // Migrate to new key
          localStorage.setItem('rollplanner_active_roll', JSON.stringify(parsed));
          localStorage.removeItem('rollplanner_current');
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
    // Scroll to top on screen change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.light, state.environment, state.intent, state.weather, state.filmType, state.filmFormat]);

  // Select a specific film ("I have this film" flow)
  const selectFilm = useCallback((filmKey: string) => {
    const recommendation = getGuidanceForFilm(
      filmKey,
      state.light,
      state.weather,
      state.filmType
    );

    setState(prev => ({ ...prev, recommendation }));
    setScreen('recommendation');
    // Scroll to top on screen change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.light, state.weather, state.filmType]);

  // Load the roll (start shooting with this film)
  const loadRoll = useCallback(() => {
    const rollCount = parseInt(localStorage.getItem('rollplanner_roll_count') || '0', 10);
    const newRollNumber = rollCount + 1;
    localStorage.setItem('rollplanner_roll_count', newRollNumber.toString());

    const newState: AppState = {
      ...state,
      active: true,
      rollNumber: newRollNumber,
      loadedAt: new Date().toISOString(),
      currentFrame: 1,
      totalFrames: getDefaultFrameCount(state.filmFormat),
      frameLog: []
    };

    setState(newState);
    localStorage.setItem('rollplanner_active_roll', JSON.stringify(newState));
    setScreen('active');
    // Scroll to top on screen change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state]);

  // Finish roll (archive and start fresh)
  const finishRoll = useCallback(() => {
    // TODO: In Phase 3, save to roll history before clearing
    localStorage.removeItem('rollplanner_active_roll');
    setState(initialState);
    setScreen('conditions');
    // Scroll to top on screen change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Go back to conditions (from recommendation screen, preserves selections)
  const goBack = useCallback(() => {
    setScreen('conditions');
    // Scroll to top on screen change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Change film (from active roll, clears active state to pick new film)
  const changeFilm = useCallback(() => {
    localStorage.removeItem('rollplanner_active_roll');
    setState(initialState);
    setScreen('conditions');
    // Scroll to top on screen change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Go to active roll (if one exists)
  const goToActiveRoll = useCallback(() => {
    if (state.active) {
      setScreen('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.active]);

  // ============================================
  // FRAME TRACKING (Phase 2)
  // ============================================

  // Advance to next frame
  const advanceFrame = useCallback(() => {
    if (!state.active || state.currentFrame >= state.totalFrames) return;

    const newState: AppState = {
      ...state,
      currentFrame: state.currentFrame + 1
    };
    setState(newState);
    localStorage.setItem('rollplanner_active_roll', JSON.stringify(newState));
  }, [state]);

  // Go back one frame
  const previousFrame = useCallback(() => {
    if (!state.active || state.currentFrame <= 1) return;

    const newState: AppState = {
      ...state,
      currentFrame: state.currentFrame - 1
    };
    setState(newState);
    localStorage.setItem('rollplanner_active_roll', JSON.stringify(newState));
  }, [state]);

  // Set specific frame number
  const setFrame = useCallback((frameNumber: number) => {
    if (!state.active || frameNumber < 1 || frameNumber > state.totalFrames) return;

    const newState: AppState = {
      ...state,
      currentFrame: frameNumber
    };
    setState(newState);
    localStorage.setItem('rollplanner_active_roll', JSON.stringify(newState));
  }, [state]);

  // Change total frames (e.g., 24 vs 36 for 35mm)
  const setTotalFrames = useCallback((totalFrames: RollFrameCount) => {
    if (!state.active) return;

    const newState: AppState = {
      ...state,
      totalFrames,
      // Clamp current frame if it exceeds new total
      currentFrame: Math.min(state.currentFrame, totalFrames)
    };
    setState(newState);
    localStorage.setItem('rollplanner_active_roll', JSON.stringify(newState));
  }, [state]);

  // Log data for current frame
  const logFrame = useCallback((data: Omit<FrameLog, 'frameNumber' | 'timestamp'>) => {
    if (!state.active) return;

    const frameLog: FrameLog = {
      frameNumber: state.currentFrame,
      aperture: data.aperture,
      shutter: data.shutter,
      notes: data.notes,
      timestamp: new Date().toISOString()
    };

    // Update or add frame log entry
    const existingIndex = state.frameLog.findIndex(f => f.frameNumber === state.currentFrame);
    const newFrameLog = [...state.frameLog];

    if (existingIndex >= 0) {
      newFrameLog[existingIndex] = frameLog;
    } else {
      newFrameLog.push(frameLog);
      // Sort by frame number
      newFrameLog.sort((a, b) => a.frameNumber - b.frameNumber);
    }

    const newState: AppState = {
      ...state,
      frameLog: newFrameLog
    };
    setState(newState);
    localStorage.setItem('rollplanner_active_roll', JSON.stringify(newState));
  }, [state]);

  // Get log for a specific frame
  const getFrameLog = useCallback((frameNumber: number): FrameLog | undefined => {
    return state.frameLog.find(f => f.frameNumber === frameNumber);
  }, [state.frameLog]);

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
    selectFilm,
    loadRoll,
    finishRoll,
    goBack,
    changeFilm,
    goToActiveRoll,
    // Frame tracking
    advanceFrame,
    previousFrame,
    setFrame,
    setTotalFrames,
    logFrame,
    getFrameLog
  };
}
