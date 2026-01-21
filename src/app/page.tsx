'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { useWeather } from '@/hooks/useWeather';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toggle } from '@/components/Toggle';
import { Button } from '@/components/Button';
import { SelectorCard } from '@/components/SelectorCard';
import { GuidanceCard, GuidanceRow, MeteringTip } from '@/components/GuidanceCard';
import { WeatherDisplay } from '@/components/WeatherDisplay';
import { ShootPlanner, TimeOfDay } from '@/components/ShootPlanner';
import { WeatherData, LightCondition } from '@/lib/types';
import {
  HarshLightIcon,
  BrightLightIcon,
  MixedLightIcon,
  FlatLightIcon,
  DimLightIcon,
  DarkLightIcon,
  PortraitIcon,
  StreetIcon,
  ArchitectureIcon,
  InteriorsIcon,
  LandscapeIcon,
  NatureIcon,
  MinimalIcon,
  GraphicIcon,
  ExpressiveIcon,
  TravelIcon,
  NarrativeIcon,
  AbstractIcon,
  ExposureIcon,
  MeteringIcon
} from '@/components/icons';
import { getExposureGuidance, getMeteringTips, DISCIPLINES } from '@/lib/recommendation';
import { formatRollNumber, formatDate } from '@/lib/utils';

// Derive light condition from weather forecast
function deriveLightFromWeather(weather: WeatherData): LightCondition {
  const { sunPosition, cloudCover } = weather;

  // Night/twilight = dark or dim
  if (sunPosition === 'night') return 'dark';
  if (sunPosition === 'twilight') return 'dim';

  // Golden hour with clear skies = bright, with clouds = mixed
  if (sunPosition === 'golden') {
    return cloudCover > 50 ? 'mixed' : 'bright';
  }

  // High sun (midday)
  if (sunPosition === 'high') {
    if (cloudCover > 80) return 'flat';
    if (cloudCover > 40) return 'mixed';
    return 'harsh';
  }

  // Low sun (morning/afternoon)
  if (cloudCover > 70) return 'flat';
  if (cloudCover > 30) return 'mixed';
  return 'bright';
}

