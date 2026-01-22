# Roll Planner Roadmap

## Version History

### v1.0 - Initial Release (Current)
Released: January 2026

**Core Features:**
- Weather-aware film recommendation algorithm (7-factor scoring)
- 28 film stocks in database (Kodak, Ilford, CineStill, Fuji, Lomo, Foma, Kentmere)
- Plan a Shoot feature with location search and 8-day forecast
- Dynamic time-of-day theming (7 themes: sunrise, golden, morning, day, afternoon, blue-hour, night)
- Sunny 16-based exposure guidance with environment adjustments
- Context-aware metering tips
- Roll locking with sequential numbering
- Dark/light mode with system preference detection
- Mobile-first responsive design with OP-1/Braun aesthetic

**v1.0.1 Polish (January 2026):**
- Fixed morning theme warmth (was blue, now warm between golden and midday)
- Pre-fetch all time slot forecasts for instant switching
- CSS theme preloading to prevent visual glitching
- Scroll-to-top on all screen transitions
- Smooth scroll behavior with reduced-motion fallback
- Mobile keyboard improvements (enterKeyHint, inputMode, blur on select)
- Enlarged "Plan a Shoot" button to match primary buttons
- Location name cleanup (remove municipality, district, etc.)
- Tripod text shortened to single line

---

## v1.2 - UX Restructure & Shot Logging (Planned)

### Philosophy: Roll-Centric Design

The v1.0 app is a **decision-support tool** - use it before shooting to pick a film. But real film photography workflows need support **during** the roll, not just before. A roll might live in your camera for weeks.

**Core insight:** The app currently forgets you mid-roll. Once you "lock" a roll, the app's job is "done" - but you're just starting.

**New mental model:** The Roll is the Hero. Structure around the roll lifecycle, not the decision moment.

### UX Problems Being Solved

| Problem | Current State | v1.2 Solution |
|---------|---------------|---------------|
| App forgets you mid-roll | "Locked" screen is a dead end | Active Roll screen with mid-roll utility |
| "Lock" implies finality | Language suggests ending | "Load" / "Finish" lifecycle language |
| Conditions-first is rigid | Must specify conditions to get film | Bidirectional: Conditions→Film OR Film→Guidance |
| No mid-roll utility | Guidance only shown at decision time | Active Roll always shows EI, tips, frame count |
| History is invisible | Rolls vanish after "New Roll" | Roll History with learning over time |

### New Screen Architecture

```
                    ┌──────────────┐
                    │     HOME     │
                    │  (Roll Hub)  │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌───────────┐   ┌─────────────┐   ┌──────────┐
    │ PICK FILM │   │ ACTIVE ROLL │   │ HISTORY  │
    │           │   │ (if loaded) │   │          │
    └─────┬─────┘   └──────┬──────┘   └──────────┘
          │                │
          │    ┌───────────┴───────────┐
          │    │                       │
          ▼    ▼                       ▼
    ┌──────────────┐            ┌─────────────┐
    │  LOAD ROLL   │            │ FINISH ROLL │
    │  (start new) │            │ (archive)   │
    └──────────────┘            └─────────────┘
```

---

### Phase 1: UX Foundation (Do First)

#### 1.1 Rename "Lock" → "Load" Throughout
**Goal:** Fix mental model - you're starting a roll, not archiving it

- Change "Lock this Roll" → "Load this Roll"
- Change "Locked" screen → "Active Roll" screen
- Change "New Roll" → "Finish Roll" (archives) + "Change Film" (swap without finishing)
- Update all copy to reflect lifecycle language

**Scope:** Copy changes + minor state naming. No structural changes yet.

#### 1.2 Active Roll as Home Screen
**Goal:** The roll you're shooting is always front and center

- If active roll exists: Show Active Roll screen on app open
- Active Roll shows: Film name, EI, frame count, quick reference (exposure approach, metering tips)
- Add navigation to access "Pick a Film" and "History" from Active Roll
- Current weather refresh on Active Roll (conditions may have changed since loading)

**Scope:** Reorder screen priority, add navigation elements.

#### 1.3 "I Have This Film" Entry Point
**Goal:** Support photographers who already have a film and need guidance

- New flow: Select film from list → Get guidance for current conditions
- Film picker: Searchable list of all films in database
- Output: EI recommendation, exposure approach, metering tips for *that* film in *current* conditions
- Can still "Load" the roll from this flow

**Scope:** New component + alternative entry into recommendation engine.

---

### Phase 2: Shot Logging (Core v1.2 Feature)

#### 2.1 Frame Counter on Active Roll
**Goal:** Track progress through the roll

- Display: "Frame 12 of 36" (or 12/16 for 120)
- Tap +/- to adjust frame count
- Auto-detect frame count from format (35mm: 24/36 toggle, 120: 12/16 based on format)
- Persist frame count to storage

#### 2.2 Per-Frame Shot Log
**Goal:** Help photographers track what they shot on each frame

- "Log Frame" button on Active Roll
- Per-frame data: aperture, shutter speed, subject/notes (all optional)
- Quick-entry UI: Tap common values (f/2.8, f/4, f/5.6...) or type custom
- Optional timestamp (auto or manual)
- View/edit past frames in a list

**Research Support:** Shot logging is the #1 requested feature.

#### 2.3 Frame Log Export
**Goal:** Get data out for metadata embedding or records

