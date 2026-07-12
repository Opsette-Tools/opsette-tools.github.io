# File Builder — Build Plan (breakout sessions)

**Owner:** Ruthnie / Opsette Tools
**Created:** 2026-07-11
**Status:** Planning doc. Take into a fresh build session. This was "Zip Builder" in `FIVERR-KIT-BUILD-PLAN.md` (Session 6) — renamed **File Builder** and expanded. It unblocks Fiverr delivery (the ZIP) AND grows into a general file utility (the converter).

> **Name/slug DECIDED (2026-07-11):** the product, folder, repo, and slug are all **`file-builder`**. Ruthnie renamed the folder — no friction, the repo didn't exist yet. Route `tools.opsette.io/file-builder/`, base `command === "build" ? "/file-builder/" : "/"`, dev port **8125**. (The old `zip-builder` name is retired.)

---

## What this tool is (and isn't)

**File Builder is a browser-only file workshop with two jobs:**

1. **PACKAGE (Phase 1 — build this first, it unblocks Fiverr):** collect the finished brand-kit assets from Ruthnie's file system into a pre-labeled kit folder structure, tier-aware, and download **one Opsette-branded `.zip`**. This is the delivery tool the Fiverr gig needs before it can be published.

2. **PREPARE / CONVERT (Phase 2 — same app, new mode, build if there's weekend time):** a small-PDF-style utility — image compress, image convert (PNG↔JPG↔WebP), image resize, images→PDF, PDF→images. Batch, drag-drop, download. General-purpose, not kit-specific.

**Same app, not two apps.** Phase 1 already contains a lightweight per-file "prepare" step (resize/convert/compress an image as it enters a slot). Phase 2 just promotes that step into its own full-screen mode/route. One tool that grows — the durable architecture, per Ruthnie's "choose the better long-term way" rule.

### Explicit scope calls (decided with Ruthnie 2026-07-11)

- **PDF *re*-compression of arbitrary PDFs = OUT of scope.** True small-PDF-style PDF shrinking needs Ghostscript-class tooling that doesn't run reliably client-side. Do NOT promise it.
- **PDF shrink of *our own image-heavy exports* = IN scope, and it's the case Ruthnie actually hits.** Brand Board / Startup Planner PDFs bloat because they embed a full-res image (see memory `project_pdf_logo_optimization` — a 435KB logo → 34MB PDF). That's fixable in-browser: open the PDF with `pdf-lib`, re-encode/rebuild embedded images at sane resolution, re-save. Frame this feature honestly as **"Shrink an image-heavy PDF"**, not "compress any PDF."
- **No backend, ever, for this.** Client-side, localStorage, GitHub Pages — same as every other Opsette tool. Everything below runs in the browser.
- **No direct live coupling to Brand Board.** Ruthnie's real workflow: export/download each asset from each tool into a per-client folder on her own machine, then File Builder pulls from there via manual upload. The `.opsette-kit.json` ingest (below) is a *convenience accelerant*, not a dependency.

---

## The SHELL — Smallpdf-shaped, not "controls slapped on a page" (Ruthnie's directive, 2026-07-11)

Ruthnie shared Smallpdf screenshots and wants File Builder to feel like a **real product**, not a bare single-page form like some sibling tools. This is a first-class requirement — build the shell FIRST, before any mode logic, so nothing is retrofitted.

**Three-zone Smallpdf layout:**

```
┌──────────────────────────────────────────────────────────────┐
│  [Opsette shared header — chrome only, spans top]             │
├──────┬───────────────────────────────────────┬───────────────┤
│ ICON │                                       │  CONTROL      │
│ RAIL │        BIG WIDE CENTER CANVAS         │  PANEL        │
│      │   (upload drop-zone / file preview)   │  (options for │
│ mode │                                       │   the active  │
│ mode │   huge, inviting, the hero of the UI  │   mode; empty │
│ mode │                                       │   until a file│
│ ...  │                                       │   is loaded)  │
└──────┴───────────────────────────────────────┴───────────────┘
```

- **Left icon rail** = the mode switcher (Smallpdf's Compress / Convert / Organize / … column). Ant `Layout.Sider` (narrow, collapsible on mobile → top bar or drawer). Each mode is an icon + label. **This is the tile system that lets the suite grow** — a new mode is a new rail entry, never a layout change.
- **Center canvas** = the big wide upload space Ruthnie loves. Empty state: large cloud-upload affordance, "Select files" primary button, a dropdown for source (device now; Drive/Dropbox are future, don't build yet), and a "Supported formats:" chip row. Loaded state: file thumbnail(s) / preview, filename + size. Full-bleed, generous whitespace — the hero.
- **Right control panel** = per-mode options. For Compress: the **tiered radio list** (Basic / Moderate / Strong) with a **live "Estimated new file size ~29 kB (-47%)" readout + bar** BEFORE committing — Ruthnie specifically liked this; it's the "not bare minimum" detail. A primary action button ("Compress →"). After processing: a **Done panel** — before→after size ("106 kB → 26 kB, 75% smaller"), Download (+ dropdown), Export As, and an **"Or continue in →" list** linking to other modes (Merge, Convert, …) — the cross-mode flow that makes it feel like a suite.

**Build the shell on Ant Design.** Brand Board (the newest sibling) already ships `antd` 5.21 + `@ant-design/icons` — so an Ant `Layout`/`Sider`/`Menu` shell is the *established family precedent*, not a departure. Keep the **shared Opsette header** on top (chrome only) and put the Sider + canvas + control panel below it. (Correction to the earlier draft of this plan: it said "match the shadcn siblings" — wrong for THIS tool. File Builder follows Brand Board's Ant stack.)

**Mode-driven architecture:** one `Mode` type drives the rail, the canvas empty-state copy (accepted formats), and which control-panel component renders. Adding a mode = add a `Mode` entry + its control-panel component. Globalize, don't hardcode (Ruthnie's standing rule) — the rail, accepted-format chips, and How-To all read from the mode registry.

## Mode roadmap — "the works, eventually," built honestly

Ruthnie wants the full Smallpdf-class suite over time ("I want the works when I get to the other file stuff… not the bare minimum"). Here's the honest split so the build session knows what's a real weekend mode vs. what needs a service later. **Do NOT ship a mode that fakes it** — a mode that quietly does nothing useful is worse than not having it.

| Mode | Client-side? | When | Notes |
|---|---|---|---|
| **Package / Build ZIP** (kit) | ✅ | Phase 1 | The Fiverr-unblocking mode. `jszip`. Rail's flagship. |
| **Compress images** | ✅ | Phase 1/2 | Canvas re-encode. Tiered Basic/Moderate/Strong = quality presets, live size estimate. |
| **Convert images** (PNG↔JPG↔WebP) | ✅ | Phase 2 | Canvas `toBlob`. |
| **Resize images** | ✅ | Phase 2 | Canvas; presets 1080/512/32. |
| **Images → PDF** | ✅ | Phase 2 | `jsPDF`. |
| **PDF → images** | ✅ | Phase 2 | `pdf.js` render pages → PNG (zipped). |
| **Shrink image-heavy PDF** | ⚠️ bounded | Phase 2 | `pdf-lib` re-embed images downscaled. Honest label — OUR exports/photo-PDFs, not scanned docs. |
| **Organize** (merge / split / extract / delete / rotate pages) | ✅ | Phase 3 | `pdf-lib` — all structural, all genuinely client-side. A whole rich mode. |
| **PDF → Word/Excel/PowerPoint** | ❌ needs service | Later / maybe | Heavy engine, server-side even for Smallpdf. Don't fake it. |
| **OCR** | ❌ needs service | Later / maybe | `tesseract.js` is possible but heavy/slow; treat as a real research task, not a weekend add. |
| **Sign / Annotate / Edit / AI PDF** | — varies | Later | Sign/annotate are doable with `pdf-lib` eventually; scope when reached. |
| Drive / Dropbox import | ❌ (needs OAuth) | Later | Smallpdf has it; we start with device upload only. |

The takeaway for the builder: **the shell must look and behave like the full suite from day one (rail + wide canvas + control panel + "continue in" cross-links), populated with the modes we can do WELL.** Empty rail slots for future modes are fine as "coming soon," but never a live mode that doesn't deliver.

---

## Feasibility (what's browser-only — the honest table)

| Capability | Phase | Browser-only? | How |
|---|---|---|---|
| ZIP assembly | 1 | ✅ Yes | `jszip` (`fflate` if bundle size matters) |
| Branded folder structure + rename | 1 | ✅ Yes | build the tree in-memory, name files on add |
| Image resize | 1 (prepare) / 2 | ✅ Yes | Canvas: draw at target dims → `toBlob` |
| Image convert PNG↔JPG↔WebP | 1 (prepare) / 2 | ✅ Yes | Canvas `toBlob(type, quality)` |
| Image compress | 1 (prepare) / 2 | ✅ Yes | Canvas re-encode at quality, or `browser-image-compression` |
| Images → PDF | 2 | ✅ Yes | `jsPDF` (already used in the family) |
| PDF → images | 2 | ✅ Yes | `pdf.js` render each page to canvas → PNG |
| **Shrink OUR image-heavy PDF** | 2 | ⚠️ Doable | `pdf-lib` re-embed images downscaled. Honest, bounded. |
| Compress ARBITRARY PDF | — | ❌ Out | Needs Ghostscript-class tooling. Not client-side. Don't build. |

---

## PHASE 1 — the ZIP packager (unblocks Fiverr) · BUILD FIRST

### The target folder structure (from `FIVERR-BUSINESS-STARTER-KIT.md`)

```
YourBrand_Kit_OpsetteCo/
├── Brand_Board.pdf
├── Color_Palette.pdf
├── Font_Pairing.pdf
├── Email_Signature/
│   ├── signature.html
│   └── signature_preview.png
├── Icons/
│   ├── favicon.ico
│   ├── favicon_32x32.png
│   └── profile_1080x1080.png
├── Social_Banner/          ← premium tier only
│   ├── linkedin_banner.png
│   └── facebook_cover.png
├── QR_Code.png
└── How_To_Use.pdf
```

### The UI model: labeled slots, not a flat file pile

Build a **slot manifest** — a typed config describing every file/folder the kit expects. The UI renders one drop-zone per slot from that manifest. This is the "globalize, don't hardcode" rule: the folder structure lives in ONE config, the UI reads it, and Phase-2/tier changes edit the config, not the layout.

```ts
// src/lib/kit-manifest.ts
interface KitSlot {
  id: string;                 // "brand_board"
  label: string;              // "Brand Board (PDF)"
  path: string;               // "Brand_Board.pdf"  — where it lands in the zip
  folder?: string;            // "Email_Signature"  — optional subfolder
  accept: string[];           // [".pdf"] | [".png",".jpg"] | [".html"]
  tier: "basic" | "standard" | "premium"; // min tier that includes this slot
  multiple?: boolean;         // Icons/Social accept several files
  required?: boolean;         // warn (don't block) if empty at zip time
  autoRename?: string;        // canonical output name, e.g. "linkedin_banner.png"
}
```

- **Tier toggle** (Segmented: Basic / Standard / Premium) filters which slots show. Premium reveals `Social_Banner/`. Basic per the pricing table = Signature + Digital Card + QR only. Match the tiers in `FIVERR-BUSINESS-STARTER-KIT.md` (verify against the live gig draft — the doc has two pricing tables; the **gig draft** ($35/$65/$95) is authoritative over the older ($25/$45/$65) table).
- **Auto-rename on drop:** a file dragged into the "LinkedIn banner" slot becomes `linkedin_banner.png` in the zip regardless of its source name. Clean, consistent client deliverables. This is the "rename cleanly" ask from the original plan.
- **Brand-name field** → drives the root folder name `{Brand}_Kit_OpsetteCo/` (sanitize to filesystem-safe).
- **Required-but-empty = warn, never block.** Show a yellow "you're missing X" summary before zipping; let her zip anyway (she may deliberately omit a slot).

### Auto-included, non-uploaded files

- **`How_To_Use.pdf`** — the anti-refund doc. Ships in EVERY kit. Two options, pick in-session:
  - (a) a static `How_To_Use.pdf` in `public/` added to the zip verbatim (fastest), or
  - (b) generated from an HTML template via jsPDF so brand name / tier can be interpolated (nicer, more work). **Recommend (a) for Phase 1**, upgrade to (b) later. Content mentions `tools.opsette.io` organically (the visibility play in the business doc).
- All files + the zip itself carry Opsette branding (folder name suffix `_OpsetteCo`, the How-To footer).

### `.opsette-kit.json` ingest (the accelerant — build after the manual skeleton works)

Ruthnie already built the whole interop system. A Brand Board **Project File** (`.opsette-kit.json`) holds every consumed blob as data URLs (QR image, signature HTML, palette, social assets, logo). So:

- Add an **"Import a kit project file"** button. Drop a `.opsette-kit.json` → parse it → auto-populate the matching slots from its blobs:
  - `sourceBlobs.qr.data.image` → `QR_Code.png` (decode data URL → blob)
  - `sourceBlobs.signature.data.html` → `signature.html`; if a `signature_preview` image exists, → `signature_preview.png`
  - `sourceBlobs.social.data.assets[]` → `Social_Banner/` + `Icons/` (route by `kind`: banner→Social, favicon/avatar/icon→Icons)
  - logo / palette → whatever slots apply
- **Manual upload stays the fallback** for the PDFs that live OUTSIDE the blob system (Brand_Board.pdf, Color_Palette.pdf, Font_Pairing.pdf — these are downloads, not blobs). So the flow is: import the kit file to fill most slots automatically, then drag the 2–3 PDFs in by hand.
- Read the exact shapes from `docs/BRAND-KIT-INTEROP-CONTRACT.md` and Brand Board's `board/projectFile.ts` / `sourceBlobs` model. Be tolerant (enveloped or bare), never throw on junk, return null and show a friendly "that's not a kit file."

### The lightweight prepare step (this is what makes Phase 2 native)

On each image slot, a small **"prepare"** affordance (resize / convert / compress) before it's added. Build these as **pure helpers in `src/lib/image-ops.ts`** — the SAME functions Phase 2's converter mode will import. Don't inline Canvas code into components.

```ts
// src/lib/image-ops.ts  (shared by Phase 1 slots AND Phase 2 converter)
resizeImage(file: Blob, opts: { maxW?: number; maxH?: number; fit?: "contain"|"cover" }): Promise<Blob>
convertImage(file: Blob, to: "image/png"|"image/jpeg"|"image/webp", quality?: number): Promise<Blob>
compressImage(file: Blob, opts: { quality: number; maxW?: number }): Promise<Blob>  // convert+resize combo
```

Slots that auto-rename to a fixed size (e.g. `profile_1080x1080.png`, `favicon_32x32.png`) can auto-run `resizeImage` on drop so the deliverable is always spec-correct.

### Output

- **"Download kit ZIP"** → builds the tree with `jszip`, names root `{Brand}_Kit_OpsetteCo`, downloads.
- Keep the assembled state in **localStorage** (draft) so a reload mid-assembly doesn't wipe her work — same pattern as Icon Kit's `usePersistentReducer`.

---

## PHASE 2 — the converter mode (build if weekend time; Ruthnie may need it)

**Why it's real, not hypothetical:** Ruthnie hit exactly this — her Startup Planner exported a too-large PDF and she had to use smallpdf.com. Brand Board also exports PDFs. If our own PDFs bloat, she wants to fix them in our tool, not a competitor's.

A separate **"Convert" mode/route** (Segmented tab or `/convert` route — decide in-session; a mode toggle is simplest for an SPA). Batch drag-drop in, operation picker, download each or download-all-as-zip (reuses Phase 1's jszip).

Operations (all from `src/lib/image-ops.ts` + two PDF helpers):
- **Compress images** — quality slider, live before/after size readout.
- **Convert images** — target format dropdown.
- **Resize images** — max width/height, presets (1080, 512, 32…).
- **Images → PDF** — `jsPDF`; order the pages, one image per page or fit-multiple.
- **PDF → images** — `pdf.js`, one PNG per page, zipped.
- **Shrink an image-heavy PDF** — `pdf-lib`: open, find embedded images, re-encode downscaled, re-save. **Label it honestly** ("shrinks PDFs that are large because of big embedded images — our exports, photos; not scanned documents"). Show before/after size. If it can't meaningfully shrink, say so rather than pretending.

Everything client-side. No uploads leave the browser — a genuine privacy selling point vs. smallpdf (worth a line in the How-To / landing copy later).

---

## Naming & the folder — DECIDED

- **Product name / slug / folder / repo:** all **`file-builder`**. Ruthnie renamed the folder on 2026-07-11 (no friction — the repo didn't exist yet). Header title, `<title>`, manifest `name`, og-image, landing card all say "File Builder." Route `tools.opsette.io/file-builder/`. Nothing points at the retired `zip-builder` name.

---

## Scaffold conventions (every Opsette Tool honors these)

- **SPA-only Vite build**, never TanStack (memory `project_no_tanstack_spa_only`). Convert/scaffold to plain Vite SPA in-workspace.
- **Hardcoded build-time base** (memory `feedback_vite_base_pattern`): `base: command === "build" ? "/file-builder/" : "/"` (or `/zip-builder/` if slug kept). **Never** `process.env.VITE_BASE`.
- **Dev port: 8125** (8124 = brand-board is the last taken; 8125 is next free). Add the row to `DEV_SERVERS.md`.
- **Head + manifest per the canonical spec** — `HEAD_AND_MANIFEST.md` is the source of truth (memory `feedback_head_manifest_spec`). Follow it exactly for `<head>`, favicons, manifest, og-image.
- **Branding** per `ICONS_AND_BRANDING.md` — Phosphor brand-icon generator. Suggested brand icon: **`package`** or **`file-zip`** / **`archive`** (pick one that isn't already used by a sibling; `package` fits "assemble a kit"). Rendered in header + as the app icon.
- **Dark-mode pattern** — `--ops-header-accent` variable + `html.dark` / `data-theme=dark` dual cascade + `use-theme` hook (memory `project_dark_mode_pattern`).
- **Header is chrome only** (memory `feedback_header_chrome_only`) — the shared Opsette header stays chrome. The mode rail, tier toggle, and control panels live BELOW it in the Sider/canvas/panel layout, NOT in the header's `rightExtra`.
- **Context-safe `uuid()` helper** — `crypto.randomUUID` breaks on phone-over-http (memory `project_crypto_uuid_secure_context`). Copy the family's `uuid.ts`.
- **Typecheck with `tsc -b`, NOT `tsc --noEmit`** — the root tsconfig has `"files": []`; `--noEmit` is a false green (memory `project_opsette_tools_typecheck_command`).
- **UI: Ant Design** (per the SHELL section) — File Builder follows **Brand Board**, the newest sibling, which ships `antd` 5.21 + `@ant-design/icons`. Use Ant `Layout`/`Sider`/`Menu`/`Segmented`/`Upload`/`Radio` for the Smallpdf-shaped shell. (Some OLDER siblings like QR Creator are Lovable shadcn/Tailwind — do NOT follow those here; Ant is right for a sidebar-suite app and is the established precedent in Brand Board. Read Brand Board's shell first.)
- **Mobile-first, deliberately** — the Sider collapses to a top mode-bar or drawer on phone; the wide canvas stays the hero; the control panel drops below the canvas. Slots/tiers stack to a single column. Design it, don't retrofit.
- Reuse the small-logo-in-export lesson for any generated PDF (How-To) — embed a right-sized logo, never full-res (memory `project_pdf_logo_optimization`).

---

## GitHub / deploy (apex + routes pattern)

- Push to Ruthnie's **personal** org/account (identity `deebuilt`, never the work account). Apex is `opsette-tools.github.io`.
- New project repo: **NO CNAME file, NO custom domain in its Pages settings** (that would hijack the subdomain). Deploy via GitHub Actions. Route: `tools.opsette.io/file-builder/`.
- After it builds + deploys: **add a File Builder card to the apex landing page** in `opsette-tools.github.io`.
- (Ruthnie typically does the Actions + Pages toggle herself after the repo is pushed — same as Brand Board.)

---

## Build order for the session (recommended)

1. **Scaffold** `file-builder` to family conventions — SPA Vite, base `/file-builder/`, **port 8125** (add to `DEV_SERVERS.md`), head/manifest per spec, brand icon (`package`), shared Opsette header/theme/logo/uuid copied from Brand Board, Ant Design installed. `tsc -b` clean, live on :8125.
2. **THE SHELL FIRST** — Ant `Layout` + `Sider` (mode rail) + big wide center canvas (upload empty-state / preview) + right control panel. A `Mode` registry drives all three. Get the empty Smallpdf-shaped frame looking right (one or two placeholder modes) before wiring logic. This is Ruthnie's explicit "real product, not slapped on a page" bar — nail it early.
3. **Package mode** (the Fiverr flagship): slot manifest + tier toggle + manual drop-zones in the canvas, control panel shows the kit checklist. Auto-rename on drop, brand-name → root folder.
4. **`image-ops.ts` helpers** + the per-slot prepare step (resize/convert/compress). Auto-size the fixed-dimension slots.
5. **How_To_Use.pdf** auto-included (static file first).
6. **"Download kit ZIP"** with `jszip` + localStorage draft persistence. ← Phase 1 shippable here; this unblocks Fiverr.
7. **`.opsette-kit.json` import** → auto-populate slots from Brand Board project-file blobs. Manual fallback stays.
8. **(If time) Compress/Convert modes** — reuse `image-ops.ts`; Compress gets the tiered Basic/Moderate/Strong panel + live size estimate + before→after Done panel. Then add `pdf.js` (PDF→images) + `jsPDF` (images→PDF) + `pdf-lib` (shrink image-heavy PDF). Each is a new rail entry.
9. **(Later) Organize mode** — `pdf-lib` merge/split/extract/delete/rotate. Not weekend-critical; the rail is ready for it.

Verify each step in the running app before moving on (Ruthnie verifies, then approves the build/commit). Don't run the full production build until she says "go." Append a dated progress entry to THIS doc as you go.

---

## Conventions every session must honor (quick ref)
- Opsette head/manifest spec canonical (`HEAD_AND_MANIFEST.md`).
- SPA-only, never TanStack. Hardcoded build-time base per slug. Never `process.env.VITE_BASE`.
- Phosphor brand-icon generator; dark-mode `--ops-header-accent` + `html.dark`/`data-theme=dark`; header is chrome only.
- Context-safe `uuid()`. Typecheck with `tsc -b`. Small right-sized logo in any PDF export.
- Confirm before bulk-changing sibling apps. **UI stack = Ant Design**, following Brand Board (the newest sibling), for the Smallpdf-shaped `Layout`/`Sider` shell.

---

## Progress — 2026-07-11 (Session 1: scaffold + shell + Package mode)

**Shipped (steps 1–3 of the build order, plus the Package mode structure). `tsc -b` clean. Awaiting Ruthnie's verify on :8125.**

**Scaffold (step 1) — DONE.** Copied the Brand Board tree wholesale (the canonical Ant sibling: header, share, theme, PdfPreviewPane, uuid, haptics, logo, favicons, PWA config all correct) and stripped the board-specific pieces. Rewired everything to File Builder:
- `package.json` name → `file-builder`; removed `qrcode`/`html-to-image`, added `jszip@^3.10.1`.
- `vite.config.ts` → `base: command === "build" ? "/file-builder/" : "/"`, port **8125**.
- `index.html` + `manifest.webmanifest` → File Builder title/description/og. `theme.tsx` storage key → `file-builder-theme`. `main.tsx` → `FileBuilderApp` + `file-builder-draft` seed key. Header/share configs → "File Builder". About/Privacy copy rewritten for the file-workshop framing.
- Added `DEV_SERVERS.md` row (8125 · file-builder).
- **NOTE:** brand icon is still the Brand Board favicon set (copied). The Phosphor `package` brand-icon regen per `ICONS_AND_BRANDING.md` is NOT done yet — favicons/og-image are placeholders. **Left for a follow-up** (needs the Phosphor generator run). Flagging so it isn't mistaken for shipped.

**The SHELL (step 2) — DONE, Smallpdf-shaped, full-bleed.** Built to Ruthnie's screenshots:
- `src/lib/modes.tsx` — the **Mode registry** (single source of truth). Each `ModeDef` = id, label, blurb, icon, accent color, accepted formats, `ready` flag, and its `Canvas` + `Panel` components. Rail, canvas empty-state, and panel all read from this. Adding a mode = one entry + two components, never a layout change.
- `src/components/shell/AppShell.tsx` + `shell.css` — the three-zone frame: left **mode rail** (dark navy, icon-over-label, active tile tinted with the mode's accent, "soon" tag on not-ready modes), **full-bleed center canvas** (NO max-width container — Ruthnie's explicit "use the whole page" directive), **380px right control panel**. Mobile (≤900px): rail → sticky horizontal top bar, panel drops below the canvas. Theme via `[data-fb-theme]` → one `--fb-*` variable cascade for light/dark.
- Shared canvas/panel primitives: `DropZone.tsx` (big cloud-upload hero) + `PanelHeader.tsx` (colored mode tile). Globalized so every mode reuses them.
- Rail modes: **Package** (ready) + Compress / Convert / Resize / Images→PDF (all "coming soon" via the honest `ComingSoon` placeholder — never a live mode that fakes it, per the plan).

**Package mode (step 3, the Fiverr flagship) — DONE (manual-upload path).**
- `kit-manifest.ts` — the typed **slot manifest** (`KitSlot[]`), tier ranks, `slotsForTier()`, `sanitizeBrand()`. Folder structure + tiers per the plan. Change the kit here, one place.
- `PackageContext.tsx` — shared Package state (tier, brand, per-slot files, filled/missing/total derived) so the mode's Canvas and Panel (separate shell regions) share one source.
- `SlotCard.tsx` — one labeled slot: drop/click, staged-file list w/ size + remove, add-more/replace, filled check. Grid auto-fills the full-bleed canvas.
- `PackageMode.tsx` — `PackageCanvas` (tier Segmented + slot grid) and `PackagePanel` (brand-name → live `{Brand}_Kit_OpsetteCo/` folder preview, kit checklist progress bar, recommended-but-empty warn-don't-block Alert, **Download kit ZIP**).
- `buildZip.ts` — `jszip` assembly: canonical rename per slot, subfolders, root `{Brand}_Kit_OpsetteCo`, multi-file suffixing, source-extension preservation, and auto-includes `public/How_To_Use.pdf` **if present** (not added yet — see below).

### ⚠️ PIVOT — 2026-07-11 (same session): Package is now an AGNOSTIC bundler, not a kit jig

Ruthnie reviewed the first Package build and correctly flagged it as **too niche**. The fixed 7-slot brand-kit manifest ("Brand Board goes here, QR there") is a private jig for HER Fiverr workflow — but File Builder is a **public tool**. A stranger landing on "Build the kit → Brand Board (PDF)" would bounce. This is exactly the domain-scoping I should catch, not ship. Also: **Brand Board now exports 3 pages, not 1**, so a hardcoded single `Brand_Board.pdf` slot was already stale — more proof the kit shape isn't stable enough to hardcode.

**The corrected model (built + verified, tsc clean):** Package is a **generic ZIP bundler**.
- **Canvas empty state** = one big DropZone, "Drop files to bundle", accepts ANY file type, any count.
- **Loaded state** = an editable file list. Each row (`BundleRow.tsx`): a colored **type badge** (auto-detected — PDF/PNG/HTML/… via `fileType.ts`), an **editable output name**, an **optional Folder field** (AutoComplete that suggests folders already in use; empty = zip root), size, remove. Toolbar: Add files / Clear. The whole list is a drop target.
- **Panel** = editable **ZIP file name** (live `→ name.zip` preview via `normalizeZipName`), a summary (files / at-root / total size), **folder chips** showing the folders in the zip, and **Download ZIP**.
- **`buildZip.ts` rewritten** path-driven: each item's zip path is `{folder}/{name}` or just `{name}` at root. Folders are real (a "/" in the path nests on unzip). Safe-segments names/folders, de-collides duplicate paths with numeric suffixes. No kit logic at all.
- **Folders decision (with Ruthnie):** flat-by-default, folder optional per file. Confirmed the mechanical fact — a ZIP folder is real on unzip, driven purely by the path. Folders earn their place for grouped assets (Email signature HTML + its preview PNG; social images); a lone PDF/QR just sits at root. So: user's choice per file, never forced.
- **Removed:** `kit-manifest.ts`, `SlotCard.tsx` (obsolete). **Added:** `fileType.ts`, `BundleRow.tsx`. Rail label changed **"Package" → "Bundle"**.

**Real-asset corrections Ruthnie gave (for the FUTURE optional "Opsette kit quick-fill", NOT hardcoded now):** Font pairing is NOT its own export (it lives in Palette Studio). "Icons/favicons" is really her **social assets**. **Digital Card** belongs in the kit (deferred tool). Brand Board = **3 pages**. When the `.opsette-kit.json` quick-fill is built, it pre-fills the generic list as an accelerant — it must never re-introduce fixed slots or kit-only framing.

**Dependency note / lesson:** briefly deleted `qrcode` from package.json during scaffold without checking usage — the shared ShareAppModal renders a share-QR with it, so the app went blank (Vite couldn't resolve the import; tsc passed on cached types). Restored `qrcode`. Lesson logged: grep for a dependency's usages before trimming it.

---

## Progress — 2026-07-11 (Session 1, part 3): shell polish + brand assets + DEPLOY

**Shipped this part — verified in the running app (headless screenshots) + `tsc -b`/`npm run build` clean:**
- **Rail pinned to the header, full-height.** Restructured the shell so the app locks to `100vh` and the document body never scrolls (`Shell.tsx` Layout `height:100vh; overflow:hidden`); only the canvas + panel scroll internally. Layout is now `[rail | center-column (canvas + footer) | panel]` — BOTH the rail and the panel run floor-to-ceiling, and the footer tucks under the canvas only, so there's no gap/short edge on either side. (Took a few iterations with Ruthnie eyeballing it; the earlier `min-height`/sticky attempts left a gap she caught.)
- **Rail recolored** to Opsette green `#2f4f46` (light) / green-charcoal `#16241f` (dark) — was a borrowed Smallpdf navy.
- **IndexedDB persistence — DONE and Ruthnie-verified** (drop → refresh → files return). `src/lib/idb.ts` (tiny promise KV over IndexedDB); `PackageContext` hydrates on mount + debounced-saves. `File` blobs round-trip natively (structured clone) — the reason it's IndexedDB, not localStorage, exactly as flagged.
- **Brand assets generated** via the shared pipeline (`_shared/brand-icons`): added `file-builder` → Phosphor **`package`** icon to `generate.mjs`, ran it (favicon.svg/.ico, icon-192/512), and ran `generate-og.mjs` for the 1200×630 OG card (green canvas, gold package, "Bundle any files into one clean ZIP. / Compress, convert, resize — in your browser."). Copied all into `public/`, replacing the Brand Board placeholders. **The scaffold-note placeholder concern is now RESOLVED.**
- **Deploy wiring:** `.github/workflows/deploy.yml` (mirrors brand-board — Pages via Actions, node 24, `npm ci && npm run build`, upload `dist`). `.gitignore` added. **No CNAME** (apex+routes rule honored). Prod build confirmed: base `/file-builder/`, OG URL correct, 823kB/265kB-gz bundle (antd+jspdf+jszip, same as every Ant sibling — fine).
- **Committed + pushed** on the **`deebuilt`** identity (verified repo-scope user = deebuilt / ruthnie@deebuilt.co; NOT the work account). Repo created: **https://github.com/deebuilt/file-builder** (public). First commit `490fcc8`, subject verified (not `@`/empty).
- **Apex landing card** for File Builder added to `opsette-tools.github.io/index.html` (utility category, green accent, `images/file-builder-icon.svg` copied) — **staged locally, NOT committed/pushed yet** (will push once the live deploy is confirmed so the card never points at a 404).

**HANDOFF (in progress):** Ruthnie enables Pages → Source: **GitHub Actions** at github.com/deebuilt/file-builder/settings/pages (NO custom domain — inherits tools.opsette.io). Then: confirm the Actions deploy, verify https://tools.opsette.io/file-builder/, and commit+push the apex card.

---

## ⭐ NEXT SESSION — START HERE: the "Load an Opsette kit" quick-fill (Ruthnie's most-wanted)

Ruthnie flagged this as the feature she wants next and doesn't want to forget. It's the payoff of the whole interop system: **one button — "Load an Opsette kit" — that pre-fills the bundler's file list from a single `.opsette-kit.json`**, so she never has to export/import every asset separately. Drop the kit file → the generic rows populate automatically (decode blobs → rows with sensible default names + folders like `Email_Signature/`, `Social_Banner/`). Layered ON TOP of the agnostic bundler — it just seeds the same file list; it must NOT re-introduce fixed slots or kit-only framing. Read shapes from `docs/BRAND-KIT-INTEROP-CONTRACT.md` + Brand Board's `projectFile.ts`/`sourceBlobs`. Fold in the real-asset corrections: **Brand Board = 3 pages**, "icons" are really **social assets**, **Digital Card** belongs in the kit, **no font-pairing export** (it lives in Palette Studio). Be tolerant (enveloped or bare), never throw on junk.

## Other work LEFT (after the quick-fill):
- **Per-file "prepare" affordance (optional)** — resize/convert/compress on an image ROW before zipping, from shared `image-ops.ts` (the same helpers the Compress/Convert modes will use).
- **Phase 2 Compress/Convert/Resize/PDF modes** — the "coming soon" rail entries. **PdfPreviewPane is already in the tree**; wire it into the first PDF-producing mode (Images→PDF or Shrink-PDF). Deliberately unwired for now (nothing produces a PDF yet).
- **Copy pass** — About/Privacy/share tagline are already broadened to the bundler framing; double-check nothing still says "brand kit."
