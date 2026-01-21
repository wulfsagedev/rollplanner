'use client';

import { useAppState } from '@/hooks/useAppState';
import { useWeather } from '@/hooks/useWeather';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toggle } from '@/components/Toggle';
import { Button } from '@/components/Button';
import { SelectorCard } from '@/components/SelectorCard';
import { GuidanceCard, GuidanceRow, MeteringTip } from '@/components/GuidanceCard';
import { WeatherDisplay } from '@/components/WeatherDisplay';
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
  DocumentaryIcon,
  NarrativeIcon,
  AbstractIcon,
  ExposureIcon,
  MeteringIcon
} from '@/components/icons';
import { getExposureGuidance, getMeteringTips, DISCIPLINES } from '@/lib/recommendation';
import { formatRollNumber, formatDate } from '@/lib/utils';

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

  const { weather, loading: weatherLoading, error: weatherError } = useWeather();

  return (
    <main className="app-container">
      {/* Persistent Header */}
      <header className="persistent-header">
        <div className="app-brand">
          <h1 className="app-title">Roll Planner</h1>
          <span className="app-version">v2.0</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Conditions Screen */}
      {screen === 'conditions' && (
        <div className="screen">
          {/* Weather Display */}
          <WeatherDisplay
            weather={weather}
            loading={weatherLoading}
            error={weatherError}
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

          {/* Light Selector */}
          <div className="selector-group">
            <div className="selector-label">Light</div>
            <div className="selector-options">
              {([
                { value: 'harsh', label: 'Harsh', icon: HarshLightIcon },
                { value: 'bright', label: 'Bright', icon: BrightLightIcon },
                { value: 'mixed', label: 'Mixed', icon: MixedLightIcon },
                { value: 'flat', label: 'Flat', icon: FlatLightIcon },
                { value: 'dim', label: 'Dim', icon: DimLightIcon },
                { value: 'dark', label: 'Dark', icon: DarkLightIcon }
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
                { value: 'documentary', label: 'Document', icon: DocumentaryIcon },
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

          {/* Get Recommendation Button */}
          <Button
            onClick={getRecommendation}
            disabled={!canGetRecommendation}
            pulse={canGetRecommendation}
          >
            Get Recommendation
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
