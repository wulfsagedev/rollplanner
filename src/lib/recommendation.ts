import { FILM_DATABASE } from './films';
import {
  LightCondition,
  Environment,
  Intent,
  FilmType,
  FilmFormat,
  FilmStock,
  Recommendation,
  ExposureGuidance,
  MeteringTips
} from './types';

// ============================================
// RECOMMENDATION ALGORITHM
// Science-based film selection
// ============================================

interface ScoredFilm {
  key: string;
  film: FilmStock;
  score: number;
}

// Light condition to ISO mapping
const LIGHT_ISO_NEEDS: Record<LightCondition, { min: number; ideal: number; max: number }> = {
  harsh: { min: 50, ideal: 100, max: 400 },
  bright: { min: 100, ideal: 200, max: 400 },
  mixed: { min: 200, ideal: 400, max: 800 },
  flat: { min: 200, ideal: 400, max: 800 },
  dim: { min: 400, ideal: 800, max: 3200 },
  dark: { min: 800, ideal: 1600, max: 3200 }
};

// Environment preferences
const ENVIRONMENT_PREFERENCES: Record<Environment, {
  grain: 'low' | 'medium' | 'high' | 'any';
  contrast: 'low' | 'medium' | 'high' | 'any';
  skinTones: boolean;
}> = {
  portrait: { grain: 'low', contrast: 'medium', skinTones: true },
  street: { grain: 'any', contrast: 'high', skinTones: false },
  architecture: { grain: 'low', contrast: 'medium', skinTones: false },
  interiors: { grain: 'medium', contrast: 'low', skinTones: false },
  landscape: { grain: 'low', contrast: 'medium', skinTones: false }
};

// Intent modifiers
const INTENT_MODIFIERS: Record<Intent, {
  saturationBonus: number;
  contrastBonus: number;
  grainTolerance: number;
}> = {
  calm: { saturationBonus: -1, contrastBonus: -1, grainTolerance: 0 },
  graphic: { saturationBonus: 1, contrastBonus: 2, grainTolerance: 0 },
  emotional: { saturationBonus: 0, contrastBonus: 0, grainTolerance: 2 },
  documentary: { saturationBonus: 0, contrastBonus: 0, grainTolerance: 1 }
};

// Exposure guidance sentences
const EXPOSURE_GUIDANCE: Record<string, Record<LightCondition, string>> = {
  color: {
    harsh: 'Expose for shadows. Film latitude will hold highlights.',
    bright: 'Meter for midtones. Slight overexposure is safe.',
    mixed: 'Bracket if unsure. Expose for the most important tones.',
    flat: 'Trust your meter. Overcast light is forgiving.',
    dim: 'Open up and embrace the grain. Shadows can go.',
    dark: 'Push if needed. Rate at box speed minimum.'
  },
  bw: {
    harsh: 'Expose for shadows, develop for highlights.',
    bright: 'Zone system: place shadows on Zone III.',
    mixed: 'Meter for skin or main subject.',
    flat: 'Even light needs even exposure. Trust your reading.',
    dim: 'Shoot wide open. Push process if under EI 800.',
    dark: 'Rate at EI 1600+. Push 2 stops in development.'
  }
};

