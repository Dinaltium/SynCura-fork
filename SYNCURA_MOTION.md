# Motion — Agent Reference (SynCura)
> Companion to `SYNCURA_THEME.md`. That file owns color/type/shape tokens;
> this one owns *how things move*. Same rule applies: don't alter locked
> values without owner approval, log changes as `CHG-XXX`.
> Living implementation: `frontend/src/motion/` (shared keyframes + hooks).

## The problem this file solves

"Fixed background, text floats over it" is two unrelated layers that happen
to overlap. It reads as decoration bolted onto a page rather than one
designed object. The fix isn't more animation, it's **one motion system**
where background and foreground are driven by the *same* signal, so they
move together instead of past each other. For SynCura, the natural shared
signal is already sitting right there in the data: **a pulse**.

Everything in this file exists to answer one question before it's used:
*what real signal is this animation reacting to?* If the honest answer is
"nothing, it just looks nice," it doesn't ship on the dashboard, and it
gets used sparingly even on marketing pages.

## The core motif: one pulse, many surfaces

Define a single CSS custom property, `--pulse-t`, driven by one JS ticker
(a `requestAnimationFrame` loop, not N separate `setInterval`s). Every
animated element on a page reads from that same clock. Concretely:

```css
:root {
  --pulse-bpm: 62; /* default idle rate; dashboard overrides per-patient */
  --pulse-duration: calc(60s / var(--pulse-bpm));
}

@keyframes pulse-cycle {
  0%   { --pulse-t: 0; }
  100% { --pulse-t: 1; }
}
```

A single element (e.g. `<html>` or a top-level layout div) runs
`pulse-cycle` on `--pulse-duration`, and children reference `--pulse-t`
through `@property`-registered custom properties or a small JS bridge that
writes computed values onto CSS vars each frame. The point: the background
gradient's brightness, a hero waveform's stroke offset, a card's border
glow, and a heading's letter-spacing all key off the *same* `--pulse-t` —
so when one moves, they visibly breathe together instead of running on
independent loops that drift in and out of phase.

- **Marketing/landing pages**: `--pulse-bpm` sits at a calm resting rate
  (~60) purely for atmosphere — it's the site's ambient heartbeat.
- **Dashboard**: when a specific patient is focused, `--pulse-bpm` can
  actually bind to that patient's live HR (clamped to a sane visual range,
  e.g. 50–110, so a real tachycardia doesn't turn the UI into a strobe —
  see the hard flashing limit in `SYNCURA_THEME.md`). This turns the motion
  from decoration into *information*: the whole page's rhythm tells you
  something about the room before you've read a single number.

## Cardiac easing, not generic easing

