# Roll Planner Project Structure

## Overview

Roll Planner is a single-page web application built as a standalone HTML file. This approach prioritizes simplicity, portability, and ease of deployment.

---

## File Structure

```
V1.0/
├── index.html          # Complete application (HTML + CSS + JS)
├── DESIGN-SYSTEM.md    # Design system documentation
├── PROJECT-STRUCTURE.md # This file
└── VISION.md           # Vision and mission
```

---

## Architecture

### Single File Application

The entire application lives in `index.html`:

1. **HTML** (lines ~1160-1450)
   - Semantic structure
   - Three main screens
   - SVG icons inline
   - Accessibility attributes

2. **CSS** (lines ~1-1160)
   - Custom properties (design tokens)
   - Component styles
   - Dark mode variants
   - Responsive adjustments
   - Animations and effects

3. **JavaScript** (lines ~1450-3200+)
   - Film database
   - Recommendation algorithm
   - State management
   - DOM interactions
   - Weather API integration
   - Local storage persistence

---

## Application Screens

### Screen 1: Conditions (`screen-conditions`)

The main input screen where users configure their shoot:

- **Film Type Toggle:** Colour / B&W
- **Format Toggle:** 35mm / 120
- **Light Selector:** Harsh, Bright, Mixed, Flat, Dim, Dark
- **Environment Selector:** Portrait, Street, Architecture, Interiors, Landscape
- **Intent Selector:** Minimal, Graphic, Expressive, Documentary
- **Weather Module:** Auto-detected location and conditions
- **Get Recommendation Button:** Proceeds to next screen

### Screen 2: Recommendation (`screen-recommendation`)

Displays the algorithm's film recommendation:

- **Film Card:** Stock name, EI rating, exposure approach, discipline
- **Exposure Settings:** Aperture, shutter, EI starting points
- **Metering Tips:** Environment-specific and light-specific guidance
- **Lock Roll Button:** Confirms the choice

### Screen 3: Locked (`screen-locked`)

Confirmation screen after locking a roll:

- **Roll Number:** Sequential tracking
- **Date:** When roll was locked
- **Film Details:** Name and EI
- **Guidance:** Exposure approach reminder
- **Discipline Quote:** Intent-based reminder
- **New Roll Button:** Starts over

---

## Data Structures

### Application State

```javascript
const state = {
    light: null,        // 'harsh' | 'bright' | 'mixed' | 'flat' | 'dim' | 'dark'
    environment: null,  // 'portrait' | 'street' | 'architecture' | 'interiors' | 'landscape'
    intent: null,       // 'calm' | 'graphic' | 'emotional' | 'documentary'
    filmType: 'color',  // 'color' | 'bw'
    filmFormat: '35mm', // '35mm' | '120'
    location: null,     // Geolocation data
    weather: null,      // Weather API response
    recommendation: null, // Generated recommendation
    locked: false,
    rollNumber: null,
    lockedAt: null
};
```

### Film Database Entry

```javascript
{
    name: 'Kodak Portra 400',
    brand: 'Kodak',
    type: 'color_negative',  // or 'bw_negative'
    iso: 400,
    formats: ['35mm', '120'],

    // Technical characteristics (0-10 scale)
    grain: 3,
    saturation: 5,
    contrast: 5,
    latitude: 10,
    sharpness: 8,

    // Color science
    colorBias: 'neutral_warm',
    skinTones: 10,

    // Best conditions
    idealLight: ['golden', 'flat', 'mixed'],
    idealEnvironment: ['portrait', 'landscape'],

    // Push/pull capability
    pushStops: 2,
    pullStops: 1,

    // Metadata
    reciprocityStart: 1,
    communityScore: 9.5,
    pricePoint: 'professional'
}
```

### Recommendation Output

```javascript
{
    film: 'Kodak Portra 400',
    ei: 400,
    exposure: 'Expose for shadows, let highlights bloom.',
    adjustments: []
}
```

---

## Key Functions

### Recommendation Algorithm

`getRecommendation(light, environment, intent, weather, filmType, filmFormat)`

Science-based scoring algorithm that:
1. Filters films by type and format availability
2. Scores each film based on conditions
3. Applies weather-based adjustments
4. Returns top recommendation with EI and exposure guidance

### Exposure Guidance

`getExposureGuidance(light, ei, environment)`

Calculates starting exposure settings using Sunny 16 rule variations:
- Returns aperture, shutter speed, and contextual note
- Adjusts for environment (interiors need more light, etc.)

### Metering Tips

`getMeteringTips(light, environment, intent)`

Generates practical metering advice:
- Primary tip based on shooting environment
- Secondary tip based on light conditions and creative intent

---

## External Dependencies

### APIs

- **Open-Meteo Weather API** (free, no key required)
  - Endpoint: `api.open-meteo.com/v1/forecast`
  - Used for current temperature, weather code, cloud cover

- **Open-Meteo Geocoding API**
  - Endpoint: `geocoding-api.open-meteo.com/v1/reverse`
  - Converts coordinates to location name

### Browser APIs

- **Geolocation API:** User location for weather
- **Local Storage:** Persists theme preference and roll data
- **matchMedia:** System dark mode detection

---

## Local Storage Keys

| Key | Purpose |
|-----|---------|
| `rollplanner_theme` | User's theme preference ('light' or 'dark') |
| `rollplanner_current` | Current locked roll data (JSON) |
| `rollplanner_roll_count` | Sequential roll number counter |

---

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari (responsive design)
- Requires JavaScript enabled
- Uses CSS custom properties (no IE11 support)

---

## Future Considerations

The single-file architecture could be expanded to:
- Multiple files with build process
- Service worker for offline support
- IndexedDB for roll history
- Export/share functionality