export function getRecommendation(
  light: LightCondition,
  environment: Environment,
  intent: Intent,
  weather: string | null,
  filmType: FilmType,
  filmFormat: FilmFormat
): Recommendation {
  // Filter films by type and format
  const targetType = filmType === 'color' ? 'color_negative' : 'bw_negative';
  const eligibleFilms = Object.entries(FILM_DATABASE).filter(([, film]) =>
    film.type === targetType && film.formats.includes(filmFormat)
  );

  if (eligibleFilms.length === 0) {
    return {
      film: 'No film available',
      ei: 400,
      exposure: 'Check your settings',
      adjustments: []
    };
  }

  // Score each film
  const scoredFilms: ScoredFilm[] = eligibleFilms.map(([key, film]) => {
    let score = film.communityScore * 10; // Base score from community rating

    // ISO appropriateness for light
    const isoNeeds = LIGHT_ISO_NEEDS[light];
    if (film.iso >= isoNeeds.min && film.iso <= isoNeeds.max) {
      score += 20;
      if (film.iso === isoNeeds.ideal) {
        score += 10;
      }
    } else if (film.iso < isoNeeds.min) {
      // Too slow - can we push?
      const stopsNeeded = Math.log2(isoNeeds.min / film.iso);
      if (film.pushStops >= stopsNeeded) {
        score += 10;
      } else {
        score -= 20;
      }
    } else {
      // Too fast for the light
      score -= 10;
    }

    // Environment match
    const envPrefs = ENVIRONMENT_PREFERENCES[environment];
    if (film.idealEnvironment.includes(environment)) {
      score += 15;
    }

    // Grain preference
    if (envPrefs.grain === 'low' && film.grain <= 3) score += 10;
    if (envPrefs.grain === 'medium' && film.grain >= 3 && film.grain <= 6) score += 5;
    if (envPrefs.grain === 'high' && film.grain >= 6) score += 5;

    // Contrast preference
    if (envPrefs.contrast === 'low' && film.contrast <= 5) score += 5;
    if (envPrefs.contrast === 'medium' && film.contrast >= 4 && film.contrast <= 6) score += 5;
    if (envPrefs.contrast === 'high' && film.contrast >= 6) score += 10;

    // Skin tones (for portraits)
    if (envPrefs.skinTones && film.skinTones >= 8) {
      score += 15;
    }

    // Intent modifiers
    const intentMods = INTENT_MODIFIERS[intent];
    score += film.saturation * intentMods.saturationBonus;
    score += film.contrast * intentMods.contrastBonus;
    score += intentMods.grainTolerance * 3; // More tolerance = slightly boost grainy films

    // Latitude bonus (more forgiving films score higher)
    score += film.latitude * 2;

    // Weather adjustments
    if (weather) {
      const weatherLower = weather.toLowerCase();
      if (weatherLower.includes('cloud') || weatherLower.includes('overcast')) {
        // Prefer films with good latitude in flat light
        if (film.latitude >= 7) score += 5;
      }
      if (weatherLower.includes('sun') || weatherLower.includes('clear')) {
        // Prefer films that handle contrast well
        if (film.contrast >= 5) score += 5;
      }
    }

    return { key, film, score };
  });

  // Sort by score and get the best
  scoredFilms.sort((a, b) => b.score - a.score);
  const winner = scoredFilms[0];

  // Determine EI (exposure index)
  let ei = winner.film.iso;
  const isoNeeds = LIGHT_ISO_NEEDS[light];

  // Adjust EI if needed for the light
  if (winner.film.iso < isoNeeds.min && winner.film.pushStops > 0) {
    // Need to push
    const stopsNeeded = Math.ceil(Math.log2(isoNeeds.ideal / winner.film.iso));
    const actualPush = Math.min(stopsNeeded, winner.film.pushStops);
    ei = winner.film.iso * Math.pow(2, actualPush);
  }

  // Get exposure guidance
  const exposureType = filmType === 'color' ? 'color' : 'bw';
  const exposure = EXPOSURE_GUIDANCE[exposureType][light];

  // Build adjustments list
  const adjustments: string[] = [];
  if (ei !== winner.film.iso) {
    adjustments.push(`Push ${Math.log2(ei / winner.film.iso)} stop(s) in development`);
  }
  if (light === 'dim' || light === 'dark') {
    adjustments.push('Consider a tripod for sharpness');
  }

  return {
    film: winner.film.name,
    ei,
    exposure,
    adjustments
  };
}

// ============================================
// EXPOSURE GUIDANCE
// Sunny 16 variations with standard camera increments
// ============================================

// Standard shutter speeds found on most film cameras
const STANDARD_SHUTTERS = [1, 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000, 2000, 4000];

