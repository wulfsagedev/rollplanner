'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { FrameLog } from '@/lib/types';

// Common aperture and shutter values for quick selection
const APERTURES = ['f/1.4', 'f/2', 'f/2.8', 'f/4', 'f/5.6', 'f/8', 'f/11', 'f/16', 'f/22'];
const SHUTTERS = ['1/1000', '1/500', '1/250', '1/125', '1/60', '1/30', '1/15', '1/8', '1/4', '1/2', '1"', '2"'];

interface FrameLogDrawerProps {
  frameNumber: number;
  existingLog: FrameLog | undefined;
  onSave: (data: { aperture: string | null; shutter: string | null; notes: string | null }) => void;
  onClose: () => void;
}

export function FrameLogModal({ frameNumber, existingLog, onSave, onClose }: FrameLogDrawerProps) {
  const [aperture, setAperture] = useState(existingLog?.aperture || '');
  const [shutter, setShutter] = useState(existingLog?.shutter || '');
  const [notes, setNotes] = useState(existingLog?.notes || '');
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Reset state when frame number changes
  useEffect(() => {
    setAperture(existingLog?.aperture || '');
    setShutter(existingLog?.shutter || '');
    setNotes(existingLog?.notes || '');
  }, [frameNumber, existingLog]);

  const handleSave = () => {
    onSave({
      aperture: aperture || null,
      shutter: shutter || null,
      notes: notes || null
    });
  };

  const hasData = aperture || shutter || notes;

  return (
    <div className="frame-log-drawer">
      {/* Header */}
      <div className="frame-log-drawer-header">
        <span className="frame-log-drawer-title">Frame {frameNumber}</span>
        <button onClick={onClose} className="frame-log-drawer-close" aria-label="Close">
          <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Aperture */}
      <div className="frame-log-drawer-section">
        <div className="frame-log-drawer-label">Aperture</div>
        <div className="frame-log-drawer-chips">
          {APERTURES.map(f => (
            <button
              key={f}
              className={`frame-log-drawer-chip ${aperture === f ? 'active' : ''}`}
              onClick={() => setAperture(aperture === f ? '' : f)}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="frame-log-drawer-input"
          placeholder="Custom..."
          value={aperture}
          onChange={e => setAperture(e.target.value)}
        />
      </div>

      {/* Shutter */}
      <div className="frame-log-drawer-section">
        <div className="frame-log-drawer-label">Shutter</div>
        <div className="frame-log-drawer-chips shutter-chips">
          {SHUTTERS.map(s => (
            <button
              key={s}
              className={`frame-log-drawer-chip ${shutter === s ? 'active' : ''}`}
              onClick={() => setShutter(shutter === s ? '' : s)}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="frame-log-drawer-input"
          placeholder="Custom..."
          value={shutter}
          onChange={e => setShutter(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="frame-log-drawer-section">
        <div className="frame-log-drawer-label">Notes</div>
        <textarea
          ref={notesRef}
          className="frame-log-drawer-textarea"
          placeholder="What are you capturing? Why this moment?"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="frame-log-drawer-actions">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {hasData ? 'Save' : 'Skip'}
        </Button>
      </div>
    </div>
  );
}