export default function Home() {
  const {
    state,
    screen,
    setLight,
    setEnvironment,
    setIntent,
    setFilmType,
    setFilmFormat,
    canGetRecommendation,
    getRecommendation,
    lockRoll,
    startOver,
    goBack
  } = useAppState();

  const { weather: currentWeather, loading: weatherLoading, error: weatherError } = useWeather();

  // Planned shoot state
  const [isPlanning, setIsPlanning] = useState(false);
  const [plannedWeather, setPlannedWeather] = useState<WeatherData | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(null);

  // Use planned weather if planning, otherwise current weather
  const weather = isPlanning && plannedWeather ? plannedWeather : currentWeather;

  // Apply time-of-day theme when planning
  useEffect(() => {
    const html = document.documentElement;
    const timeClasses = ['time-sunrise', 'time-golden', 'time-blue-hour', 'time-night'];

    // Add transition for smooth theme changes
    html.classList.add('theme-transitioning');

    // Remove all time classes first
    timeClasses.forEach(cls => html.classList.remove(cls));

    // Night is special - it activates actual dark mode
    if (timeOfDay === 'night') {
      html.classList.add('dark');
      localStorage.setItem('rollplanner_theme', 'dark');
    } else if (timeOfDay) {
      // Apply time-of-day class for other times
      html.classList.add(`time-${timeOfDay}`);
    }

    // Remove transition class after animation
    const timer = setTimeout(() => {
      html.classList.remove('theme-transitioning');
    }, 500);

    return () => clearTimeout(timer);
  }, [timeOfDay]);

  const handleForecastChange = useCallback((forecast: WeatherData | null) => {
    setPlannedWeather(forecast);
    // Auto-set light based on forecast conditions
    if (forecast) {
      setLight(deriveLightFromWeather(forecast));
    }
  }, [setLight]);

  const handleModeChange = useCallback((planning: boolean) => {
    setIsPlanning(planning);
    if (!planning) {
      setPlannedWeather(null);
      setLight(null); // Reset light selection when exiting planning mode
      // Clear time-of-day state - if night was selected, dark mode persists via localStorage
      setTimeOfDay(null);
    }
  }, [setLight]);

  const handleTimeOfDayChange = useCallback((newTimeOfDay: TimeOfDay) => {
    setTimeOfDay(newTimeOfDay);
  }, []);

  return (
    <main className="app-container">
      {/* Persistent Header */}
      <header className="persistent-header">
        <div className="app-brand">
          <h1 className="app-title">Roll Planner</h1>
          <span className="app-version">v1.0</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Conditions Screen */}
      {screen === 'conditions' && (
        <div className="screen">
          {/* Current Weather Display (hidden when planning) */}
          <div className={`weather-wrapper ${isPlanning ? 'hiding' : ''}`}>
            <WeatherDisplay
              weather={currentWeather}
              loading={weatherLoading}
              error={weatherError}
            />
          </div>

          {/* Shoot Planner */}
          <ShootPlanner
            onForecastChange={handleForecastChange}
            onModeChange={handleModeChange}
            onTimeOfDayChange={handleTimeOfDayChange}
          />

          {/* Film Toggles */}
          <div className="film-toggles-row">
            <Toggle
              leftLabel="Colour"
              rightLabel="B&W"
              value={state.filmType === 'color' ? 'left' : 'right'}
              onChange={(v) => setFilmType(v === 'left' ? 'color' : 'bw')}
            />
            <Toggle
              leftLabel="35mm"
              rightLabel="120"
              value={state.filmFormat === '35mm' ? 'left' : 'right'}
              onChange={(v) => setFilmFormat(v === 'left' ? '35mm' : '120')}
            />
          </div>

          {/* Light Selector - hidden when planning (forecast provides light info) */}
          <div className={`selector-group ${isPlanning ? 'hiding' : ''}`}>
            <div className="selector-label">Light</div>
            <div className="selector-options">
              {([
                { value: 'harsh', label: 'Midday', icon: HarshLightIcon },
                { value: 'bright', label: 'Golden', icon: BrightLightIcon },
                { value: 'mixed', label: 'Soft', icon: MixedLightIcon },
                { value: 'flat', label: 'Overcast', icon: FlatLightIcon },
                { value: 'dim', label: 'Blue Hour', icon: DimLightIcon },
                { value: 'dark', label: 'Night', icon: DarkLightIcon }
              ] as const).map(({ value, label, icon: Icon }) => (
                <SelectorCard
                  key={value}
                  icon={<Icon className="w-full h-full" />}
                  label={label}
                  selected={state.light === value}
                  onClick={() => setLight(state.light === value ? null : value)}
                />
              ))}
            </div>
          </div>

          {/* Environment Selector */}
          <div className="selector-group">
            <div className="selector-label">Environment</div>
            <div className="selector-options">
              {([
                { value: 'portrait', label: 'Portrait', icon: PortraitIcon },
                { value: 'street', label: 'Street', icon: StreetIcon },
                { value: 'architecture', label: 'Archi', icon: ArchitectureIcon },
                { value: 'interiors', label: 'Interiors', icon: InteriorsIcon },
                { value: 'landscape', label: 'Landscape', icon: LandscapeIcon },
                { value: 'nature', label: 'Nature', icon: NatureIcon }
              ] as const).map(({ value, label, icon: Icon }) => (
                <SelectorCard
                  key={value}
                  icon={<Icon className="w-full h-full" />}
                  label={label}
                  selected={state.environment === value}
                  onClick={() => setEnvironment(state.environment === value ? null : value)}
                />
              ))}
            </div>
          </div>

          {/* Intent Selector */}
          <div className="selector-group">
            <div className="selector-label">Intent</div>
            <div className="selector-options">
              {([
                { value: 'calm', label: 'Minimal', icon: MinimalIcon },
                { value: 'graphic', label: 'Graphic', icon: GraphicIcon },
                { value: 'emotional', label: 'Expressive', icon: ExpressiveIcon },
                { value: 'travel', label: 'Travel', icon: TravelIcon },
                { value: 'narrative', label: 'Narrative', icon: NarrativeIcon },
                { value: 'abstract', label: 'Abstract', icon: AbstractIcon }
              ] as const).map(({ value, label, icon: Icon }) => (
                <SelectorCard
                  key={value}
                  icon={<Icon className="w-full h-full" />}
                  label={label}
                  selected={state.intent === value}
                  onClick={() => setIntent(state.intent === value ? null : value)}
                />
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="spacer" />

          {/* Plan Roll Button */}
          <Button
            onClick={getRecommendation}
            disabled={!canGetRecommendation}
            pulse={canGetRecommendation}
          >
            Plan Roll
          </Button>
        </div>
      )}

      {/* Recommendation Screen */}
      {screen === 'recommendation' && state.recommendation && state.light && state.environment && state.intent && (
        <div className="screen">
          {/* Header Row */}
          <div className="screen-header-row">
            <button onClick={goBack} className="back-link">
              ← Back
            </button>
            <h2 className="screen-title">Your Roll</h2>
          </div>

          {/* Settings Summary */}
          <div className="settings-summary">
            <div className="settings-summary-item">
              <div className="settings-summary-label">Light</div>
              <div className="settings-summary-value">{state.light}</div>
            </div>
            <div className="settings-summary-item">
              <div className="settings-summary-label">Environment</div>
              <div className="settings-summary-value">{state.environment}</div>
            </div>
            <div className="settings-summary-item">
              <div className="settings-summary-label">Intent</div>
              <div className="settings-summary-value">{state.intent}</div>
            </div>
            <div className="settings-summary-item">
              <div className="settings-summary-label">Format</div>
              <div className="settings-summary-value">{state.filmFormat} {state.filmType === 'color' ? 'Colour' : 'B&W'}</div>
            </div>
            {weather && (
              <div className="settings-summary-item full-width">
                <div className="settings-summary-label">Conditions</div>
                <div className="settings-summary-value">{weather.conditions} · {weather.lightQuality}</div>
              </div>
            )}
          </div>

          {/* Film Card */}
          <div className="film-card">
            <div className="film-stock">
              {state.recommendation.film}
            </div>
            <div className="film-ei">
              ISO {state.recommendation.ei}
            </div>

            <div className="film-divider" />

            <div className="film-detail">
              <div className="film-detail-label">
                Exposure approach
              </div>
              <div className="film-detail-value">
                {state.recommendation.exposure}
              </div>
            </div>

            <div className="film-discipline">
              {DISCIPLINES[state.intent]}
            </div>
          </div>

          {/* Exposure Settings */}
          {(() => {
            const exposure = getExposureGuidance(state.light, state.recommendation.ei, state.environment, weather);
            return (
              <GuidanceCard
                icon={<ExposureIcon className="w-full h-full" />}
                title="Exposure Settings"
                note={exposure.note}
              >
                <GuidanceRow label="Aperture" value={exposure.aperture} />
                <GuidanceRow label="Shutter" value={exposure.shutter} />
                <GuidanceRow label="ISO" value={state.recommendation.ei.toString()} />
              </GuidanceCard>
            );
          })()}

          {/* Metering Tips */}
          {(() => {
            const metering = getMeteringTips(state.light, state.environment, state.intent, weather);
            return (
              <GuidanceCard
                icon={<MeteringIcon className="w-full h-full" />}
                title="Metering Tips"
              >
                <MeteringTip>{metering.primary}</MeteringTip>
                <MeteringTip secondary>{metering.secondary}</MeteringTip>
              </GuidanceCard>
            );
          })()}

          {/* Spacer */}
          <div className="spacer" />

          {/* Lock Button */}
          <Button onClick={lockRoll}>
            Lock this roll
          </Button>
        </div>
      )}

      {/* Locked Screen */}
      {screen === 'locked' && state.recommendation && state.locked && state.intent && (
        <div className="screen">
          {/* Header Row */}
          <div className="screen-header-row">
            <span className="locked-meta">
              Roll {formatRollNumber(state.rollNumber || 1)}
            </span>
            <span className="locked-meta">
              {state.lockedAt ? formatDate(new Date(state.lockedAt)) : ''}
            </span>
          </div>

          {/* Hero */}
          <div className="locked-hero">
            <div className="locked-film-name">
              {state.recommendation.film}
            </div>
            <div className="locked-film-ei">
              ISO {state.recommendation.ei}
            </div>
          </div>

          {/* Guidance */}
          <div className="locked-guidance">
            <div className="locked-guidance-text">
              {state.recommendation.exposure}
            </div>
          </div>

          {/* Discipline */}
          <div className="locked-discipline">
            &quot;{DISCIPLINES[state.intent]}&quot;
          </div>

          {/* Spacer */}
          <div className="spacer" />

          {/* Start Over Button */}
          <Button variant="secondary" onClick={startOver}>
            New roll
          </Button>
        </div>
      )}
    </main>
  );
}
