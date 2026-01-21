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
  MeteringTips,
  WeatherData
} from './types';

// ============================================
// RECOMMENDATION ALGORITHM v2.0
// Optimized science-based film selection
// ============================================

interface ScoredFilm {
  key: string;
  film: FilmStock;
  score: number;
  reasons: string[];
}

// Light condition to ISO mapping with more nuance
const LIGHT_ISO_NEEDS: Record<LightCondition, { min: number; ideal: number; max: number; evRange: string }> = {
  harsh: { min: 50, ideal: 100, max: 200, evRange: 'EV 14-16' },
  bright: { min: 100, ideal: 200, max: 400, evRange: 'EV 12-14' },
  mixed: { min: 200, ideal: 400, max: 800, evRange: 'EV 10-13' },
  flat: { min: 200, ideal: 400, max: 800, evRange: 'EV 10-12' },
  dim: { min: 400, ideal: 800, max: 1600, evRange: 'EV 6-10' },
  dark: { min: 800, ideal: 1600, max: 3200, evRange: 'EV 2-6' }
};

// Environment preferences with expanded characteristics
const ENVIRONMENT_PREFERENCES: Record<Environment, {
  grain: 'low' | 'medium' | 'high' | 'any';
  contrast: 'low' | 'medium' | 'high' | 'any';
  skinTones: boolean;
  sharpnessWeight: number;
  latitudeWeight: number;
  preferredColorBias: string[];
}> = {
  portrait: {
    grain: 'low',
    contrast: 'medium',
    skinTones: true,
    sharpnessWeight: 1.5,
    latitudeWeight: 2,
    preferredColorBias: ['neutral_warm', 'warm']
  },
  street: {
    grain: 'any',
    contrast: 'high',
    skinTones: false,
    sharpnessWeight: 1,
    latitudeWeight: 2,
    preferredColorBias: ['neutral', 'neutral_warm', 'warm']
  },
  architecture: {
    grain: 'low',
    contrast: 'medium',
    skinTones: false,
    sharpnessWeight: 2,
    latitudeWeight: 1,
    preferredColorBias: ['neutral', 'neutral_cool', 'cool']
  },
  interiors: {
    grain: 'medium',
    contrast: 'low',
    skinTones: false,
    sharpnessWeight: 1,
    latitudeWeight: 2.5,
    preferredColorBias: ['neutral_warm', 'warm']
  },
  landscape: {
    grain: 'low',
    contrast: 'medium',
    skinTones: false,
    sharpnessWeight: 2,
    latitudeWeight: 1.5,
    preferredColorBias: ['neutral', 'warm', 'neutral_warm']
  },
  nature: {
    grain: 'low',
    contrast: 'medium',
    skinTones: false,
    sharpnessWeight: 2.5,
    latitudeWeight: 1,
    preferredColorBias: ['neutral', 'neutral_warm', 'warm']
  }
};

// Intent modifiers with expanded characteristics
const INTENT_MODIFIERS: Record<Intent, {
  saturationBonus: number;
  contrastBonus: number;
  grainTolerance: number;
  latitudeBonus: number;
  description: string;
}> = {
  calm: {
    saturationBonus: -1,
    contrastBonus: -1,
    grainTolerance: 0,
    latitudeBonus: 1,
    description: 'soft, muted tones'
  },
  graphic: {
    saturationBonus: 1,
    contrastBonus: 2,
    grainTolerance: 0,
    latitudeBonus: 0,
    description: 'bold contrast and shape'
  },
  emotional: {
    saturationBonus: 0,
    contrastBonus: 0,
    grainTolerance: 2,
    latitudeBonus: 1,
    description: 'texture and feeling'
  },
  documentary: {
    saturationBonus: 0,
    contrastBonus: 0,
    grainTolerance: 1,
    latitudeBonus: 2,
    description: 'honest, forgiving exposure'
  },
  narrative: {
    saturationBonus: 0,
    contrastBonus: 1,
    grainTolerance: 1,
    latitudeBonus: 1,
    description: 'cinematic storytelling'
  },
  abstract: {
    saturationBonus: 1,
    contrastBonus: 1,
    grainTolerance: 3,
    latitudeBonus: 0,
    description: 'experimental and bold'
  }
};

