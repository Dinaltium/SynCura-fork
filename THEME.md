# Theme — Agent Reference (SynCura)
> Standing instruction: this file is the source of truth for SynCura's visual
> theme. Agents must follow it on every change. Do not alter locked values
> without the owner's explicit approval.
> Adapted from the personal-portfolio `THEME.md` (locked 2026-09-08) for a
> clinical, safety-critical product (ICU deterioration monitoring). Brand DNA
> — void-black base, bone-white text, signal-orange accent, this type stack —
> carries over. Everything status/alert-related is new, because a dashboard
> that flags patient risk has different constraints than a portfolio site.
> Living tokens: `frontend/src/index.css` (`:root`).

## Why this file diverges from the portfolio theme

The portfolio theme optimizes for mood and craft. A clinical dashboard has to
optimize for *correct, fast interpretation under stress* first, and mood
second. Three consequences run through every section below:

1. **Color can never be the only signal.** Status must always be readable
   from icon/shape/text alone, because ~8% of men have red-green color
   vision deficiency and a clinician glancing at a wall monitor from across
   a room may lose color fidelity entirely.
2. **Accent orange stays reserved for actions, not alerts.** The portfolio
   uses `--color-accent` for CTAs *and* "live" states. SynCura splits these:
   orange means "click me," a dedicated status scale means "this patient's
   risk changed."
3. **Motion never gets in front of meaning.** The portfolio's `cinematic`
   1100ms tier is banned from anything patient-state-related — a risk
   escalation has to register the instant it happens, not after a flourish.

## Palette (locked)

### Core (inherited from portfolio)

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0e0e11` | void black base (dark mode) |
| `--color-surface` | `#17171c` | panels / cards (dark mode) |
| `--color-fg` | `#f2f0ea` | bone white text (dark mode) |
| `--color-muted` | `#a7a39a` | secondary text — body copy only, never numeric vitals |
| `--color-border` | `#2a2a31` | hairlines |
| `--color-accent` | `#ff5c1f` | signal orange — CTAs, links, brand marks only |
| `--color-accent-hover` | `#ff7440` | CTA hover |

### Light mode (new — required for SynCura)

Bedside carts, daytime chart review, and printed shift-handoff views mean
SynCura needs a real light theme, not just a dark-mode-only brand statement.

| Token | Value | Use |
|---|---|---|
| `--color-bg-light` | `#f7f6f2` | base |
| `--color-surface-light` | `#ffffff` | panels / cards |
| `--color-fg-light` | `#15151a` | primary text |
| `--color-muted-light` | `#5b5850` | secondary text |
| `--color-border-light` | `#dedad0` | hairlines |

`color-scheme: light dark` — respect `prefers-color-scheme`, with an
explicit in-app toggle for shift handoff (a unit may standardize on one
mode regardless of OS setting).

### Status & alert scale (new — the load-bearing part of this theme)

Distinct from `--color-accent`. These four are the only colors ever used to
represent patient risk state, and each carries a fixed icon + label pairing
that must render even if color is stripped out (print, grayscale, color
filters).

| Token | Value (dark) | Value (light) | Status | Paired icon |
|---|---|---|---|---|
| `--color-status-stable` | `#3fb37f` | `#1f8f5f` | Stable | filled circle |
| `--color-status-watch` | `#e0b400` | `#a67c00` | Watch | filled triangle |
| `--color-status-high` | `#ff8a3d` | `#c95a10` | High | filled triangle + exclamation |
| `--color-status-critical` | `#ff3b3b` | `#d31f1f` | Critical | filled diamond + exclamation |

Rules:
- These four hues must stay perceptually distinct in grayscale (verify by
  desaturating and checking relative luminance separation, not just hue).
- `--color-status-high` is a different orange from `--color-accent` — don't
  let them read as the same color at a glance. If a redesign narrows that
  gap, that's a locked-value change requiring `CHG-XXX` + owner approval.
- Every status chip/badge renders icon + text label + color together. Color
  alone is never shipped.
