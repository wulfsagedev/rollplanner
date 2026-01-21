'use client';

import { useAppState } from '@/hooks/useAppState';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toggle } from '@/components/Toggle';
import { Button } from '@/components/Button';
import { SelectorCard } from '@/components/SelectorCard';
import { GuidanceCard, GuidanceRow, MeteringTip } from '@/components/GuidanceCard';
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
  MinimalIcon,
  GraphicIcon,
  ExpressiveIcon,
  DocumentaryIcon,
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

  return (
    <main className="min-h-[100dvh] flex justify-center">
      <div className="w-full max-w-[440px] px-6 py-6 flex flex-col">
        {/* Persistent Header */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-medium tracking-wider uppercase">Roll Planner</h1>
          <ThemeToggle />
        </header>

        {/* Conditions Screen */}
        {screen === 'conditions' && (
          <div className="flex flex-col flex-1">
            {/* Film Toggles */}
            <div className="flex justify-center gap-6 mb-6">
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
            <section className="mb-6">
              <h2 className="text-xs font-medium tracking-wider uppercase text-[var(--text-tertiary)] mb-3">
                Light
              </h2>
              <div className="grid grid-cols-3 gap-3">
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
            </section>

            {/* Environment Selector */}
            <section className="mb-6">
              <h2 className="text-xs font-medium tracking-wider uppercase text-[var(--text-tertiary)] mb-3">
                Environment
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'portrait', label: 'Portrait', icon: PortraitIcon },
                  { value: 'street', label: 'Street', icon: StreetIcon },
                  { value: 'architecture', label: 'Architecture', icon: ArchitectureIcon },
                  { value: 'interiors', label: 'Interiors', icon: InteriorsIcon },
                  { value: 'landscape', label: 'Landscape', icon: LandscapeIcon }
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
            </section>

            {/* Intent Selector */}
            <section className="mb-6">
              <h2 className="text-xs font-medium tracking-wider uppercase text-[var(--text-tertiary)] mb-3">
                Intent
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {([
                  { value: 'calm', label: 'Minimal', icon: MinimalIcon },
                  { value: 'graphic', label: 'Graphic', icon: GraphicIcon },
                  { value: 'emotional', label: 'Expressive', icon: ExpressiveIcon },
                  { value: 'documentary', label: 'Documentary', icon: DocumentaryIcon }
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
            </section>

            {/* Spacer */}
            <div className="flex-1 min-h-6" />

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
          <div className="flex flex-col flex-1">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goBack}
                className="text-xs font-medium tracking-wider uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                ← Back
              </button>
              <h2 className="text-xs font-medium tracking-wider uppercase text-[var(--text-tertiary)]">
                Your Roll
              </h2>
            </div>

            {/* Film Card */}
            <div className="bg-[#4a4a4e] rounded-[var(--radius-lg)] p-6 mb-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.15),0_1px_0_var(--bevel-light)]">
              <div className="text-lg font-medium tracking-wider uppercase text-white mb-2">
                {state.recommendation.film}
              </div>
              <div className="text-sm font-medium tracking-wider uppercase text-[var(--led-on)] mb-5">
                Rate at EI {state.recommendation.ei}
              </div>

              <div className="h-px bg-white/15 my-5" />

              <div className="mb-4">
                <div className="text-xs font-medium tracking-wider uppercase text-[#a8a8ac] mb-2">
                  Exposure approach
                </div>
                <div className="text-sm font-medium tracking-wide uppercase text-[#f0f0f2] leading-relaxed">
                  {state.recommendation.exposure}
                </div>
              </div>

              <div className="text-xs font-medium tracking-wider uppercase text-[#a8a8ac] text-center pt-5 mt-5 border-t border-white/10">
                {DISCIPLINES[state.intent]}
              </div>
            </div>

            {/* Exposure Settings */}
            {(() => {
              const exposure = getExposureGuidance(state.light, state.recommendation.ei, state.environment);
              return (
                <GuidanceCard
                  icon={<ExposureIcon className="w-full h-full" />}
                  title="Exposure Settings"
                  note={exposure.note}
                >
                  <GuidanceRow label="Aperture" value={exposure.aperture} />
                  <GuidanceRow label="Shutter" value={exposure.shutter} />
                  <GuidanceRow label="EI" value={state.recommendation.ei.toString()} />
                </GuidanceCard>
              );
            })()}

            {/* Metering Tips */}
            {(() => {
              const metering = getMeteringTips(state.light, state.environment, state.intent);
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
            <div className="flex-1 min-h-6" />

            {/* Lock Button */}
            <Button onClick={lockRoll}>
              Lock this roll
            </Button>
          </div>
        )}

        {/* Locked Screen */}
        {screen === 'locked' && state.recommendation && state.locked && state.intent && (
          <div className="flex flex-col flex-1">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-medium tracking-wider uppercase text-[var(--text-tertiary)]">
                Roll {formatRollNumber(state.rollNumber || 1)}
              </span>
              <span className="text-xs font-medium tracking-wider uppercase text-[var(--text-tertiary)]">
                {state.lockedAt ? formatDate(new Date(state.lockedAt)) : ''}
              </span>
            </div>

            {/* Hero */}
            <div className="text-center mb-8">
              <div className="text-xl font-medium tracking-wider uppercase mb-2">
                {state.recommendation.film}
              </div>
              <div className="text-sm font-medium tracking-wider uppercase text-[var(--led-on)]">
                EI {state.recommendation.ei}
              </div>
            </div>

            {/* Guidance */}
            <div className="bg-[var(--bg-inset)] rounded-[var(--radius-md)] p-4 mb-6 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06),0_1px_0_var(--bevel-light)]">
              <div className="text-xs font-medium tracking-wide uppercase text-[var(--text-secondary)] leading-relaxed">
                {state.recommendation.exposure}
              </div>
            </div>

            {/* Discipline */}
            <div className="text-xs font-medium tracking-wider uppercase text-[var(--text-tertiary)] text-center italic">
              &quot;{DISCIPLINES[state.intent]}&quot;
            </div>

            {/* Spacer */}
            <div className="flex-1 min-h-6" />

            {/* Start Over Button */}
            <Button variant="secondary" onClick={startOver}>
              New roll
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
