import { AppState, FrameLog } from './types';

export interface ExportData {
  roll: {
    number: number;
    film: string;
    iso: number;
    format: string;
    type: string;
    loadedAt: string;
    exportedAt: string;
    totalFrames: number;
    framesLogged: number;
  };
  conditions: {
    light: string | null;
    environment: string | null;
    intent: string | null;
  };
  frames: FrameLog[];
}

function buildExportData(state: AppState): ExportData {
  return {
    roll: {
      number: state.rollNumber || 0,
      film: state.recommendation?.film || 'Unknown',
      iso: state.recommendation?.ei || 0,
      format: state.filmFormat,
      type: state.filmType === 'color' ? 'Colour' : 'B&W',
      loadedAt: state.loadedAt || '',
      exportedAt: new Date().toISOString(),
      totalFrames: state.totalFrames,
      framesLogged: state.frameLog.length
    },
    conditions: {
      light: state.light,
      environment: state.environment,
      intent: state.intent
    },
    frames: state.frameLog
  };
}

export function exportAsJSON(state: AppState): string {
  const data = buildExportData(state);
  return JSON.stringify(data, null, 2);
}

export function exportAsCSV(state: AppState): string {
  const data = buildExportData(state);
  const lines: string[] = [];

  // Header info as comments
  lines.push(`# Roll ${data.roll.number} - ${data.roll.film}`);
  lines.push(`# ISO ${data.roll.iso} | ${data.roll.format} ${data.roll.type}`);
  lines.push(`# Loaded: ${data.roll.loadedAt ? new Date(data.roll.loadedAt).toLocaleDateString() : 'N/A'}`);
  lines.push(`# Frames: ${data.roll.framesLogged} of ${data.roll.totalFrames} logged`);
  lines.push('');

  // CSV header
  lines.push('Frame,Aperture,Shutter,Notes,Timestamp');

  // Frame data
  for (const frame of data.frames) {
    const row = [
      frame.frameNumber,
      frame.aperture || '',
      frame.shutter || '',
      `"${(frame.notes || '').replace(/"/g, '""')}"`,
      frame.timestamp
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateFilename(state: AppState, extension: string): string {
  const rollNum = state.rollNumber || 0;
  const filmName = (state.recommendation?.film || 'roll').replace(/\s+/g, '-').toLowerCase();
  const date = state.loadedAt ? new Date(state.loadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  return `roll-${rollNum}-${filmName}-${date}.${extension}`;
}

// Share API support check
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

export async function shareExport(state: AppState): Promise<void> {
  if (!canShare()) {
    throw new Error('Share API not supported');
  }

  const csvContent = exportAsCSV(state);
  const filename = generateFilename(state, 'csv');
  const file = new File([csvContent], filename, { type: 'text/csv' });

  await navigator.share({
    title: `Roll ${state.rollNumber} - ${state.recommendation?.film}`,
    files: [file]
  });
}
