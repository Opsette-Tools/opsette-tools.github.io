# Banner Designer — build spec (standalone tool)

Status: **build spec, written 2026-07-18.** This is the source of truth for the
standalone Opsette Tools app — a real social-banner / profile-card designer. It
supersedes `icon-kit/docs/TEXTURE_THEORY_PLAN.md` (now OBSOLETE — that doc was a
retrofit of the wrong model into Icon Kit's canvas).

> ## ⭐ STARTING POINT — read first (2026-07-18)
> **The tool is named "Banner Designer" (repo slug `banner-designer`), and it is
> ALREADY SCAFFOLDED AND RUNNING** — do NOT re-scaffold. (Older text below may say
> "Banner Studio"; that was a placeholder name.)
> - Location: `c:\Opsette Tools\banner-designer`. Dev server: `npm run dev` → **port
>   8126**. Typecheck: `npx tsc --noEmit` (flat tsconfig — `--noEmit`, not `-b`).
>   Deps are Ant + react + qrcode + html-to-image (lean; no Tailwind/shadcn).
> - **What's already extracted from Icon Kit and WORKING** (verified: exported from
>   old Icon Kit → imported into this app successfully): the field-section builder
>   (`SocialPanel.tsx` + `social-controls.tsx` + `SectionCard`), brand-board
>   interop + reopen-from-kit (`brand-kit.ts`, `export-assets.ts`,
>   `ExportToBoardButton.tsx`, `opsette-kit-link.ts`, `seed.ts`), the ?seed= and
>   iframe embed-save paths (`App.tsx`), shared header/footer chrome, right-rail
>   sticky preview, PNG download, font/contrast helpers (`shared-fonts.ts`,
>   `social-design.ts`). The favicon side was stripped out.
> - **What is NOT yet done — this is the build session's job:** the MODEL REBUILD in
>   §"THE THREE MODEL CHANGES" below — composition-layer rendering (CSS/DOM, replacing
>   the canvas), smart field routing, multiselect finish stack, the purpose-driven
>   template gallery, and the 8 templates. Also add `html-to-image` export wiring
>   (dep is installed) and offer/CTA fields.
> - **Deferred (NOT blocking the build; tracked separately):** push `banner-designer`
>   to GitHub as a PUBLIC repo; add the GitHub Actions deploy workflow (apex-routes,
>   base `/banner-designer/`); wire Banner Designer into Brand Board + the Opsette
>   Tools landing card; downgrade Icon Kit (remove its Social & Banners tab).
> - Reference designs to build toward: `icon-kit/brand-showcase/src/routes/index.tsx`
>   (the 8 Lovable banners — read for composition technique, then rebuild in Ant/CSS).

## How we got here (so the build agent doesn't relitigate it)
Icon Kit's banner builder produced bland, "blocked-in" banners: every element in
its own safe rectangle, one texture picked from a dropdown, layouts that were just
positional toggles (centered / logo-top / split) with no point of view. Ruthnie's
verdict: *"the layouts don't say anything."* Correct.

We proved the vision is reachable with a Lovable **taste probe** — 8 static banner
mockups in Ruthnie's brand palette (forest green + gold) with her real client's
content (Providence Care Plus, a functional-medicine FNP-BC practice). Ruthnie's
reaction: Promotion + CTA "way, way better, this is what I'm looking for";
Color-blocked + Editorial "gorgeous"; all 8 "look like we could do them." **They are
all achievable.** The Lovable code lives at `icon-kit/brand-showcase/` for
reference (a static, hardcoded showcase — NOT a head start; see below).

