// ============================================
// WEATHER SERVICE
// Fetches real-time weather data with photography-relevant analysis
// ============================================

import { WeatherData } from './types';

// Open-Meteo API (free, no API key required)
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API = 'https://api.open-meteo.com/v1/forecast';

interface OpenMeteoResponse {
  current: {
    cloud_cover: number;
    visibility: number;
    weather_code: number;
    is_day: number;
  };
  daily: {
    sunrise: string[];
    sunset: string[];
  };
}

// WMO Weather codes to readable conditions
const WEATHER_CODES: Record<number, { condition: string; description: string }> = {
  0: { condition: 'Clear', description: 'Clear sky' },
  1: { condition: 'Mostly Clear', description: 'Mainly clear' },
  2: { condition: 'Partly Cloudy', description: 'Partly cloudy' },
  3: { condition: 'Overcast', description: 'Overcast' },
  45: { condition: 'Foggy', description: 'Fog' },
  48: { condition: 'Foggy', description: 'Depositing rime fog' },
  51: { condition: 'Light Drizzle', description: 'Light drizzle' },
  53: { condition: 'Drizzle', description: 'Moderate drizzle' },
  55: { condition: 'Heavy Drizzle', description: 'Dense drizzle' },
  61: { condition: 'Light Rain', description: 'Slight rain' },
  63: { condition: 'Rain', description: 'Moderate rain' },
  65: { condition: 'Heavy Rain', description: 'Heavy rain' },
  71: { condition: 'Light Snow', description: 'Slight snow' },
  73: { condition: 'Snow', description: 'Moderate snow' },
  75: { condition: 'Heavy Snow', description: 'Heavy snow' },
  77: { condition: 'Snow Grains', description: 'Snow grains' },
  80: { condition: 'Light Showers', description: 'Slight rain showers' },
  81: { condition: 'Showers', description: 'Moderate rain showers' },
  82: { condition: 'Heavy Showers', description: 'Violent rain showers' },
  85: { condition: 'Snow Showers', description: 'Slight snow showers' },
  86: { condition: 'Heavy Snow', description: 'Heavy snow showers' },
  95: { condition: 'Thunderstorm', description: 'Thunderstorm' },
  96: { condition: 'Thunderstorm', description: 'Thunderstorm with slight hail' },
  99: { condition: 'Thunderstorm', description: 'Thunderstorm with heavy hail' },
};

function getSunPosition(
  now: Date,
  sunrise: Date,
  sunset: Date,
  isDay: boolean
): WeatherData['sunPosition'] {
  if (!isDay) {
    // Check if we're in twilight (within 30 min of sunrise/sunset)
    const minToSunrise = (sunrise.getTime() - now.getTime()) / 60000;
    const minFromSunset = (now.getTime() - sunset.getTime()) / 60000;

    if (minToSunrise > 0 && minToSunrise < 30) return 'twilight';
    if (minFromSunset > 0 && minFromSunset < 30) return 'twilight';
    return 'night';
  }

  const dayLength = sunset.getTime() - sunrise.getTime();
  const elapsed = now.getTime() - sunrise.getTime();
  const progress = elapsed / dayLength;

  // Golden hour: first/last ~10% of daylight
  if (progress < 0.1 || progress > 0.9) return 'golden';
  // Low sun: first/last 20%
  if (progress < 0.2 || progress > 0.8) return 'low';
  // High sun: middle of the day
  return 'high';
}

