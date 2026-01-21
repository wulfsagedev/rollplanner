'use client';

interface ToggleProps {
  leftLabel: string;
  rightLabel: string;
  value: 'left' | 'right';
  onChange: (value: 'left' | 'right') => void;
}

export function Toggle({ leftLabel, rightLabel, value, onChange }: ToggleProps) {
  const handleClick = () => {
    onChange(value === 'left' ? 'right' : 'left');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="toggle-switch">
      <span
        className={`toggle-label ${value === 'left' ? 'active' : ''}`}
        onClick={() => value !== 'left' && onChange('left')}
      >
        {leftLabel}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={value === 'right'}
        className="toggle-track"
        data-state={value}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <span className="toggle-knob" />
      </button>

      <span
        className={`toggle-label ${value === 'right' ? 'active' : ''}`}
        onClick={() => value !== 'right' && onChange('right')}
      >
        {rightLabel}
      </span>
    </div>
  );
}