- Export as CSV or JSON
- Include: roll info, date loaded, date finished, per-frame data
- Share sheet integration (mobile)

---

### Phase 3: History & Learning

#### 3.1 Roll History
**Goal:** Let users review past rolls and learn over time

- Persist finished rolls to IndexedDB (localStorage too limited)
- List view: Date, film, frame count, conditions summary
- Tap to view full details + frame log
- Add/edit notes on past rolls

#### 3.2 "Why This Film?" on Active Roll
**Goal:** Educate users about their current film's characteristics

- Show scoring breakdown for loaded film
- Context: "Portra 400 is ideal for your conditions because..."
- Helps users internalize film characteristics

---

### Phase 4: Enhanced Recommendations

#### 4.1 Alternative Film Suggestions
**Goal:** Show top 3 recommendations, not just 1

- Display: "Best match" + "Also great" + "Experimental pick"
- Brief reason for each (e.g., "Excellent skin tones", "Budget-friendly")
- Tap any to see full details or load it

**Technical:** Algorithm already scores all films - expose top 3.

#### 4.2 Reciprocity Calculator
**Goal:** Help long-exposure photographers

- Access from Active Roll (contextual to loaded film)
- Input: metered time → Output: adjusted time
- Film-specific curves (data exists in `reciprocityStart`)
- Optional countdown timer

---

### Phase 5: Polish & Power Features

#### 5.1 Prominent Exposure Reminders
- Visual callout on Active Roll: "METER FOR SHADOWS"
- Bracket reminder
- Sunny 16 quick reference

#### 5.2 Budget Mode Toggle
- Prefer budget films when enabled
- Show approximate cost per roll

#### 5.3 Camera Profiles
- Save meter compensation for known cameras
- Apply to exposure guidance

#### 5.4 Quick Reference Card Export
- Shareable image of roll settings
- For printing or phone gallery

---

## v1.3+ Future Considerations

### Potential Features (Needs Research)
- Development time recommendations based on film + push/pull
- Lab/scanner integration for results tracking
- Bulk film purchasing recommendations
- Community film ratings sync
- AR viewfinder with exposure preview

### Never (Per Vision Document)
- Social features (no sharing, likes, followers)
- AI-generated images
- Subscription paywalls for core features
- Advertising

---

## Technical Debt for v1.2

1. **State Management Evolution**
   - Migrate to IndexedDB for roll history (localStorage limit ~5MB)
   - Abstract storage layer for future sync options
   - Support multiple data types: active roll, finished rolls, frame logs

2. **Film Database Validation**
   - Verify all 28 stocks are still in production
   - Update prices if making budget mode
   - Consider adding new stocks (Harman Phoenix, etc.)

3. **Offline Support**
   - Service worker for PWA functionality
   - Cache weather data for offline reference
   - Offline-first shot logging (critical for field use)

4. **Accessibility Audit**
   - Ensure 4.5:1 contrast in all time-of-day themes
   - VoiceOver labels for all selector cards
   - Test with screen readers

---

## Research Findings (January 2026)

### What Film Photographers Struggle With
1. **Cost** - $35-40 per roll (film + dev + scan)
2. **Underexposure** - #1 technical mistake
3. **Unreliable in-camera meters** - Vintage cameras degrade
4. **No immediate feedback** - Unlike digital

### What Photographers Want in Apps
1. Shot logging with per-frame notes
2. Sun/moon position for planning
3. Weather integration
4. Simple, focused interface
5. Film-specific language (proper f-stops, shutters)
6. Reciprocity calculation for long exposures
7. Cost tracking

### Key Quotes from Research
- "Meter for the shadows" - The golden rule for film
- "The tool I wished existed" - User describing Frames app
- "Keep it simple" - Resist overcomplicating workflows

---

## Success Metrics for v1.2

1. **Daily Active Use:** Users open the app while shooting (not just before)
2. **Roll Completion:** Users "Finish" rolls instead of abandoning them
3. **Frame Logging:** Users log 50%+ of their frames
4. **Return Rate:** Users return to start new rolls after finishing
5. **Learning:** Users explore "Why This Film?" explanations

---

## Implementation Order

**Recommended sequence for v1.2 development:**

```
Phase 1: UX Foundation
├── 1.1 Rename Lock → Load (copy changes)
├── 1.2 Active Roll as Home Screen
└── 1.3 "I Have This Film" entry point

Phase 2: Shot Logging
├── 2.1 Frame Counter
├── 2.2 Per-Frame Shot Log
└── 2.3 Export functionality

Phase 3: History & Learning
├── 3.1 Roll History (requires IndexedDB migration)
└── 3.2 "Why This Film?" explanations

Phase 4: Enhanced Recommendations
├── 4.1 Alternative Film Suggestions (top 3)
└── 4.2 Reciprocity Calculator

Phase 5: Polish
├── 5.1 Exposure Reminders
├── 5.2 Budget Mode
├── 5.3 Camera Profiles
└── 5.4 Reference Card Export
```

**Phase 1 is the foundation.** It fixes the mental model and enables all subsequent features. Do not skip to shot logging without restructuring first - the features won't have a proper home.

**Phase 2 is the core value-add.** Shot logging is the #1 requested feature and differentiates Roll Planner from simpler recommendation tools.

**Phases 3-5 are additive.** Can be released incrementally after the foundation is solid.
