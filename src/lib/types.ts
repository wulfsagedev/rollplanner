// ============================================
// ROLL PLANNER TYPE DEFINITIONS
// ============================================

export type LightCondition = 'harsh' | 'bright' | 'mixed' | 'flat' | 'dim' | 'dark';
export type Environment = 'portrait' | 'street' | 'architecture' | 'interiors' | 'landscape' | 'nature';
export type Intent = 'calm' | 'graphic' | 'emotional' | 'travel' | 'narrative' | 'abstract';
export type FilmType = 'color' | 'bw';
export type FilmFormat = '35mm' | '120';

export type FilmCategory = 'color_negative' | 'bw_negative';
export type ColorBias =
  | 'neutral_warm'
  | 'warm'
  | 'cool'
  | 'neutral'
  | 'neutral_cool'
  | 'very_warm'
  | 'green_shift';

export type PricePoint = 'budget' | 'consumer' | 'professional' | 'premium';

export interface FilmStock {
  name: string;
  brand: string;
  type: FilmCategory;
  iso: number;
  formats: FilmFormat[];

  // Technical characteristics (0-10 scale)
  grain: number;
  saturation: number;
  contrast: number;
  latitude: number;
  sharpness: number;

  // Color science
  colorBias: ColorBias;
  skinTones: number;

  // Best conditions
  idealLight: string[];
  idealEnvironment: Environment[];

  // Push/pull capability
  pushStops: number;
  pullStops: number;

  // Reciprocity failure starts (seconds)
  reciprocityStart: number;

  // Metadata
  communityScore: number;
  pricePoint: PricePoint;
}

export interface Recommendation {
  film: string;
  ei: number;
  exposure: string;
  adjustments: string[];
}

export interface ExposureGuidance {
  aperture: string;
  shutter: string;
  note: string;
}

export interface MeteringTips {
  primary: string;
  secondary: string;
}

export interface WeatherData {
  conditions: string;
  description: string;
  cloudCover: number;
  visibility: number; // in km
  sunPosition: 'golden' | 'high' | 'low' | 'twilight' | 'night';
  lightQuality: string;
  shootingNote: string;
  locationName: string;
  updatedAt: number;
}

export interface AppState {
  // User selections
  light: LightCondition | null;
  environment: Environment | null;
  intent: Intent | null;
  filmType: FilmType;
  filmFormat: FilmFormat;

  // External data
  location: GeolocationCoordinates | null;
  weather: WeatherData | null;

  // Recommendation
  recommendation: Recommendation | null;

  // Roll tracking
  active: boolean;
  rollNumber: number | null;
  loadedAt: string | null;

  // Frame tracking (Phase 2)
  currentFrame: number;
  totalFrames: RollFrameCount;
  frameLog: FrameLog[];
}

export interface SelectorOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

// ============================================
// SHOT LOGGING TYPES
// ============================================

export interface FrameLog {
  frameNumber: number;
  aperture: string | null;
  shutter: string | null;
  notes: string | null;
  timestamp: string; // ISO string
}

export type RollFrameCount = 12 | 16 | 24 | 36;
