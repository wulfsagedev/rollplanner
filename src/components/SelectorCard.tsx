'use client';

import { ReactNode } from 'react';

interface SelectorCardProps {
  icon: ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function SelectorCard({ icon, label, selected, onClick }: SelectorCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`selector-option ${selected ? 'selected' : ''}`}
    >
      <span className="option-icon">
        {icon}
      </span>
      {label}
    </button>
  );
}
