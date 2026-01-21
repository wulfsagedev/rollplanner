'use client';

import { ReactNode } from 'react';

interface GuidanceCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  note?: string;
}

export function GuidanceCard({ icon, title, children, note }: GuidanceCardProps) {
  return (
    <div className="guidance-card">
      {/* Header */}
      <div className="guidance-header">
        <span className="guidance-icon">
          {icon}
        </span>
        <span className="guidance-title">
          {title}
        </span>
      </div>

      {/* Content */}
      <div className="guidance-content">
        {children}
      </div>

      {/* Note */}
      {note && (
        <div className="guidance-note">
          {note}
        </div>
      )}
    </div>
  );
}

interface GuidanceRowProps {
  label: string;
  value: string;
}

export function GuidanceRow({ label, value }: GuidanceRowProps) {
  return (
    <div className="guidance-row">
      <span className="guidance-label">{label}</span>
      <span className="guidance-value">{value}</span>
    </div>
  );
}

interface MeteringTipProps {
  children: ReactNode;
  secondary?: boolean;
}

export function MeteringTip({ children, secondary = false }: MeteringTipProps) {
  return (
    <div className={`metering-tip ${secondary ? 'secondary' : ''}`}>
      {children}
    </div>
  );
}