**The root cause of the old failure — a MODEL problem, not a tech/stack problem:**
the old model was "one background + text fields + ONE texture." Every Lovable banner
is instead a **composition of several freely-positioned, overlapping layers** (a
diagonal color split + a scrim + grain + a ghost-text layer, all at once). The old
single-`texture` dropdown literally cannot express a composition. That's the whole
fix. (Ruthnie diagnosed this exactly: *"I can't use keyframe and accent rules, I
can't mix different textures to construct what I want."*)

## What this tool IS
A standalone "Banner Designer": pick a **purpose-driven template** from a visual
gallery, fill **smart fields** that route to the right slot per template, layer
**multiple finishes** (multiselect, not one dropdown), tune accent color + fonts +
platform size, and export. Each template is a real designed composition.

## Stack (non-negotiable — matches Ruthnie's house rules)
- **Vite + React + TypeScript SPA** (Opsette Tools are SPA-only — NEVER TanStack.
  The Lovable repo is TanStack; do NOT carry its router/server files.)
- **Ant Design** for ALL UI chrome (the editor panel, pickers, inputs, buttons,
  layout shell). No raw Tailwind primitives. Must look enterprise-grade.
- **Banner render = positioned HTML/CSS/SVG composition**, NOT canvas draw calls.
  This is the key architectural change: `position:absolute` layers, `clipPath`,
  CSS gradients, blend modes, `background-clip:text`. Overlap/layering is free in
  DOM and was the thing canvas made too tedious for the old agent to attempt.
- **Export = DOM-to-image** (`html-to-image` or `satori`). Photo-bearing banners →
  JPEG ~85% (a photo as PNG bloats — cf. the 34MB-PDF logo lesson); graphic-only →
  PNG. (Brand-board interop already flattens to a raster data-URL, so this fits.)
- GitHub-Pages apex-routes pattern: `base = "/<repo>/"`, NO CNAME, wired into the
  Opsette Tools landing like the other kit tools. Hardcode the build-time base
  (`command === "build" ? "/<slug>/" : "/"`), never `process.env`.

## THE THREE MODEL CHANGES (this is the heart of the rebuild)
Ruthnie called all three; they are requirements, not options.

### 1. Smart fields — placeholders that ROUTE, not tossed anywhere
Fields are content inputs; each TEMPLATE decides where each field lands and how it's
styled. The "$99" in the Lovable promo is NOT hardcoded — it's the **Offer** field,
and the Promotion template renders whatever's in Offer as its giant ghost-hero.
- Content fields (all optional unless a template marks one required):
  **brand/business name, eyebrow, headline, tagline, offer, CTA, logo (upload),
  background photo (upload), promo code, contact line, website.**
- Each template declares a **slot map**: which fields it uses, which is the hero,
  where each sits, how each is styled. A field the template doesn't use is hidden
  from the editor for that template (don't show an Offer input on the Editorial
  template). This is the "smart, not tossed anywhere" behavior.
- Field adaptation: a missing optional field makes the template **rebalance** — close
  the gap, never leave a hole or a lonely centered line.

### 2. Finishes/accents — MULTISELECT, not a single dropdown
The old single `texture` field is the bottleneck. Replace with a **composable finish
stack**: the user can layer several at once (the reason the Lovable banners look
designed). Finishes are drawn as ordered layers behind/around the content:
- **Diagonal color split** (`clipPath` polygon) — the signature move (CTA,
  Color-blocked).
- **Scrim** (gradient darkening behind text over a photo/field) — legibility.
- **Ghost-text layer** (oversized transparent+stroke or low-alpha word/number
  behind content, `mix-blend`) — the "$99" / "care" trick.
- **Seam-crossing gradient text** (`background-clip:text` split at the seam %).
- **Grain** (inline SVG `feTurbulence`, low alpha, `mix-blend-overlay`) — as a FINISH
  on top, never the whole texture.
- **Blurred accent blob** (radial gradient, big blur) — soft depth.
- **Keyline frame / thin rule / accent rule** — structure marks.
Each finish is tint-driven by the accent color. A template ships with a sensible
DEFAULT finish stack; the user can add/remove/reorder. (Some finishes conflict per
template — that's fine; the template's default stack is the safe starting point.)

### 3. Layouts — a VISUAL gallery picker, not text tabs
Replace "centered / logo-top / split" tabs with a **thumbnail gallery** the user
browses by PURPOSE. Selecting a template = choosing what the banner is FOR. Ant's
Card/Segmented/Radio-card patterns work; each thumbnail shows the composition, not a
word. (Ruthnie: a dropdown or visual selection, not tabs.)

## The template set (the 8 proven designs = the target)
Build these as PARAMETERIZED templates (each hardcoded Lovable banner → a slot-mapped
template driven by the fields + accent). Verify each on a real Facebook cover AND OG
card. Reference: `icon-kit/brand-showcase/src/routes/index.tsx` — read it for the
exact composition technique per banner, then rebuild in Ant/CSS, parameterized.
1. **Promotion** — Offer is the giant ghost-hero (the "$99"); radial-gradient bg,
   eyebrow top, name + detail bottom, promo code corner.
2. **Call to action** — deep base + `clipPath` diagonal sage panel right; CTA as a
   real pill button in the panel; headline with an accent-colored italic word;
   faint ghost word behind; grain finish.
3. **Credential** — **STRENGTHEN THIS ONE (Ruthnie: the weakest — right now it's
   basically our existing accent-rule).** Keep the name-big-with-credential idea, but
   give it real composition: make the credential read as a confident hero, not a line
   next to a rule. Add layering/overlap so it's clearly designed, not our old look.
4. **Brand story (photo-forward)** — layered gradient (or uploaded photo) + a real
   scrim behind an italic headline; secondary mark top-right.
5. **Logo-prominent** — dark radial bg + the logo/monogram as hero, with an offset
   low-alpha ghost copy behind it for depth.
6. **Typographic** — oversized 3-line headline, one word in an accent-colored heavy
   italic, thin top/bottom rules, corner meta.
7. **Color-blocked** — forest/gold `clipPath` diagonal split + headline crossing the
   seam via `background-clip:text` split at 50%. (Ruthnie: "gorgeous.")
8. **Editorial** — restrained: centered italic line between two hairline rules,
   corner meta, one accent dot. (Ruthnie: "gorgeous.")

## Reuse from Icon Kit (only what earns it) — leave the rest
- **Font-pairing data** (`shared-fonts.ts`) — copy the data (separate repos, no
  shared package; data is copied not imported, per existing pattern).
- **Contrast / mute / readable-text-color helpers** (`social-design.ts`) — the WCAG
  contrast math generalizes to new tiers; reuse, don't fork.
- **Brand-board interop blob shape** (`brand-kit.ts` — `SocialAsset`,
  `toSocialKitJson`) so exports still drop into the brand board. Flatten each banner
  DOM node to a raster data-URL for the board (photo → JPEG).
- Do NOT carry: the single-`texture` model, positional layouts, the canvas renderer,
  TanStack/router/server files, the Tailwind/shadcn UI.
- Icon Kit KEEPS logos + favicons. This tool is separate. (Optionally later: extract
  the old banner tab out of Icon Kit entirely once this replaces it.)

## Guardrails (house rules)
- No `Math.random()` — seed any noise (SVG `feTurbulence` seed) deterministically.
- Preview and export render the SAME DOM node — one source, so what you see exports.
- Globalize: accent color, finish definitions, template slot maps, type scale all
  read from ONE shared design source. No per-file hardcoded values.
- Mobile-first editor: the editor panel + gallery must be intentional at 375px (the
  banner preview can scroll/scale; the CONTROLS must be usable on a phone).
- Every human-facing word follows `CONTENT_STYLE_GUIDE.md`.

## Build-session shape
1. Scaffold the SPA (Vite + React + Ant, apex-routes base) + the brand-board blob
   interop. Wire the editor shell (Ant): field inputs, template gallery, finish
   multiselect, accent/font/size controls, preview pane, export.
2. Build the composition primitives (the finish layers in §2) as reusable components.
3. **Prove ONE template first (the gate):** build **Color-blocked** or **Promotion**
   (the two Ruthnie loved most) fully parameterized, render it on a real Facebook
   cover, and show Ruthnie real pixels before building the rest. Judge pixels, not a
   description.
4. Build the remaining templates against the 8-design target; STRENGTHEN Credential.
5. Wire export (DOM-to-image, JPEG for photo) + brand-board handoff.
6. Verify every template on Facebook cover AND OG card; check the editor at 375px.

## Explicitly REJECTED (Ruthnie evaluated and cut each — do not reintroduce)
- The old single-texture model and positional layout tabs. Replaced.
- Procedural grain/mesh/rays AS THE WHOLE TEXTURE. (Grain survives ONLY as a faint
  finish layer in a stack — never the main event.)
- SVG shape libraries (blobs, waves, hero-patterns, Haikei/Blobmaker). *"Nobody wants
  this crap on their background."*
- Ruthnie sourcing/pasting asset files; an icon-placement builder.
- Asking Lovable to re-emit a "transferable" version — it's welded to TanStack +
  Tailwind and can't produce the Ant SPA. Its job (prove designs + hand us the
  techniques) is done.
