# Font Picker Unify — Plan

**Status:** Planned, not built. Written for a breakout build session.
**Scope:** Inside the Fiverr-kit carve-out (Brand Board, Palette Studio, Banner Designer, font pairing). Cleared to build.
**Owner call:** Option **A** — Brand Board's *labeled* model wins and is brought into Palette Studio (confirmed 2026-07-20).

---

## Why this exists

Palette Studio and Brand Board present fonts completely differently, and it's not cosmetic — **they read different data**:

- **Palette Studio** ([palette-studio/src/components/palette/LivePreview.tsx](../../palette-studio/src/components/palette/LivePreview.tsx)) reads the shared library (`FONT_PAIRS` derived from `shared-fonts.ts`, all 31 pairs) and renders a **flat Ant `Select`** where each option shows in its own heading font. No vibe labels.
- **Brand Board** ([brand-board/src/components/board/BoardForm.tsx:316-343](../../brand-board/src/components/board/BoardForm.tsx#L316-L343)) reads its **own separate, older list** — [brand-board/src/lib/fonts.ts](../../brand-board/src/lib/fonts.ts), only **19 pairs**, with a `vibe` string field ("Editorial", "Bold", "Warm"…). Its picker is a **flat Ant `Select`** with `"Editorial — Playfair Display + Inter"` string labels. It does NOT group, and does NOT render options in their own font.

So the `_shared/fonts/` library + [FONTS_AND_PAIRING.md](../../FONTS_AND_PAIRING.md) spec describe a single source of truth that **Brand Board's picker never actually adopted.** Palette Studio adopted the data but not the labels; Brand Board kept the labels but on a stale parallel list. Two font systems, drifting.

Separately, `sync.mjs` only vendors the master into 3 tools (palette-studio, brand-board, icon-kit) while **banner-designer and file-builder also carry vendored copies** — banner-designer actively uses the library, so it silently misses any master change.

---

## The target design (the ideal, not a copy of either)

A single **reusable, vendored** font-pairing picker component — the Opsette pattern, like `opsette-header` / `opsette-share`. It combines the best of both and adds what neither has:

- **Vibe-grouped** — options grouped by vibe (`Minimal`, `Bold`, `Warm`, `Luxury`, `Editorial`, `Technical`, `Creative`…), using Ant `Select` `optGroup`s. All minimal together, all technical together, etc.
- **Each option renders in its own heading font** (Palette Studio's nice touch — makes the menu a preview).
- **Label per option**: heading + body family, e.g. `Newsreader + Inter`, under the group heading.
- Fonts lazy-load on menu open (`loadPairings` / the library's existing loaders) so opening the menu paints real faces.
- Driven **entirely** by the shared library (`FONT_PAIRINGS`, `pairingsByVibe`, `allVibeTags`, `pairingLabel`, `googleHref`) — zero hand-written pair lists in any tool.

### Vibe model — LOCKED (2026-07-20)
- **Vibe is a section header, NOT a filter.** The picker groups pairs under vibe headings for scanability; it does not narrow/filter the list. (A vibe *filter* is deliberately out of scope: if vibe ever becomes a filter it gets promoted globally across all tools as its own decision, not smuggled in through the font picker.)
- **One vibe per pair — each pair appears exactly once**, under its single truest vibe. No pair shown in two groups. This is a **data-model change** to the master:
  - `vibeTags: VibeTag[]` → **`vibe: VibeTag`** (single) on `FontPairing`.
  - Assign the one truest vibe to each of the 31 pairs during the build (pick the honest primary distinction, not "it's kind of minimal and kind of technical").
  - `pairingsByVibe(tag)` / `allVibeTags()` update to read the single `vibe` field. `HeadingOption`/suggestion code that read `vibeTags` update accordingly.
  - The suggestion algorithm's `vibeOverlap` scoring is **removed** (a pair no longer has a tag *set* to overlap). This is fine — that "suggest a body" UX is not wired into any picker today; `contrastScore` still drives ranking if it's ever turned on. Note this in the algorithm comments.
- Grouping order: render vibe groups in `allVibeTags()` first-seen order; within a group, library order.

---

## Work breakdown (breakout session)

### 1. Add the new client pairing to the master
- File: [_shared/fonts/shared-fonts.ts](../../_shared/fonts/shared-fonts.ts)
- Add pairing: **Newsreader (heading) / Inter (body)** — serif heading + humanist-sans body, the library's highest-contrast model. Newsreader is a free Google font (loads by URL; no font-file import needed).
  ```ts
  {
    id: "newsreader-inter",
    vibe: "editorial",   // single vibe per pair (see Vibe model — LOCKED)
    superfamily: false,
    heading: {
      family: "Newsreader",
      classification: "modern-serif",
      weights: [500, 600],
      googleParam: "Newsreader:opsz,wght@6..72,500;6..72,600",
    },
    body: {
      family: "Inter",
      classification: "humanist-sans",
      weights: [400, 500],
      googleParam: "Inter:wght@400;500",
    },
  },
  ```
  (Verify the `opsz` axis param loads correctly at build; Newsreader is an optical-size variable font like Fraunces already in the library — mirror Fraunces' `googleParam` shape.)

### 2. Build the reusable picker component
- New shared bundle: `_shared/opsette-font-picker/` with:
  - `OpsetteFontPicker.tsx` — the grouped, font-rendered Ant `Select`. Props: `value: string (pairing id)`, `onChange: (id) => void`, plus optional `size`. Reads only from the co-located vendored `shared-fonts.ts`.
  - `INTEGRATION.md` — per-app drop-in steps (mirror `_shared/opsette-header/INTEGRATION.md`).
  - `sync.mjs` (or fold into the fonts sync) — vendors both `shared-fonts.ts` and `OpsetteFontPicker.tsx` into each consuming tool at `src/components/opsette-font-picker/`.
- Ant only, mobile-responsive (`width: 100%`), matches Opsette chrome. No inline hardcoded pair data.

### 3. Adopt it in the two tools
- **Brand Board**: replace the inline `Select` in [BoardForm.tsx:316-343](../../brand-board/src/components/board/BoardForm.tsx#L316-L343) with `<OpsetteFontPicker>`. Keep writing `headingFont` / `bodyFont` / `fontPairingId` into `data` on change (resolve them from the pairing id via the library). **Retire [brand-board/src/lib/fonts.ts](../../brand-board/src/lib/fonts.ts)** — migrate its lazy-load helpers (`loadFontFamilies`, `waitForFonts`, `ensureBoardFontsLoaded`) to the library's loaders or keep them as thin wrappers, then delete the hand-written `FONT_PAIRINGS`. Check every importer of `@/lib/fonts` in Brand Board (`BrandBoardApp.tsx`, `ingest.ts`, `exportBoard.ts`) and repoint them.
- **Palette Studio**: replace the flat `Select` in [LivePreview.tsx:42-56](../../palette-studio/src/components/palette/LivePreview.tsx#L42-L56) with `<OpsetteFontPicker>`. Its `FONT_PAIRS` shape in `presets.ts` can stay as the resolution layer; the picker just needs the pairing id in/out.
- **Banner Designer**: it already uses the library. Adopt the shared picker too if it surfaces a font-pair chooser (verify — it may only use fonts programmatically, in which case just keep it on the sync list).

### 4. Fix the sync script
- File: [_shared/fonts/sync.mjs](../../_shared/fonts/sync.mjs) — update `TARGETS`:
  - **Add** `banner-designer` (actively uses the library; currently silently skipped).
  - **Drop** `icon-kit` — no picker anymore; remove its vendored `src/lib/shared-fonts.ts` and the dead `HEADING_FONTS`/`suggestBodyFonts` import in [icon-kit/src/lib/icon-kit/social-design.ts](../../icon-kit/src/lib/icon-kit/social-design.ts).
  - **Drop** `file-builder` from the *font-pairing* sync — its `src/lib/shared-fonts.ts` is vestigial (nothing consumes it; its real font code is the separate old [file-builder/src/lib/fonts.ts](../../file-builder/src/lib/fonts.ts) + [pdf-fonts.ts](../../file-builder/src/lib/pdf-fonts.ts) for PDF signing, which STAY). Remove the dead vendored `shared-fonts.ts`.
- If the picker component gets its own sync, its `TARGETS` = tools that render a picker: **palette-studio, brand-board** (+ banner-designer if it shows one).
- Update [FONTS_AND_PAIRING.md](../../FONTS_AND_PAIRING.md): correct the "used by palette-studio, brand-board, icon-kit" claim → **palette-studio, brand-board, banner-designer**; document the new picker bundle and that Brand Board's `lib/fonts.ts` was retired.

### 5. Verify + ship (per repo — separate remotes)
- Typecheck each touched tool with `tsc -b` (NOT `tsc --noEmit` — root tsconfig has `"files": []`).
- Run `node _shared/fonts/sync.mjs --check` → clean.
- Verify in each running app: menu groups by vibe, options render in-font, Newsreader/Inter appears, selecting it updates the preview, and a saved board/palette blob round-trips the `newsreader-inter` id.
- Commit + push each repo separately (Brand Board, Palette Studio, Banner Designer, plus the apex/shared repo for `_shared/` changes). Personal identity only — `deebuilt`.

---

## Guardrails / gotchas
- **Never** re-add a hand-written pair list to a tool. It goes in the master or it doesn't exist.
- Interop contract is frozen v1: the palette/board blob's `font` object must keep carrying `id` + `heading` + `body` + `googleHref` strings. Don't drop the strings — File Builder and older blobs read them. See [BRAND-KIT-INTEROP-CONTRACT.md](BRAND-KIT-INTEROP-CONTRACT.md).
- Newsreader is a variable/optical-size font — confirm the `opsz,wght` param actually renders at the chosen weights in every tool's canvas/export path, not just on screen.
- Don't touch Signature Studio — it renders email-safe HTML with system-font stacks, a different mechanism; correctly not on the library.

---

## Completion notes — built 2026-07-20

**Status: BUILT. All five tools typecheck clean (`tsc -b`), `sync.mjs --check` clean. Not yet committed/pushed (awaiting Ruthnie's in-app verify → go).**

### What shipped
1. **Master data change** ([_shared/fonts/shared-fonts.ts](../../_shared/fonts/shared-fonts.ts)):
   - Added `newsreader-inter` (vibe `editorial`; `opsz,wght` param mirrors Fraunces).
   - Migrated `vibeTags: VibeTag[]` → **`vibe: VibeTag`** on all 31 existing pairs (32 total now). One truest vibe each — assignments made on my judgment (e.g. `plex-serif-sans`→professional, `fraunces-nunito`→warm, `worksans-worksans`→clean). Group order (first-seen): minimal, technical, startup, bold, creative, friendly, warm, luxury, editorial, professional, trustworthy, clean.
   - `allVibeTags()` / `pairingsByVibe()` now read single `vibe`. Removed `vibeOverlap` from the suggestion algorithm (contrast-only ranking now; noted in comments). Added `pairingPickerLabel()` ("Heading + Body") and `vibeHeading()`.
2. **Reusable picker** ([_shared/opsette-font-picker/](../../_shared/opsette-font-picker/)): `OpsetteFontPicker.tsx` (vibe-grouped `optGroup`s, in-font options, lazy `loadPairings` on open, value = pairing id), `index.ts`, `INTEGRATION.md`.
3. **Sync rewritten** ([_shared/fonts/sync.mjs](../../_shared/fonts/sync.mjs)): now vendors BOTH the library and the picker. Library targets = palette-studio, brand-board, banner-designer, **file-builder**. Picker targets = palette-studio, brand-board, banner-designer.
4. **Adopted** in all three pickers — Palette Studio ([LivePreview.tsx](../../palette-studio/src/components/palette/LivePreview.tsx)), Brand Board ([BoardForm.tsx](../../brand-board/src/components/board/BoardForm.tsx), + simplified `lib/fonts.ts` board shape), Banner Designer ([BannerPanel.tsx](../../banner-designer/src/banner/BannerPanel.tsx), removed its local `FontPicker`).
5. **Icon Kit dead code removed**: deleted the whole unused `renderSocial`/`renderBanner` engine from `canvas.ts` (1907→235 lines), deleted orphaned `social-design.ts` + vendored `shared-fonts.ts`, dropped icon-kit from the sync.
6. Updated [FONTS_AND_PAIRING.md](../../FONTS_AND_PAIRING.md).

### Plan discrepancies found (doc was stale)
- **Brand Board's `lib/fonts.ts` was NOT a separate 19-pair list** — it already derived from the shared library. Real work was just swapping the picker UI; kept its lazy-load helpers.
- **Banner Designer already had a picker** (not a "verify if it shows one") — a genuine 3rd adopter.
- **Icon Kit's dead font code was deeper than "one import line"** — a full `renderSocial`/`renderBanner` block. Removed it properly.
- **⚠️ file-builder's `shared-fonts.ts` is NOT vestigial** — the plan said to delete it, but `pdf-fonts.ts` imports `FONT_PAIRINGS`/`cssFamily`/`FontSpec` for the PDF Sign & Fill picker. **Kept it and added file-builder to the library sync** (its copy had drifted to the old `vibeTags` shape). Deleting it would have broken file-builder.

### Left to do
- Ruthnie verifies in each running app (menu groups by vibe, in-font, Newsreader/Inter present, selection updates preview, blob round-trips the id).
- Commit + push each repo separately (personal `deebuilt` identity): shared/apex repo (`_shared/`), palette-studio, brand-board, banner-designer, file-builder. icon-kit also has changes (dead-code removal) — push it too.
