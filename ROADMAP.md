# Roll Planner — Product Roadmap

Last updated: 21 January 2026

---

## Philosophy

Roll Planner is a 30-second ritual, not a feature-rich app. Every addition must pass one test: **does this help the photographer commit to their roll faster and with more clarity?** If not, it doesn't belong here.

---

## ✅ V1.0 — MVP (Complete)

- [x] Four tap-only condition selectors (Light, Environment, Intent, Format)
- [x] Rules-based film recommendation engine
- [x] Single film card with EI, exposure guidance, practical notes, discipline
- [x] Lock mechanism with frozen plan
- [x] Optional notes field (location/date)
- [x] localStorage persistence
- [x] Mobile-first, single-column layout

---

## 🔜 V1.1 — Polish & Refinement

**Goal:** Tighten the ritual experience before adding anything new.

- [ ] Add subtle haptic feedback on selection (mobile)
- [ ] Improve transition animations between screens
- [ ] Add "Shake to start over" gesture on locked screen
- [ ] Refine typography scale for better hierarchy
- [ ] Add favicon and PWA manifest for home screen install
- [ ] Offline support (service worker)
- [ ] Dark mode (system preference only, no toggle)

---

## 📦 V1.2 — Roll History

**Goal:** Let photographers see past rolls without turning this into a logging tool.

- [ ] Archive locked rolls to localStorage history
- [ ] Simple "Past rolls" view (date, film, intent — no editing)
- [ ] Maximum 12 rolls stored (oldest auto-deleted)
- [ ] Export history as plain text or JSON
- [ ] Clear history option

**Guiding constraint:** History is for quick reference, not analysis. No statistics, no charts, no insights.

---

## 🎞️ V1.3 — Expanded Film Logic

**Goal:** Smarter recommendations without overwhelming choice.

- [ ] Add black & white intent toggle (HP5/FP4 become primary options)
- [ ] Support Tri-X 400, Delta 3200 for low-light B&W
- [ ] Support CineStill 800T for artificial/mixed light
- [ ] Support Superia 400 as budget colour option
- [ ] Refine recommendation weights (some combos currently default to Portra 400 too often)
- [ ] Add "Why this film?" expandable explanation (optional, collapsed by default)

---

## 📱 V1.4 — Native Feel

**Goal:** Make the web app feel like a native tool.

- [ ] Full PWA with proper iOS/Android install prompts
- [ ] Splash screen
- [ ] Persistent notification option: "Roll in progress" reminder
- [ ] Share locked roll as image (for notes/reference)
- [ ] Siri Shortcut / Android widget to open directly to conditions screen

---

## 🧪 V2.0 — Shooting Companion (Careful Scope)

**Goal:** Minimal in-field support without becoming a meter or logging app.

- [ ] Optional "mid-roll check-in" — surface the discipline sentence as a reminder
- [ ] Quick reference: zone system / sunny 16 rule (static, not a calculator)
- [ ] "Roll complete" button that archives and resets
- [ ] Optional push reminder: "Have you finished your roll?"

**Hard boundaries:**
- No light meter functionality
- No shot counting
- No GPS/location auto-tagging
- No image uploads or previews

---

## 🚫 Anti-Roadmap (Things We Will Never Build)

These features contradict the product's philosophy:

- ❌ Social features (sharing, profiles, followers)
- ❌ AI-powered recommendations or analysis
- ❌ Integration with photo hosting services
- ❌ Shot-by-shot logging
- ❌ Gamification (streaks, badges, achievements)
- ❌ Multiple simultaneous rolls
- ❌ User accounts or cloud sync
- ❌ Advertising or monetisation hooks
- ❌ Community features or forums
- ❌ Lab integration or scanning features

---

## Technical Debt & Maintenance

- [ ] Add basic error boundary for production resilience
- [ ] Consider migrating to a lightweight framework (Preact?) if complexity grows
- [ ] Automated visual regression tests for UI
- [ ] Accessibility audit (screen reader, keyboard navigation)
- [ ] Performance audit (should remain <50kb total)

---

## Open Questions

1. **Should Format (35mm/120) affect recommendations?** Currently it doesn't — all stocks come in both. But 120 shooters tend toward slower, more deliberate work. Worth exploring.

2. **Is "Mixed" light too vague?** Consider splitting into "Changing" (weather) vs "Artificial mix" (tungsten/daylight).

3. **Should we offer a "surprise me" mode?** Random selection within sensible constraints. Risk: undermines the intentionality of the ritual.

4. **Print companion?** A printable card summarising the locked roll. Lo-fi, analog-friendly.

---

## How to Use This Roadmap

- Versions are themes, not deadlines
- Work on what feels right for the product at the time
- Revisit and prune regularly
- If a feature doesn't feel essential after a week, cut it