- Reducing the tool to "photo + scrim + text." Photo-forward is ONE template of 8.

## ✅ BUILD LOG — 2026-07-18 (the model rebuild landed)
The whole model rebuild is **built and verified in the running app** (screenshots
on Facebook cover + OG card, all 8 templates + the per-platform mix). Dev server
`npm run dev` → port 8126. `npx tsc --noEmit` clean.

**Shipped (new engine under `src/banner/`):**
- `model.ts` — smart fields (9 content fields + logo), the 7 finishes, platforms
  (FB cover, OG, LinkedIn, X), template ids, and the full `BannerState`.
- `finishes.tsx` — all 7 finish layers as composable, accent-tinted, deterministic
  CSS/DOM components (diagonal-split, scrim, ghost-text, seam-gradient headline
  treatment, grain [fixed feTurbulence seed — no Math.random], blur-blob, keyline)
  + `FinishStack` ordered renderer.
- `templates.tsx` + `template-kit.ts` — the 8 templates as slot-mapped, parameterized
  compositions (rebuilt from the Lovable reference), each with a default finish stack,
  per-finish config, base background, and the fields it routes. **Credential was
  strengthened** — the Offer field renders as a big gold italic credential hero next
  to the name, with a ghost copy behind + keyline, not the old "name next to a rule."
