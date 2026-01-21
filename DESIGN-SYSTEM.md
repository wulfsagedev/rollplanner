# Roll Planner Design System

## Overview

Roll Planner uses a machined metal aesthetic inspired by premium hardware interfaces like the Teenage Engineering OP-1. The design emphasizes tactile physicality, precision, and utilitarian beauty.

---

## Color Palette

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-surface` | `#e8e8ec` | Main background, brushed aluminum |
| `--bg-inset` | `#dcdce0` | Recessed panels, input fields |
| `--text-primary` | `#1a1a1c` | Primary text, high contrast |
| `--text-secondary` | `#48484a` | Secondary text, labels |
| `--text-tertiary` | `#6e6e73` | Tertiary text, hints |
| `--border-subtle` | `rgba(0,0,0,0.08)` | Subtle dividers |
| `--border-strong` | `rgba(0,0,0,0.15)` | Strong dividers |

### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-surface` | `#2c2c2e` | Main background, dark aluminum |
| `--bg-inset` | `#1c1c1e` | Recessed panels |
| `--text-light` | `#f5f5f7` | Primary text |
| `--text-light-secondary` | `#a1a1a6` | Secondary text |

### Accent Colors (Interactive Only)

| Token | Value | Usage |
|-------|-------|-------|
| `--led-on` | `#ff9500` | Active/selected interactive elements |
| `--led-on-glow` | `rgba(255, 149, 0, 0.6)` | Glow effect for active states |
| `--led-on-deep` | `#ff6b00` | Deeper orange for emphasis |

**Important:** Orange accent colors are reserved exclusively for interactive components:
- Selected condition cards (LED indicator + icon)
- Active toggle labels
- Primary action buttons (Get Recommendation, Lock Roll)
- Pulsating call-to-action states

Never use orange for static/informational content like guidance values, labels, or decorative elements.

---

## Typography

### Font Stack

```css
font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
```

All text uses monospace typography for a technical, precision aesthetic.

### Scale

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | `10px` | Labels, metadata |
| `--text-sm` | `12px` | Body text, values |
| `--text-base` | `14px` | Standard text |
| `--text-lg` | `18px` | Headings, film names |
| `--text-xl` | `24px` | Large headings |

### Rules

- **Weight:** Always use `500` (medium). Never use bold (`700`).
- **Case:** All text is `UPPERCASE` throughout the interface.
- **Letter spacing:** `0.03em` to `0.08em` depending on size.

---

## Spacing

Based on a 4px grid system:

| Token | Value |
|-------|-------|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |

---

## Components

### Buttons

#### Primary Button
- Raised appearance with 3D effect
- Orange background (`--led-on`)
- White text
- Subtle glow on hover
- Physical press effect (1px depression) on click
- Pulsating animation when ready for action

#### Secondary Button
- Flat aluminum appearance
- Matches surface color
- Subtle shadow for depth
- Same press effect as primary

### Cards

#### Selector Cards (Condition Cards)
- Inset/recessed appearance
- Toggleable (click to select, click again to deselect)
- Selected state shows:
  - Orange LED indicator dot with glow
  - Orange icon with glow
  - Subtle background change
- Physical press effect (1px translateY)

#### Film Card
- Dark recessed panel (`#4a4a4e`)
- Light text for contrast
- Contains film recommendation details

#### Guidance Cards
- Light inset panel
- No orange colors (informational only)
- Icon + title header
- Row-based content layout

### Toggles

- Utilitarian iOS-style switch
- White/grey knob (no orange)
- Active label text uses orange glow
- Smooth animation on state change

### Theme Toggle

- Sun/moon icons
- Simple fade transition (0.5s)
- Positioned in persistent header

---

## Effects

### Texture

A subtle aluminum grain texture is applied via SVG filter:
- Uses `feTurbulence` for noise generation
- Very subtle opacity (0.015 light, 0.025 dark)
- Creates brushed metal appearance

### Shadows

#### Raised Elements
```css
box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),  /* Top highlight */
    inset 0 -1px 0 rgba(0, 0, 0, 0.05),       /* Bottom shadow */
    0 4px 0 #b8b8bc,                          /* 3D depth */
    0 5px 10px rgba(0, 0, 0, 0.1);            /* Drop shadow */
```

#### Inset Elements
```css
box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 2px rgba(0, 0, 0, 0.04),
    0 1px 0 rgba(255, 255, 255, 0.9);
```

### Glow (Interactive Only)

```css
filter: drop-shadow(0 0 2px var(--led-on-glow));
box-shadow: 0 0 4px var(--led-on-glow);
text-shadow: 0 0 4px var(--led-on-glow);
```

### Transitions

- Standard: `0.15s ease`
- Theme change: `0.5s ease`
- Button press: `0.05s ease-out`

---

## Layout

### Container
- Max width: `440px`
- Centered horizontally
- Padding: `--space-6` (24px)

### Persistent Header
- Always visible across all screens
- Contains app title and theme toggle
- Anchors content below

### Screen Structure
- Screens stack vertically
- Only one active at a time
- Fade transitions between screens
- All screens anchor to same top position

---

## Accessibility

- Focus states use orange outline (`2px solid var(--led-on)`)
- All interactive elements have `tabindex` and keyboard support
- Color contrast meets WCAG AA standards
- Skip link provided for keyboard navigation
- `prefers-reduced-motion` respected for animations