A real heartbeat isn't a smooth sine wave — sharp systolic rise, slower
diastolic fall. Add this alongside the portfolio's existing easing tokens
(don't replace them; use this specifically for the pulse motif):

```css
--ease-systole: cubic-bezier(0.16, 0.84, 0.24, 1);  /* fast rise */
--ease-diastole: cubic-bezier(0.6, 0, 0.4, 1);      /* slower settle */
```

Use `--ease-systole` for the attack of any pulse-linked animation and
`--ease-diastole` for its release. This one detail is what makes the motif
read as "heartbeat" rather than "generic pulsing glow" — the asymmetry is
the whole trick.

## Threading background into foreground (concrete techniques)

Pick 2–3 of these per page, not all of them — restraint is what keeps it
"polished" instead of "busy":

1. **A single continuous waveform path.** One SVG polyline (styled like an
   ECG/pleth trace) runs behind the hero, and *the same path* reappears,
   cropped and repositioned, inside a card or under a heading elsewhere on
   the page. Same stroke, same `--pulse-t`-driven dash-offset. This is the
   single strongest way to make bg/fg feel like one object instead of two
   layers, because it's literally one element passing behind and in front
   of content (`z-index` sandwich, not two unrelated assets).
2. **Ambient gradient tied to `--pulse-t`.** Background brightness/hue
   shifts a few percent in sync with the pulse rather than sitting static
   or auto-looping on its own timer. Small amplitude — this is a heartbeat,
   not a strobe light.
3. **Foreground elements gain a soft glow on the systolic beat**, using
   `--color-accent` at low opacity, timed to `--ease-systole`. Buttons,
   the logo mark, key numerals — brief, consistent, never on alert/status
   elements (those follow `SYNCURA_THEME.md`'s alert rules, not this
   ambient one).
4. **Scroll-linked reveal uses the same easing pair**, not a different
   "fade up on scroll" library default. Content enters with
   `--ease-systole`, settles with `--ease-diastole`. Consistency of easing
   across scroll-triggered and pulse-triggered motion is what unifies the
   page — two different easing philosophies on one page is what makes
   animation feel bolted-on.
5. **Cursor-following glow, damped.** If used at all (marketing pages
   only), spring-damp it so it trails rather than snaps — a stiff 1:1
   cursor-follow reads as a widget; a lagged one reads as atmosphere.

## What NOT to do

- Don't animate the background on its own infinite loop with a different
  duration than anything in the foreground. Unsynced loops are exactly the
  "two unrelated layers" problem this file exists to fix.
- Don't add motion with no signal behind it just to fill space. Every loop
  should be traceable to the pulse clock, a scroll position, a hover/focus
  state, or real data (risk score, HR). "It looked empty" is not a reason
  to animate.
- Don't bring any of this — pulse-linked glows, scroll easing, ambient
  gradients — into alert/status transitions inside the dashboard. Those
  are governed entirely by `SYNCURA_THEME.md`'s clinical-safety motion
  rules (fast/normal tiers only, no strobing, instant color/icon/label
  change with motion as pure garnish). This file's motif is for marketing
  surfaces and dashboard *chrome* (nav, headers, empty states) — never for
  the thing a clinician is reading to make a decision.
- Don't use `--pulse-bpm` bound to live patient data anywhere two or more
  patients' rhythms could be visible/compared at once (e.g. the patient
  list) — a page where every card pulses at its own patient's rate turns
  into visual noise and works against fast scanning. Live-bound pulse is
  for single-patient focus views only; list/grid views use the calm
  ambient default.
- Don't skip `prefers-reduced-motion`. Under it, freeze `--pulse-t` at a
  fixed value (don't just speed it up or remove it abruptly) so gradients/
  glows render at one calm state rather than flickering to a stop.

## A ready-to-use prompt (for an agent implementing this)

> Implement SynCura's motion system per `SYNCURA_MOTION.md`: a single
> `--pulse-t` custom property driven by one rAF loop at `--pulse-bpm`
> (default 62, live-bound to the focused patient's HR only on the
> single-patient view, clamped 50–110). Use `--ease-systole` /
> `--ease-diastole` for the attack/release of anything pulse-linked. On the
> landing page, thread one shared SVG waveform path behind the hero and
> reappearing under the feature section, both reading the same dash-offset
> from `--pulse-t`. Tie background gradient brightness and heading/button
> accent-glow to the same clock so nothing runs on its own independent
> timer. Respect `prefers-reduced-motion` by freezing `--pulse-t` rather
> than disabling it. Do not touch alert/status animation — that stays on
> `SYNCURA_THEME.md`'s fast/normal-only, no-strobe rules untouched.

## Rules for agents

1. One clock (`--pulse-t`) per page context; every ambient animation reads
   from it rather than running its own timer.
2. `--ease-systole` / `--ease-diastole` are the only easing pair used for
   the pulse motif — don't mix in generic ease-in-out here.
3. This file's motifs never appear on alert/status transitions — those are
   `SYNCURA_THEME.md`'s territory exclusively.
4. Live-bound `--pulse-bpm` only on single-patient focus views, never on
   multi-patient lists/grids.
5. Two or three techniques per page, not all of them — the goal is one
   cohesive object, not a showcase of effects.
6. New motif, new easing curve, or a change to the pulse-binding rules =
   `CHG-XXX` + owner approval, same process as the theme file.