- Minimum contrast: 4.5:1 for status text on its background, 3:1 for the
  icon against the surface it sits on (WCAG 2.1 AA). Check both light and
  dark surfaces — `--color-status-watch` in particular is close to the line
  on white and needs the darker light-mode value above, not the dark-mode one.

### Data visualization (new)

For risk dials, sparklines, and the SHAP-style contribution overlay:

| Token | Value | Use |
|---|---|---|
| `--color-viz-contrib-pos` | `#ff5c6a` | contribution pushing risk up |
| `--color-viz-contrib-neg` | `#3f9bd6` | contribution pushing risk down |
| `--color-viz-grid` | `--color-border` (theme-aware) | chart gridlines |
| `--color-viz-baseline` | `--color-muted` (theme-aware) | NEWS2/baseline comparison line |

Contribution colors are red/blue rather than red/green so the up/down
encoding survives red-green color blindness; pair with `+`/`−` signs in the
label regardless.

- Selection: accent bg, base text (theme-aware). Focus ring: 2px accent,
  3px offset — unchanged from portfolio, still applies everywhere except
  status chips, which get a 2px status-colored ring to avoid implying
  "actionable" on something that's informational.
- No hologram/scanline fx here — that's portfolio-specific flourish; a
  clinical dashboard doesn't get glow effects on data.

## Type

| Token | Value | Use |
|---|---|---|
| `--font-display` | `"Fraunces", Georgia, serif` | marketing/landing pages only (About, literature-review page) |
| `--font-body` | `"Space Grotesk", system-ui, sans-serif` | body copy, labels, non-numeric UI |
| `--font-mono` | `"JetBrains Mono", ui-monospace, monospace` | **all vitals and numeric readouts** (HR, SpO2, RR, temp, risk score), timestamps, patient IDs |

Change from the portfolio: `--font-mono` is no longer just "terminal labels
and buttons" — on the ICU dashboard it's the font for every number a
clinician might act on, because tabular figures keep columns of vitals
aligned and prevent a shifting "3" from being misread as an "8" mid-update.
`--font-display` is demoted to non-clinical pages; don't set risk numbers,
alert text, or dashboard headings in Fraunces — the dashboard interior uses
`--font-body` for headings instead, at weight 600+.

## Shape & Motion

| Token | Value |
|---|---|
| `--radius-sm` | `6px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `20px` |
| `--grid-max` | `1120px` |

Durations — same four tiers, narrower usage:

- `fast` `160ms`, `normal` `320ms` — used for status changes, alert
  entrances, hover states. This is the only range allowed for anything
  representing a patient risk transition.
- `slow` `640ms` — page-level transitions, panel open/close.
- `cinematic` `1100ms` — **marketing/landing pages only.** Never on the
  dashboard, never on an alert, never on anything inside `/patient/*` or
  `/simulated-data`.

Easing unchanged: standard `cubic-bezier(0.22, 1, 0.36, 1)`, enter
`(0.16, 1, 0.3, 1)`, exit `(0.64, 0, 0.78, 0)`.

Additional clinical-safety motion rules:
- No flashing faster than 3 times per second on any element, ever (WCAG
  2.3.1 — photosensitive seizure risk). A "Critical" badge may pulse once
  on entry, then hold steady; it does not strobe to grab attention.
- `prefers-reduced-motion` must fully disable pulse/entrance animation on
  status changes — the color/icon/label swap still happens instantly, only
  the motion is removed.
- Prefer transform/opacity over layout properties, same as portfolio.

## Rules for agents

1. Reference tokens via `var(--color-*)` / `var(--font-*)` — never hardcode
   hex/font stacks in components.
2. New surfaces: `--color-surface` bg + `--color-border` hairline; hover
   border → accent (unchanged from portfolio).
3. `--color-accent` is reserved for actions/links/brand — never use it to
   represent patient status, even informally in a quick prototype.
4. Any status change in the UI ships with icon + label + color together.
   A PR that adds a color-only status indicator should be rejected in review.
5. Numeric vitals and risk scores are always set in `--font-mono` with
   tabular figures enabled.
6. Nothing patient-state-related uses the `cinematic` duration tier.
7. Any palette, font, status-color, or token change = new `CHG-XXX` item +
   owner approval first, same as the portfolio process.