// Sun position effects on film choice
const SUN_POSITION_MODIFIERS: Record<string, {
  warmBias: number;
  contrastBonus: number;
  grainTolerance: number;
}> = {
  golden: { warmBias: 2, contrastBonus: -1, grainTolerance: 0 },
  high: { warmBias: 0, contrastBonus: 1, grainTolerance: 0 },
  low: { warmBias: 1, contrastBonus: 0, grainTolerance: 0 },
  twilight: { warmBias: 1, contrastBonus: -1, grainTolerance: 1 },
  night: { warmBias: 0, contrastBonus: 0, grainTolerance: 2 }
};

// Exposure guidance sentences optimized for all conditions
const EXPOSURE_GUIDANCE: Record<string, Record<LightCondition, string>> = {
  color: {
    harsh: 'Expose for shadows. Film latitude will hold highlights.',
    bright: 'Meter for midtones. Slight overexposure is safe.',
    mixed: 'Bracket if unsure. Expose for the most important tones.',
    flat: 'Trust your meter. Overcast light is forgiving.',
    dim: 'Open up and embrace the grain. Let shadows go.',
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

// Main recommendation function
export function getRecommendation(
  light: LightCondition,
  environment: Environment,
  intent: Intent,
  weather: WeatherData | null,
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

  const envPrefs = ENVIRONMENT_PREFERENCES[environment];
  const intentMods = INTENT_MODIFIERS[intent];
  const isoNeeds = LIGHT_ISO_NEEDS[light];

  // Get weather modifiers
  const sunMods = weather?.sunPosition
    ? SUN_POSITION_MODIFIERS[weather.sunPosition]
    : null;

  // Score each film
  const scoredFilms: ScoredFilm[] = eligibleFilms.map(([key, film]) => {
    let score = 0;
    const reasons: string[] = [];

    // ==========================================
    // 1. ISO APPROPRIATENESS (0-35 points)
    // ==========================================
    if (film.iso >= isoNeeds.min && film.iso <= isoNeeds.max) {
      score += 20;
      reasons.push('Good ISO range');

      // Bonus for ideal ISO
      if (film.iso >= isoNeeds.ideal * 0.5 && film.iso <= isoNeeds.ideal * 2) {
        score += 10;
        if (film.iso === isoNeeds.ideal) {
          score += 5;
          reasons.push('Perfect ISO match');
        }
      }
    } else if (film.iso < isoNeeds.min) {
      // Too slow - can we push?
      const stopsNeeded = Math.log2(isoNeeds.min / film.iso);
      if (film.pushStops >= stopsNeeded) {
        score += 15; // Good, but pushing has trade-offs
        reasons.push(`Pushable to ${film.iso * Math.pow(2, Math.ceil(stopsNeeded))}`);
      } else {
        score -= 25; // Can't reach needed speed
      }
    } else {
      // Too fast - can we pull?
      const stopsSurplus = Math.log2(film.iso / isoNeeds.max);
      if (film.pullStops >= stopsSurplus) {
        score += 10;
        reasons.push('Can pull for smoother tones');
      } else {
        score -= 15; // Will be overexposed
      }
    }

    // ==========================================
    // 2. ENVIRONMENT MATCH (0-30 points)
    // ==========================================

    // Direct environment match from film's ideal list
    if (film.idealEnvironment.includes(environment)) {
      score += 15;
      reasons.push(`Made for ${environment}`);
    }

    // Grain preference
    if (envPrefs.grain === 'low' && film.grain <= 3) {
      score += 8;
    } else if (envPrefs.grain === 'medium' && film.grain >= 3 && film.grain <= 6) {
      score += 5;
    } else if (envPrefs.grain === 'high' && film.grain >= 6) {
      score += 5;
    } else if (envPrefs.grain === 'any') {
      score += 3;
    }

    // Contrast preference
    if (envPrefs.contrast === 'low' && film.contrast <= 5) {
      score += 5;
    } else if (envPrefs.contrast === 'medium' && film.contrast >= 4 && film.contrast <= 6) {
      score += 5;
    } else if (envPrefs.contrast === 'high' && film.contrast >= 6) {
      score += 7;
    }

    // Skin tones (critical for portraits)
    if (envPrefs.skinTones && film.skinTones >= 8) {
      score += 12;
      reasons.push('Excellent skin tones');
    } else if (envPrefs.skinTones && film.skinTones >= 6) {
      score += 5;
    }

    // Sharpness weighted by environment
    score += (film.sharpness / 10) * envPrefs.sharpnessWeight * 3;

    // Latitude weighted by environment
    score += (film.latitude / 10) * envPrefs.latitudeWeight * 4;

    // Color bias match (for color films)
    if (filmType === 'color' && envPrefs.preferredColorBias.includes(film.colorBias)) {
      score += 5;
      reasons.push(`${film.colorBias} tones`);
    }

    // ==========================================
    // 3. INTENT MODIFIERS (0-25 points)
    // ==========================================

    // Saturation alignment
    if (intentMods.saturationBonus > 0 && film.saturation >= 6) {
      score += intentMods.saturationBonus * 5;
    } else if (intentMods.saturationBonus < 0 && film.saturation <= 5) {
      score += Math.abs(intentMods.saturationBonus) * 3;
    }

    // Contrast alignment
    if (intentMods.contrastBonus > 0 && film.contrast >= 6) {
      score += intentMods.contrastBonus * 4;
    } else if (intentMods.contrastBonus < 0 && film.contrast <= 5) {
      score += Math.abs(intentMods.contrastBonus) * 3;
    }

    // Grain tolerance allows higher-grain films
    if (intentMods.grainTolerance > 0) {
      score += intentMods.grainTolerance * 2;
      // Don't penalize grainy films as much
      if (film.grain >= 5) {
        score += intentMods.grainTolerance * 2;
      }
    }

    // Latitude bonus for forgiving intents
    score += film.latitude * intentMods.latitudeBonus;

    // ==========================================
    // 4. WEATHER/SUN POSITION (0-20 points)
    // ==========================================
    if (weather) {
      // Cloud cover effects
      if (weather.cloudCover > 70) {
        // Overcast - prefer high latitude, lower contrast
        if (film.latitude >= 7) {
          score += 8;
          reasons.push('Great for flat light');
        }
        if (film.contrast <= 6) score += 4;
      } else if (weather.cloudCover < 30) {
        // Clear skies - contrast matters
        if (film.contrast >= 5) {
          score += 6;
        }
        // Higher latitude helps with harsh sun
        if (film.latitude >= 7) {
          score += 5;
        }
      }

      // Visibility effects
      if (weather.visibility < 5) {
        // Hazy/foggy - lower contrast helps
        if (film.contrast <= 5) score += 4;
      } else if (weather.visibility > 20) {
        // Crystal clear - saturation shines
        if (film.saturation >= 6) score += 4;
      }

      // Sun position effects
      if (sunMods) {
        // Warm bias preference during golden hour
        if (sunMods.warmBias > 0 && filmType === 'color') {
          if (film.colorBias === 'warm' || film.colorBias === 'neutral_warm') {
            score += sunMods.warmBias * 3;
            reasons.push('Warm tones for golden light');
          }
        }

        // Contrast adjustment
        score += film.contrast * sunMods.contrastBonus * 0.5;

        // Grain tolerance for low light
        if (sunMods.grainTolerance > 0 && film.grain >= 4) {
          score += sunMods.grainTolerance * 2;
        }
      }

      // Light quality bonus - match film's ideal light to actual conditions
      const lightMap: Record<string, string[]> = {
        golden: ['golden'],
        high: ['harsh'],
        low: ['mixed', 'flat'],
        twilight: ['flat', 'mixed'],
        night: ['flat']
      };
      if (weather.sunPosition && lightMap[weather.sunPosition]) {
        const matchedLights = lightMap[weather.sunPosition];
        const matchCount = film.idealLight.filter(l => matchedLights.includes(l)).length;
        score += matchCount * 5;
      }
    }

    // ==========================================
    // 5. COMMUNITY SCORE & RELIABILITY (0-15 points)
    // ==========================================
    score += film.communityScore * 1.5;

    // ==========================================
    // 6. LIGHT CONDITION MATCH (0-10 points)
    // ==========================================
    // Map light conditions to the film's idealLight
    const lightToIdealMap: Record<LightCondition, string[]> = {
      harsh: ['harsh'],
      bright: ['harsh', 'golden'],
      mixed: ['mixed'],
      flat: ['flat'],
      dim: ['flat', 'mixed'],
      dark: ['flat']
    };
    const idealMatches = film.idealLight.filter(l => lightToIdealMap[light].includes(l));
    score += idealMatches.length * 5;

    // ==========================================
    // 7. RECIPROCITY CONSIDERATION (0-5 points)
    // ==========================================
    if (light === 'dim' || light === 'dark') {
      // Prefer films with good reciprocity for long exposures
      if (film.reciprocityStart >= 10) {
        score += 5;
        reasons.push('Good for long exposures');
      }
    }

    return { key, film, score, reasons };
  });

  // Sort by score and get the best
  scoredFilms.sort((a, b) => b.score - a.score);
  const winner = scoredFilms[0];

  // Determine optimal EI (exposure index)
  let ei = winner.film.iso;
  let pushStops = 0;
  let pullStops = 0;

  // Adjust EI based on conditions
  if (winner.film.iso < isoNeeds.min && winner.film.pushStops > 0) {
    // Need to push
    const stopsNeeded = Math.ceil(Math.log2(isoNeeds.ideal / winner.film.iso));
    pushStops = Math.min(stopsNeeded, winner.film.pushStops);
    ei = winner.film.iso * Math.pow(2, pushStops);
  } else if (winner.film.iso > isoNeeds.max && winner.film.pullStops > 0) {
    // Can pull for smoother results
    const stopsSurplus = Math.ceil(Math.log2(winner.film.iso / isoNeeds.ideal));
    pullStops = Math.min(stopsSurplus, winner.film.pullStops);
    ei = winner.film.iso / Math.pow(2, pullStops);
  }

  // Weather-based EI adjustments
  if (weather) {
    // Very low visibility might need more exposure
    if (weather.visibility < 3 && ei < isoNeeds.ideal) {
      const potentialPush = Math.min(1, winner.film.pushStops - pushStops);
      if (potentialPush > 0) {
        ei = ei * 2;
        pushStops += 1;
      }
    }
  }

  // Get exposure guidance
  const exposureType = filmType === 'color' ? 'color' : 'bw';
  let exposure = EXPOSURE_GUIDANCE[exposureType][light];

  // Enhance exposure guidance with weather context
  if (weather) {
    if (weather.sunPosition === 'golden') {
      exposure = filmType === 'color'
        ? 'Golden hour magic. Overexpose slightly for warm shadows.'
        : 'Open shadows with warm light. Develop normally.';
    } else if (weather.sunPosition === 'twilight') {
      exposure = 'Fading light. Meter for highlights, let shadows fall.';
    } else if (weather.cloudCover > 80) {
      exposure = 'Soft, even light. Trust your meter. Great latitude.';
    }
  }

  // Build adjustments list
  const adjustments: string[] = [];

  if (pushStops > 0) {
    adjustments.push(`Push ${pushStops} stop${pushStops > 1 ? 's' : ''} in development`);
  }
  if (pullStops > 0) {
    adjustments.push(`Pull ${pullStops} stop${pullStops > 1 ? 's' : ''} for smoother tones`);
  }
  if ((light === 'dim' || light === 'dark') && winner.film.reciprocityStart < 10) {
    adjustments.push('Compensate for reciprocity on long exposures');
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

const STANDARD_SHUTTERS = [1, 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000, 2000, 4000];

function nearestShutter(target: number): string {
  if (target <= 0) return '1/60';
  const nearest = STANDARD_SHUTTERS.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
  return `1/${nearest}`;
}

export function getExposureGuidance(
  light: LightCondition,
  iso: number,
  environment: Environment,
  weather?: WeatherData | null
): ExposureGuidance {
  // Base settings from Sunny 16 rule
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
    // Portraits often benefit from wider apertures
    if (light === 'bright' || light === 'harsh') {
      settings.aperture = 'f/4';
      settings.shutter = nearestShutter(iso * 4);
    }
  } else if (environment === 'landscape') {
    settings.note = 'Stop down for depth. Meter for midtones.';
  } else if (environment === 'nature') {
    settings.note = 'Close focus needs more light. Watch your depth.';
    // Macro work often needs smaller apertures
    if (light !== 'dim' && light !== 'dark') {
      settings.aperture = 'f/11';
    }
  } else if (environment === 'architecture') {
    settings.note = 'Straight lines need straight technique. Use a tripod.';
  }

  // Weather-based notes
  if (weather) {
    if (weather.sunPosition === 'golden') {
      settings.note = 'Golden hour. Light changes fast. Check exposure often.';
    } else if (weather.sunPosition === 'twilight') {
      settings.note = 'Twilight fades quickly. Bracket and shoot fast.';
    } else if (weather.cloudCover > 80) {
      settings.note = 'Even overcast light. Forgiving conditions.';
    } else if (weather.visibility < 5) {
      settings.note = 'Low visibility may affect contrast. Open up slightly.';
    }
  }

  return settings;
}

// ============================================
// METERING TIPS
// ============================================

export function getMeteringTips(
  light: LightCondition,
  environment: Environment,
  intent: Intent,
  weather?: WeatherData | null
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
    landscape: 'Meter the sky 1 stop above the ground reading.',
    nature: 'Get close. Meter the subject directly, watch for shadows.'
  };
  tips.primary = envTips[environment];

  // Secondary tip based on light + intent + weather
  if (light === 'harsh' || light === 'bright') {
    if (intent === 'emotional' || intent === 'abstract') {
      tips.secondary = 'Let shadows go deep for mood. Expose for highlights.';
    } else if (intent === 'graphic') {
      tips.secondary = 'Embrace the contrast. Silhouettes can work.';
    } else {
      tips.secondary = 'Watch contrast. Expose for shadows on negative film.';
    }
  } else if (light === 'flat') {
    if (intent === 'calm') {
      tips.secondary = 'Even light suits your intent. Let colors speak.';
    } else {
      tips.secondary = 'Even light is forgiving. Trust your meter reading.';
    }
  } else if (light === 'dim' || light === 'dark') {
    if (intent === 'documentary' || intent === 'narrative') {
      tips.secondary = 'Push processing can recover 1-2 stops if needed.';
    } else {
      tips.secondary = 'Bracket exposures. Err on the side of overexposure.';
    }
  } else if (light === 'mixed') {
    tips.secondary = 'Take multiple readings. Expose for your subject.';
  }

  // Weather-specific overrides
  if (weather) {
    if (weather.sunPosition === 'golden') {
      tips.secondary = 'Golden light changes fast. Re-meter every few minutes.';
    } else if (weather.sunPosition === 'twilight') {
      tips.secondary = 'Light drops quickly. Add a stop every 5 minutes.';
    }
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
  documentary: "Stay present. Don't chase moments.",
  narrative: 'Every frame tells part of the story.',
  abstract: 'Break the rules. Trust your eye.'
};