function getLightQuality(
  cloudCover: number,
  visibility: number,
  sunPosition: WeatherData['sunPosition'],
  weatherCode: number
): string {
  // Fog/low visibility conditions
  if (visibility < 2) return 'Diffused, atmospheric';
  if (visibility < 5) return 'Soft, hazy';

  // Night/twilight
  if (sunPosition === 'night') return 'Available light only';
  if (sunPosition === 'twilight') return 'Soft, directional twilight';

  // Golden hour
  if (sunPosition === 'golden') {
    if (cloudCover < 30) return 'Warm, directional golden light';
    if (cloudCover < 60) return 'Filtered golden light';
    return 'Diffused warm light';
  }

  // Overcast
  if (cloudCover > 80) return 'Even, shadowless';
  if (cloudCover > 50) return 'Soft, diffused';
  if (cloudCover > 20) return 'Mixed sun and clouds';

  // Clear conditions
  if (sunPosition === 'high') return 'Harsh, high contrast';
  return 'Directional with defined shadows';
}

function getShootingNote(
  cloudCover: number,
  visibility: number,
  sunPosition: WeatherData['sunPosition'],
  weatherCode: number
): string {
  // Bad weather
  if (weatherCode >= 95) return 'Protect your gear. Dramatic light possible between storms.';
  if (weatherCode >= 61) return 'Overcast light is flattering for portraits. Watch for lens droplets.';
  if (weatherCode >= 45) return 'Fog creates depth and mood. Increase exposure +1 stop.';

  // Night
  if (sunPosition === 'night') return 'Use fast film or push. Tripod recommended for sharp images.';

  // Twilight
  if (sunPosition === 'twilight') return 'Blue hour magic. Meter carefully, bracket if unsure.';

  // Golden hour
  if (sunPosition === 'golden') {
    if (cloudCover < 30) return 'Prime shooting time. Side-light for texture, backlight for glow.';
    return 'Soft golden light. Great for any subject.';
  }

  // Low visibility
  if (visibility < 5) return 'Atmospheric conditions. Use haze for depth in landscapes.';

  // Midday
  if (sunPosition === 'high') {
    if (cloudCover > 60) return 'Clouds taming harsh light. Good for outdoor portraits.';
    if (cloudCover > 30) return 'Watch for shifting light. Meter frequently.';
    return 'Seek open shade or use fill. Harsh shadows on faces.';
  }

  // Default good conditions
  if (cloudCover > 50) return 'Overcast is your softbox. Great for portraits and details.';
  return 'Good directional light. Use shadows creatively.';
}

export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  try {
    const url = new URL(WEATHER_API);
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set('current', 'cloud_cover,visibility,weather_code,is_day');
    url.searchParams.set('daily', 'sunrise,sunset');
    url.searchParams.set('timezone', 'auto');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Weather fetch failed');

    const data: OpenMeteoResponse = await response.json();
    const now = new Date();

    const sunrise = new Date(data.daily.sunrise[0]);
    const sunset = new Date(data.daily.sunset[0]);
    const isDay = data.current.is_day === 1;

    const weatherInfo = WEATHER_CODES[data.current.weather_code] ||
      { condition: 'Unknown', description: 'Unknown conditions' };

    const sunPosition = getSunPosition(now, sunrise, sunset, isDay);
    const visibility = data.current.visibility / 1000; // Convert m to km
    const cloudCover = data.current.cloud_cover;

    const lightQuality = getLightQuality(
      cloudCover,
      visibility,
      sunPosition,
      data.current.weather_code
    );

    const shootingNote = getShootingNote(
      cloudCover,
      visibility,
      sunPosition,
      data.current.weather_code
    );

    // Get location name via reverse geocoding
    const locationName = await reverseGeocode(latitude, longitude);

    return {
      conditions: weatherInfo.condition,
      description: weatherInfo.description,
      cloudCover,
      visibility: Math.round(visibility * 10) / 10,
      sunPosition,
      lightQuality,
      shootingNote,
      locationName,
      updatedAt: Date.now(),
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RollPlanner/1.0' }
    });

    if (!response.ok) return 'Current Location';

    const data = await response.json();
    const address = data.address;

    // Return the most specific location name available
    return address.neighbourhood ||
           address.suburb ||
           address.city_district ||
           address.city ||
           address.town ||
           address.village ||
           'Current Location';
  } catch {
    return 'Current Location';
  }
}
