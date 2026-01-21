// ============================================
// WEATHER SERVICE
// Fetches real-time weather data with photography-relevant analysis
// ============================================

import { WeatherData } from './types';

// Open-Meteo API (free, no API key required)
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

// ============================================
// CACHING LAYER - Fast, in-memory cache with TTL
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = {
  locations: new Map<string, CacheEntry<LocationResult[]>>(),
  reverseGeo: new Map<string, CacheEntry<string>>(),
  sunTimes: new Map<string, CacheEntry<SunTimes>>(),
  forecast: new Map<string, CacheEntry<WeatherData>>(),
};

// Cache TTLs in milliseconds
const CACHE_TTL = {
  locations: 24 * 60 * 60 * 1000,  // 24 hours - locations don't change
  reverseGeo: 24 * 60 * 60 * 1000, // 24 hours - location names don't change
  sunTimes: 12 * 60 * 60 * 1000,   // 12 hours - sun times are date-specific
  forecast: 30 * 60 * 1000,        // 30 minutes - forecasts update
};

function getCached<T>(map: Map<string, CacheEntry<T>>, key: string, ttl: number): T | null {
  const entry = map.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data;
  }
  return null;
}

function setCache<T>(map: Map<string, CacheEntry<T>>, key: string, data: T): void {
  map.set(key, { data, timestamp: Date.now() });
}

// Forward declare for type resolution
export interface LocationResult {
  name: string;
  displayName: string;
  lat: number;
  lon: number;
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  goldenMorning: Date;
  goldenEvening: Date;
  midMorning: Date;
  midday: Date;
  midAfternoon: Date;
  twilight: Date;
  night: Date;
}

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
  // Round coordinates to reduce cache misses for nearby locations
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;

  // Check cache first
  const cached = getCached(cache.reverseGeo, cacheKey, CACHE_TTL.reverseGeo);
  if (cached) return cached;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RollPlanner/1.0' }
    });

    if (!response.ok) return 'Current Location';

    const data = await response.json();
    const address = data.address;

    // Return the most specific location name available
    const locationName = address.neighbourhood ||
           address.suburb ||
           address.city_district ||
           address.city ||
           address.town ||
           address.village ||
           'Current Location';

    // Cache the result
    setCache(cache.reverseGeo, cacheKey, locationName);
    return locationName;
  } catch {
    return 'Current Location';
  }
}

// ============================================
// LOCATION SEARCH (Forward geocoding) - Open-Meteo Geocoding API
// Fast, accurate, no rate limits, sorted by population
// ============================================

interface OpenMeteoGeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;  // State/Province
  admin2?: string;  // County/District
  population?: number;
}

interface OpenMeteoGeoResponse {
  results?: OpenMeteoGeoResult[];
}

export async function searchLocations(query: string): Promise<LocationResult[]> {
  if (!query || query.length < 2) return [];

  // Normalize query for cache key
  const cacheKey = query.toLowerCase().trim();

  // Check cache first
  const cached = getCached(cache.locations, cacheKey, CACHE_TTL.locations);
  if (cached) return cached;

  try {
    // Open-Meteo Geocoding API - fast, accurate, sorted by population
    const params = new URLSearchParams({
      name: query,
      count: '6',
      language: 'en',
      format: 'json',
    });

    const url = `https://geocoding-api.open-meteo.com/v1/search?${params}`;
    const response = await fetch(url);

    if (!response.ok) return [];

    const data: OpenMeteoGeoResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Words to remove from location names (clutter)
    const clutterWords = ['municipality', 'district', 'prefecture', 'province', 'county', 'region', 'metropolitan', 'urban'];
    const cleanName = (name: string): string => {
      let cleaned = name;
      clutterWords.forEach(word => {
        const regex = new RegExp(`\\s*(of\\s+)?${word}(\\s+of)?\\s*`, 'gi');
        cleaned = cleaned.replace(regex, ' ').trim();
      });
      // Clean up extra spaces and trailing commas
      return cleaned.replace(/\s+/g, ' ').replace(/,\s*$/, '').trim();
    };

    // Format results - already sorted by population/relevance
    const results: LocationResult[] = data.results.map((item) => {
      // Clean the city name
      const cityName = cleanName(item.name);

      // Build display name: City, State/Province, Country
      const parts = [cityName];
      if (item.admin1 && cleanName(item.admin1) !== cityName) {
        parts.push(cleanName(item.admin1));
      }
      if (item.country) {
        parts.push(item.country);
      }

      return {
        name: cityName,
        displayName: parts.join(', '),
        lat: item.latitude,
        lon: item.longitude,
      };
    });

    // Cache the results
    setCache(cache.locations, cacheKey, results);
    return results;
  } catch {
    return [];
  }
}