- `BannerCanvas.tsx` — ONE node for preview + export (renders at true platform px,
  scaled by CSS transform for preview → what you see is what exports).
- `export.ts` + `render-offscreen.ts` — DOM-to-image (`html-to-image`) with headless
  off-screen rendering + font pre-load; PNG default, JPEG hook wired for a future
  photo template.
- `BannerPanel.tsx` — the Ant editor: scrollable **template strip** at the top
  (Signature-Studio pattern, room to grow past 8), labeled smart fields (only the
  active template's), palette + font + per-platform finish stack, big preview +
  platform tabs + **"All sizes" filmstrip** (every platform's assigned template at a
  glance, click to focus).
- `state.ts` — reducer + hydrate (migrates the old single-template shape) + interop.

**Two model changes beyond the original spec, at Ruthnie's request (2026-07-18):**
1. **Per-platform templates + finishes.** `templates`/`platformFinishes` are now keyed
   by platform — a Promotion OG card next to a Color-blocked FB cover. Content, colors,
   fonts, logo stay shared (design-once). The "All sizes" filmstrip solves "which
   template did I put on which size?" — it shows all four assignments live.
2. **Content labels** above each input (no more bare input boxes).

**Finish correctness fix (2026-07-18, after Ruthnie tested):** she found some finishes
were dead toggles. Root cause: a finish only renders with the config the TEMPLATE
supplies, so (a) "Ghost word" did nothing on templates that didn't set `ghostText`,
and (b) "Seam gradient text" did nothing anywhere (Color-blocked had its seam hardcoded;
no template passed the seam props). Fixed: ghost-text now falls back to the brand's first
word (`FinishPalette.brandWord`) so it renders on any template; Color-blocked's headline
now reads `ctx.seam` (seam ON = 50/50 clip, OFF = plain accent headline — a real toggle);
and each template only OFFERS the finishes it can express (`applicableFinishesFor` →
`UNIVERSAL_FINISHES` for most, seam-gradient only on Color-blocked). No dead toggles now.

**Interop preserved:** still emits the frozen `type:"social"` blob (Brand Board reads
`data.assets[]`; reopen reads `data.configs.social`), so Export-to-Brand-Board, ?seed=,
and the iframe embed-save all still work. Verified: reopening an old kit pulls in colors.
Old Icon Kit canvas/social files were DELETED (canvas.ts, SocialPanel, social-controls,
etc.) per "don't carry the old model."

**Still deferred (NOT this session — tracked):**
- Brand Board needs a **separate storage slot for Banner Designer** (today it shares
  Icon Kit's single social slot — the paste works but overwrites). Ruthnie's follow-up.
- Separate session to **clean up Icon Kit** (remove its Social & Banners tab).
- Publish tasks unchanged: push `banner-designer` public repo, Actions deploy
  (base `/banner-designer/`), wire into Brand Board + the Opsette Tools landing card.
- Mobile check at 375px (editor stacks preview-first via `.banner-split` order rules;
  eyeball on a real phone).
