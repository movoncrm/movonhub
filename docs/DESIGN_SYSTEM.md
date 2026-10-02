# MOVONHUB Design System

## Design reference

**Source of truth:** `MovonHub Logo.png` (project root) — an "MH" monogram:

- **M** — vibrant blue ribbon with a diagonal gradient, `#2E8CFF` → `#0B4FD8`.
- **H** — slate/grey ribbon, `#6B7B90` → `#2B3947`.
- Rounded stroke terminals, soft depth, on an off-white surface.

The palette and logo were derived from this reference (not invented). The former
`movon-*` utility scale is retained but its values now align with the reference so
existing components keep working.

## Colour tokens

Defined as CSS variables in `src/app/globals.css` and mapped in `tailwind.config.ts`.

| Token | Tailwind | Hex | Usage |
| --- | --- | --- | --- |
| Primary | `primary` | `#1E7BFF` | Primary actions, links, focus |
| Primary dark | `primary-dark` | `#0B4FD8` | Hover / gradient end |
| Primary deep | `primary-deep` | `#0A3FA8` | Deep gradient |
| Secondary | `secondary` | `#5B6B7F` | Slate accents (logo H) |
| Secondary dark | `secondary-dark` | `#2B3947` | Footer / dark sections |
| Accent | `accent` | `#FFB600` | MOVON gold highlights |
| Background | `background` | `#F5F7FA` | Page background |
| Surface | `surface` | `#FFFFFF` | Nav, cards base |
| Card | `card` | `#FFFFFF` | Card surfaces |
| Border | `borderline` | `#E4E8EE` | Dividers, inputs |
| Text | `ink` | `#1F2A37` | Body / headings |
| Muted | `muted` | `#6B7280` | Secondary text |
| Success | `success` | `#16A34A` | Positive states |
| Warning | `warning` | `#D97706` | Warnings, promo |
| Destructive | `destructive` | `#DC2626` | Errors, delete |
| Focus ring | `focusring` | `#1E7BFF` | Focus outline |

> Semantic colours are declared as hex literals in Tailwind (not `var()`) so opacity
> modifiers such as `bg-primary/10` work. The CSS variables remain available in
> `:root` for documentation and inline styles.

Per-advisor accent: advisor pages set `--brand-accent` / `--brand-accent-dark`
inline from `advisor.accent`.

## Typography

- Family: **Inter** (`next/font/google`, variable `--font-inter`).
- Headings: bold, tight tracking, balanced wrapping.
- Scale: `text-3xl`–`text-6xl` for hero; `text-xl` section titles; `text-sm` body.

## Spacing, radius, elevation

- Container: `max-w-container` (1200px) with responsive padding (`container-page`).
- Section rhythm: `.section` = `py-16 sm:py-20 lg:py-24`.
- Radius: cards `rounded-2xl`, controls `rounded-xl`, pills `rounded-full`.
- Shadows: `shadow-card`, `shadow-lift` (primary), `shadow-soft` — all subtle, tinted slate.

## Components

- **Button** (`components/ui/Button.tsx`) — variants `primary`, `secondary`, `ghost`, `dark`, `whatsapp`; sizes `sm|md|lg`. Exposes `buttonClasses()` for links.
- **Badge** — tones `blue`, `green`, `amber`, `orange`, `grey`.
- **Card** — `.card-surface` (border + radius + shadow).
- **Forms** — `.field-label`, `.field-input`, `.field-error`; native inputs styled once.
- **Navigation / Footer** — sticky translucent nav, dark slate footer with language toggle.
- **Product / Advisor / Dashboard / Admin** components share the tokens above.

## Dark theme (landing page)

The public landing page (`/`) uses a premium dark SaaS treatment inspired by a CloudPeak-style
reference, translated into the MOVONHUB identity. Additional tokens:

| Token | Tailwind | Hex | Usage |
| --- | --- | --- | --- |
| Night | `night` | `#050816` | Main dark background |
| Night soft | `night-soft` | `#080D20` | Alternating dark sections / footer |
| Night card | `night-card` | `#0C1430` | Dark cards / panels |
| Night elevated | `night-elevated` | `#111C3A` | Elevated dark surfaces |
| Electric | `electric` | `#4C91FF` | Bright blue accents/highlights on dark |

- Borders on dark use `border-white/10`; secondary text uses `text-white/60` and below.
- Ambient light: absolutely-positioned blurred radial `bg-primary/25 blur-[140px]` blooms behind
  the hero and final CTA. Keep them subtle, never harsh neon.
- Interface mockups are built from real HTML/CSS (dashboard, chat window, calculator, leads),
  not stock imagery. The MovonHub AI mobile frame uses the **actual** capture from the Movon AI
  project (`public/ai/movonhub-ai-mobile.png`).
- Motion uses the existing `animate-fade-up` and respects `prefers-reduced-motion`.

## SA microsite theme (dark/light)

The main MOVONHUB homepage is **dark-only** (no toggle). Individual SA microsites support a
per-visitor dark/light toggle:

- Toggle lives in the microsite header (sun/moon), persisted in the `mh_theme` cookie (1 year).
- Default is the advisor's `preferredTheme`, else light.
- Implemented by reading the cookie on the server and applying a themed class set
  (`bg-night`/`text-[#F8FAFC]` vs `bg-background`/`text-ink`), so there is no hydration mismatch
  and no page reload on switch.
- Both themes reuse the same tokens; the advisor accent colour (`advisor.accent`) is applied
  inline in both.

## Wordmark

The logo lockup pairs the original mark with a two-tone "MovonHub" wordmark: **M** in the logo
blue family, **H** in the logo slate family, remaining letters light (or ink on light surfaces).
On dark surfaces the mark sits on a light plate (`Logo variant="light"`).

## Product patterns (positioning)

MOVONHUB is the Movon Sales Advisor digital hub, not a catalogue site. Two patterns carry the
identity:

- **Hub landing (`/`)** — minimal: hero with a dashboard-inspired "SA Workspace" panel, a
  four-card SA Toolkit grid (status via Badge: `live`/`coming soon`/`SA tool`), and a personal
  sales-page preview. Navigation is restricted to Home, SA Sample and Login.
- **SA microsite (`/sa/[slug]`)** — a personal, mobile-first customer page: profile + hero,
  intro, featured products grouped by category, "Why contact" benefits, and a prominent
  WhatsApp CTA. Uses the advisor's accent colour inline; shares the same blue/slate base.

Both reuse the same tokens, Button/Badge/Card primitives and `.field-*` form styles. Tool
status must be honest — never present an unbuilt tool as operational.

## Logo assets

The authoritative logo is the original `MovonHub Logo.png` in the project root. It is **not**
redrawn or recoloured.

| File | Purpose |
| --- | --- |
| `public/brand/movonhub-logo-original.png` | Untouched original (1536×1024) |
| `public/brand/movonhub-logo.png` | Whitespace-trimmed derivative (805×475), artwork & aspect preserved — used in header/footer |
| `public/brand/favicon.svg` | App icon ("M") |
| `public/brand/mark.svg`, `logo.svg`, `logo-light.svg` | Legacy SVGs (retained, no longer primary) |

On dark backgrounds the trimmed logo is placed on a light rounded plate (via the `Logo`
`variant="light"` prop) so the original blue/slate artwork remains legible.

## Accessibility

- Global `:focus-visible` outline using the focus token.
- Language toggle uses `aria-pressed` and a labelled group.
- Reduced-motion media query neutralises animation.
- Colour contrast checked against white/slate surfaces.
