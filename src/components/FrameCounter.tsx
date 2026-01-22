'use client';

import { RollFrameCount } from '@/lib/types';

interface FrameCounterProps {
  currentFrame: number;
  totalFrames: RollFrameCount;
  hasLog: boolean;
  onAdvance: () => void;
  onPrevious: () => void;
  onTotalFramesChange: (total: RollFrameCount) => void;
  onLogFrame: () => void;
  format: '35mm' | '120';
}

export function FrameCounter({
  currentFrame,
  totalFrames,
  hasLog,
  onAdvance,
  onPrevious,
  onTotalFramesChange,
  onLogFrame,
  format
}: FrameCounterProps) {
  const frameOptions: RollFrameCount[] = format === '35mm' ? [24, 36] : [12, 16];

  return (
    <div className="frame-counter">
      {/* Header row */}
      <div className="frame-counter-header">
        <span className="frame-counter-label">Frame</span>
        <div className="frame-counter-format">
          {frameOptions.map((count) => (
            <button
              key={count}
              className={`frame-count-chip ${totalFrames === count ? 'active' : ''}`}
              onClick={() => onTotalFramesChange(count)}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* LED Progress Strip - one dot per frame */}
      <div className="frame-counter-leds">
        {Array.from({ length: totalFrames }, (_, i) => {
          const frameNum = i + 1;
          const isLit = currentFrame >= frameNum;
          return (
            <span
              key={i}
              className={`frame-led ${isLit ? 'lit' : ''}`}
            />
          );
        })}
      </div>

      {/* Main display area */}
      <div className="frame-counter-main">
        <button
          className="frame-counter-nav"
          onClick={onPrevious}
          disabled={currentFrame <= 1}
          aria-label="Previous frame"
        >
          −
        </button>

        <button className="frame-counter-display" onClick={onLogFrame}>
          <span className="frame-counter-number">{currentFrame}</span>
          {hasLog && <span className="frame-counter-dot" />}
        </button>

        <button
          className="frame-counter-nav"
          onClick={onAdvance}
          disabled={currentFrame >= totalFrames}
          aria-label="Next frame"
        >
          +
        </button>
      </div>

      {/* Log button */}
      <button className="frame-counter-action" onClick={onLogFrame}>
        {hasLog ? 'Edit Log' : 'Log Frame'}
      </button>
    </div>
  );
}
