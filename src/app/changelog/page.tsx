'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

const CHANGELOG = [
  {
    version: '1.2',
    date: 'January 2026',
    changes: [
      'Track your shots with per-frame logging (aperture, shutter, notes)',
      'Visual frame counter with LED progress strip',
      'Export your shot log as CSV or JSON',
      'Manual location entry when GPS is unavailable',
      '"I have this film" mode for guidance on film you already own',
      'Improved navigation with back buttons on all screens',
    ],
  },
  {
    version: '1.0',
    date: 'January 2026',
    changes: [
      'Weather-aware film recommendations based on your conditions',
      'Plan shoots up to 8 days ahead with forecast integration',
      'Dynamic themes that match time of day (sunrise to night)',
      'Exposure guidance based on Sunny 16 rule',
      'Context-aware metering tips for different environments',
      'Support for 28 film stocks across major brands',
      'Dark and light mode with system preference detection',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="app-container">
      {/* Header */}
      <header className="persistent-header">
        <div className="app-brand">
          <h1 className="app-title">Roll Planner</h1>
        </div>
        <div className="header-right">
          <ThemeToggle />
        </div>
      </header>

      <div className="screen">
        {/* Header Row */}
        <div className="screen-header-row">
          <Link href="/" className="back-link">
            ← Back
          </Link>
          <h2 className="screen-title">What&apos;s New</h2>
        </div>

        {/* Changelog List */}
        <div className="changelog-list">
          {CHANGELOG.map((release) => (
            <div key={release.version} className="changelog-release">
              <div className="changelog-header">
                <span className="changelog-version">v{release.version}</span>
                <span className="changelog-date">{release.date}</span>
              </div>
              <ul className="changelog-changes">
                {release.changes.map((change, i) => (
                  <li key={i} className="changelog-item">{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <span className="footer-link">v1.2</span>
        <span>·</span>
        <a href="https://owenfisher.co/" target="_blank" rel="noopener noreferrer" className="footer-link">Made by Owen</a>
      </footer>
    </main>
  );
}