// ============================================
// FORECAST WEATHER (for planned shoots)
// ============================================

interface OpenMeteoForecastResponse {
  hourly: {
    time: string[];
    cloud_cover: number[];
    visibility: number[];
    weather_code: number[];
  };
  daily: {
    sunrise: string[];
    sunset: string[];
  };
}

export async function fetchForecastWeather(
  latitude: number,
  longitude: number,
  targetDate: Date
): Promise<WeatherData | null> {
  // Format date for API and cache key
  const dateStr = targetDate.toISOString().split('T')[0];
  const targetHour = targetDate.getHours();
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)},${dateStr},${targetHour}`;

  // Check cache first
  const cached = getCached(cache.forecast, cacheKey, CACHE_TTL.forecast);
  if (cached) return cached;

  try {
    const url = new URL(WEATHER_API);
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set('hourly', 'cloud_cover,visibility,weather_code');
    url.searchParams.set('daily', 'sunrise,sunset');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('start_date', dateStr);
    url.searchParams.set('end_date', dateStr);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Forecast fetch failed');

    const data: OpenMeteoForecastResponse = await response.json();

    // Find the hour closest to target time
    const hourIndex = Math.min(targetHour, data.hourly.time.length - 1);

    const sunrise = new Date(data.daily.sunrise[0]);
    const sunset = new Date(data.daily.sunset[0]);

    // Determine if target time is during day
    const targetTime = new Date(data.hourly.time[hourIndex]);
    const isDay = targetTime >= sunrise && targetTime <= sunset;

    const weatherInfo = WEATHER_CODES[data.hourly.weather_code[hourIndex]] ||
      { condition: 'Unknown', description: 'Unknown conditions' };

    const sunPosition = getSunPosition(targetDate, sunrise, sunset, isDay);
    const visibility = (data.hourly.visibility[hourIndex] || 10000) / 1000;
    const cloudCover = data.hourly.cloud_cover[hourIndex] || 0;

    const lightQuality = getLightQuality(
      cloudCover,
      visibility,
      sunPosition,
      data.hourly.weather_code[hourIndex]
    );

    const shootingNote = getShootingNote(
      cloudCover,
      visibility,
      sunPosition,
      data.hourly.weather_code[hourIndex]
    );

    // Get location name via reverse geocoding (also cached)
    const locationName = await reverseGeocode(latitude, longitude);

    const result: WeatherData = {
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

    // Cache the result
    setCache(cache.forecast, cacheKey, result);
    return result;
  } catch (error) {
    console.error('Forecast fetch error:', error);
    return null;
  }
}

// Get sunrise/sunset times for a location and date - with caching
export async function getSunTimes(
  latitude: number,
  longitude: number,
  date: Date
): Promise<SunTimes | null> {
  const dateStr = date.toISOString().split('T')[0];
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)},${dateStr}`;

  // Check cache first
  const cached = getCached(cache.sunTimes, cacheKey, CACHE_TTL.sunTimes);
  if (cached) return cached;

  try {
    const url = new URL(WEATHER_API);
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set('daily', 'sunrise,sunset');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('start_date', dateStr);
    url.searchParams.set('end_date', dateStr);

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = await response.json();

    const sunrise = new Date(data.daily.sunrise[0]);
    const sunset = new Date(data.daily.sunset[0]);

    // Calculate key times throughout the day
    const dayLength = sunset.getTime() - sunrise.getTime();
    const goldenDuration = dayLength * 0.1; // ~10% of day

    // Golden hours - shortly after sunrise / before sunset
    const goldenMorning = new Date(sunrise.getTime() + goldenDuration / 2);
    const goldenEvening = new Date(sunset.getTime() - goldenDuration / 2);

    // Mid morning - 25% through the day
    const midMorning = new Date(sunrise.getTime() + dayLength * 0.25);

    // Midday - 50% through the day (solar noon)
    const midday = new Date(sunrise.getTime() + dayLength * 0.5);

    // Mid afternoon - 75% through the day
    const midAfternoon = new Date(sunrise.getTime() + dayLength * 0.75);

    // Twilight (Blue Hour) - 30 min after sunset
    const twilight = new Date(sunset.getTime() + 30 * 60 * 1000);

    // Night - 90 min after sunset (astronomical twilight ends)
    const night = new Date(sunset.getTime() + 90 * 60 * 1000);

    const result = { sunrise, sunset, goldenMorning, goldenEvening, midMorning, midday, midAfternoon, twilight, night };

    // Cache the result
    setCache(cache.sunTimes, cacheKey, result);
    return result;
  } catch {
    return null;
  }
}