// Standard apertures (full stops)
const STANDARD_APERTURES = ['f/1.4', 'f/2', 'f/2.8', 'f/4', 'f/5.6', 'f/8', 'f/11', 'f/16', 'f/22'];

// Find nearest standard shutter speed
function nearestShutter(target: number): string {
  const nearest = STANDARD_SHUTTERS.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
  return `1/${nearest}`;
}

export function getExposureGuidance(
  light: LightCondition,
  iso: number,
  environment: Environment
): ExposureGuidance {
  // Use standard shutter speeds based on ISO and Sunny 16 rule
  // Sunny 16: f/16, 1/ISO for bright sun
  const exposureSettings: Record<LightCondition, { aperture: string; shutter: string; note: string }> = {
    harsh: { aperture: 'f/16', shutter: nearestShutter(iso), note: 'Bright sun. Watch for harsh shadows.' },
    bright: { aperture: 'f/11', shutter: nearestShutter(iso), note: 'Open shade or slight overcast.' },
    mixed: { aperture: 'f/8', shutter: nearestShutter(iso), note: 'Variable light. Bracket if unsure.' },
    flat: { aperture: 'f/5.6', shutter: nearestShutter(iso), note: 'Overcast sky. Even, soft light.' },
    dim: { aperture: 'f/4', shutter: nearestShutter(iso / 4), note: 'Low light. Consider a tripod.' },
    dark: { aperture: 'f/2.8', shutter: nearestShutter(iso / 8), note: 'Very low light. Steady hands or support.' }
  };

  const settings = { ...exposureSettings[light] };

  // Environment adjustments
  if (environment === 'interiors') {
    settings.note = 'Interior light. Meter for highlights you want to keep.';
    if (light === 'bright' || light === 'harsh') {
      settings.aperture = 'f/5.6';
      settings.shutter = nearestShutter(iso / 4);
    }
  } else if (environment === 'portrait') {
    settings.note = 'Open up for shallow depth. Meter for skin.';
  } else if (environment === 'landscape') {
    settings.note = 'Stop down for depth. Meter for midtones.';
  }

  return settings;
}

// ============================================
// METERING TIPS
// ============================================

export function getMeteringTips(
  light: LightCondition,
  environment: Environment,
  intent: Intent
): MeteringTips {
  const tips: MeteringTips = {
    primary: '',
    secondary: ''
  };

  // Primary tip based on environment
  const envTips: Record<Environment, string> = {
    portrait: "Meter off the subject's face or use incident metering.",
    street: 'Pre-meter for the light you expect. Zone V for pavement.',
    architecture: 'Meter a grey card or neutral surface in the same light.',
    interiors: 'Meter the brightest area you want detail in, then open 2 stops.',
    landscape: 'Meter the sky 1 stop above the ground reading.'
  };
  tips.primary = envTips[environment];

  // Secondary tip based on light + intent
  if (light === 'harsh' || light === 'bright') {
    if (intent === 'emotional') {
      tips.secondary = 'Let shadows go deep for mood. Expose for highlights.';
    } else {
      tips.secondary = 'Watch contrast. Expose for shadows on negative film.';
    }
  } else if (light === 'flat') {
    tips.secondary = 'Even light is forgiving. Trust your meter reading.';
  } else if (light === 'dim' || light === 'dark') {
    if (intent === 'documentary') {
      tips.secondary = 'Push processing can recover 1-2 stops if needed.';
    } else {
      tips.secondary = 'Bracket exposures. Err on the side of overexposure.';
    }
  } else if (light === 'mixed') {
    tips.secondary = 'Take multiple readings. Expose for your subject.';
  }

  return tips;
}

// ============================================
// DISCIPLINE QUOTES
// ============================================

export const DISCIPLINES: Record<Intent, string> = {
  calm: 'Slow down. Wait for stillness.',
  graphic: 'Find the geometry. Commit to the frame.',
  emotional: 'Follow the feeling, not the subject.',
  documentary: "Stay present. Don't chase moments."
};
