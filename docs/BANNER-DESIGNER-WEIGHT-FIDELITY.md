# Banner Designer — font weight fidelity (for a future session)

**Status:** Noted, not built. Small fidelity issue found while unifying the font picker (2026-07-20). The font *wiring* is sound — this is only about which font *weight* gets loaded.

## What's actually wrong

The banner **text is fully font-wired** — every template routes heading text to the picked pairing's heading font and body/tagline/eyebrow/meta to its body font (`ctx.fonts.heading` / `ctx.fonts.body`, resolved in [banner-designer/src/banner/template-kit.ts](../../banner-designer/src/banner/template-kit.ts) `resolveFonts`). Nothing is stuck on a system font.

The gap is **weight**. Several templates hardcode `fontWeight: 800` on headings (e.g. [templates.tsx](../../banner-designer/src/banner/templates.tsx) lines ~460, ~1088, ~1263, plus the ghost-text finish), but:

- Most library pairings declare heading `weights` topping out at **600 or 700** (see `_shared/fonts/shared-fonts.ts` — e.g. Playfair 600;700, most sans 600;700).
- The export preloader in [render-offscreen.ts](../../banner-designer/src/banner/render-offscreen.ts) only loads `headingWeight` (the heaviest *declared* weight), `italic 400`, `bodyWeight`, and `600` body — it does **not** load 800.

So when a template asks for 800 against a pairing whose heading only goes to 700, the browser **synthesizes faux-bold** (thickens the 700 face) instead of loading a true 800 cut. It renders in the right family, just slightly heavier/rougher than a real 800 — not pixel-true, on both the preview and the PNG export.

## Why it's not fixed here

It touches two places (the master's per-font `weights` + `googleParam`, and the export preload), and picking "which pairings should carry a real 800" is a taste/curation call. That's a scoped pass of its own, not a drive-by inside the picker work.

## The fix, when you take it

1. **Decide the policy.** Either (a) stop hardcoding `800` in templates and use `fonts.headingWeight` everywhere (simplest — templates always draw the weight the pairing actually ships), or (b) for the templates that genuinely want an ultra-heavy display look, ensure the pairing's heading declares an 800 weight and loads it.
2. If keeping 800 anywhere: add `800` to those headings' `weights` **and** their `googleParam` in the master `shared-fonts.ts`, then `node _shared/fonts/sync.mjs`.
3. Add the extra weight(s) to the `render-offscreen.ts` preload `Promise.all` so the export rasterizes the real cut, not faux-bold.
4. Typecheck (`tsc -b`) + verify a heavy template (e.g. the promo/countdown ones) exports with a true heavy face, not synthetic bold.

## Separate observation (not a bug)

Switching pairings changes the business name **a lot** on templates that draw it in a distinctive heading font (serif/display), and **subtly** on all-sans pairings (Inter/Inter etc.) where heading and body look alike. That's correct — it's the pairing doing its job, not a wiring failure.
