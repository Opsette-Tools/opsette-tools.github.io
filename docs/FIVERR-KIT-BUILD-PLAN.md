# Fiverr Brand Starter Kit — Tool Build Plan (breakout sessions)

**Owner:** Ruthnie / Opsette Tools
**Created:** 2026-07-11
**Status:** Gig is built and saved as a DRAFT on Fiverr. Blocked on the GALLERY, which needs real deliverables/mockups. This doc plans the tool work that unblocks the gallery and makes the kit deliverable at a competitive quality.

> ⚠️ **Build freeze note:** As of this doc's creation, the global build freeze is active. The *actual building* of these tools waits until Ruthnie clears the "Google OAuth verification video → publish Opsette" item (or explicitly removes it from the block). This doc is planning only, which is allowed. Do not start scaffolding tool code until the freeze is lifted.

---

## The finished Fiverr gig (for reference — already entered as a draft)

- **Title:** I will design your brand kit colors fonts and email signature
- **Category:** Graphics & Design → Business Cards and Stationery
- **Metadata product type:** Other → suggested "Brand Starter Kit"
- **Tags:** brand kit · brand identity · email signature · digital card · startup branding
- **Packages:** Basic $35 (Brand Basics) · Standard $65 (Full Brand Kit, recommended) · Premium $95 (Brand Kit + Social)
- **Attributes:** HTML email signature = YES on all tiers. Print-ready = NO. Source file / double-sided = priced only because the form forces it, not advertised.
- **Intake form:** industry + bigger-project (Fiverr's optional two) + 8 custom questions incl. the "No — I understand a logo isn't included" acknowledgment (refund shield) and a logo file upload.
- **Gallery: EMPTY — this is the blocker.** Needs a Brand Board PDF sample + preview images of each deliverable.

Full gig copy lives in `FIVERR-BUSINESS-STARTER-KIT.md`.

---

## The core realization from gig research

Ruthnie compared each Opsette tool against the Fiverr competition and found **most of our tools are "basic" against sellers doing 300–2000+ reviews.** The *bundle* is the value proposition, but the individual deliverables have to look present-worthy for the gallery and hold up next to $10–15 single-asset sellers. So this plan is about raising quality to "gallery-worthy," not just "functional."

Kit deliverables and which tool produces each:

| Deliverable | Tool | State today | Action |
|---|---|---|---|
| Color palette (3 options) | Palette Studio | Output is good | Light: bump/spin out font selector |
| Font pairing | Palette Studio (extend) OR new tool | Has a font library already | **Decide: fold into Palette Studio** |
| Favicon + profile image | Icon Kit | OK | Reuse as-is for now |
| Social banner | Icon Kit (extend) | Not built | **New mode inside Icon Kit** |
| Email signature | Signature Studio | **Weakest vs. competition** | **Biggest lift — restyle** |
| Digital business card | Digital Card | Probably OK | Verify, light polish |
| QR code | QR Creator | Basic | Optional: logo-shaped / styled QR |
| Brand Board PDF | Brand Board Generator | **Not built** | **New tool — highest priority** |
| ZIP assembly | Zip Builder | **Not built** | **New tool — needed for scale** |

---

## Breakout sessions (ordered by priority)

Each is its own fresh session. Priority order reflects: (1) what unblocks the gallery, (2) what's least competitive today, (3) what scales delivery.

### Session 1 — Brand Board Generator (NEW) · HIGHEST PRIORITY
**Why first:** every delivery needs it, AND a finished Brand Board PDF is the single best gallery asset — it shows the whole kit in one image.

> **Setup for this session (decided 2026-07-11):**
> - Folder: `c:\Opsette Tools\brand-board` · repo/slug: `brand-board` · route: `tools.opsette.io/brand-board/` · build base: `command === "build" ? "/brand-board/" : "/"`
> - **Dev port: 8124** (8120–8123 are taken: frame-board 8120, startup-planner 8121, photo-studio 8122, smart-flow 8123 — next free is 8124). Add it to `DEV_SERVERS.md`.
> - GitHub: push to Ruthnie's **personal** org/account (apex is `opsette-tools.github.io`; org confirmed correct). Personal identity `deebuilt` — never the work account. Can be transferred later if needed. New project repo: **no CNAME file, no custom domain in its Pages settings** (apex+routes pattern), deploy via GitHub Actions.
> - After it builds: add a Brand Board card to the apex landing page in `opsette-tools.github.io`.
- Single-page PDF generator. Inputs: hex codes (paste from Palette Studio), heading + body font names, logo upload, business name, tagline.
- Output: clean one-page brand reference PDF — color swatches with hex, heading font shown large + named, body font small + named, logo placement, Opsette-branded footer.
- Follow the Opsette head/manifest + branding conventions (`HEAD_AND_MANIFEST.md`, `ICONS_AND_BRANDING.md`). SPA-only Vite build, hardcoded base `command === "build" ? "/brand-board/" : "/"`.
- **Reuse the small-logo-in-export lesson:** embed a right-sized logo copy, never full-res (see memory `project_pdf_logo_optimization`).

> **Progress — 2026-07-11 (Session 1 built + direction sharpened):**
> - **Architecture pivot (Ruthnie's call):** rejected plain jsPDF as too generic for a Fiverr gallery. The board is a **real designed HTML/CSS deliverable rasterized to a high-res PNG** (`html-to-image`, 3200×4000 @2x) + a **PDF that embeds that same image** full-bleed. PNG = hero gallery asset; PDF = client hand-off. Preview = export.
> - **Format:** portrait poster 4:5 (1600×2000 intrinsic). Full-bleed primary-color hero (logo + name + tagline), edge-to-edge swatch row, real-web-font typography specimen, Opsette footer. Flagship "Editorial" template; more slot in via CSS. Real Google Fonts embed and render (verified live).
> - **Scaffold to family conventions:** slug/route/base `brand-board`, **port 8124** (in `DEV_SERVERS.md`), head+manifest per spec, brand icon added to generator (`swatches`) + rendered, shared Shell/header/share/theme/logo/uuid copied. `tsc` clean, live on :8124.
> - **Fixed:** horizontal-scroll blowout (grid `1fr` track needed `minWidth:0` so the 1600px board scales instead of forcing page width). Removed redundant on-page title + instruction line. **Font library expanded 6 → 21 pairings**, now **lazy-loaded per selection** (was one heavy up-front request).
>
> **THE COLOR-INTELLIGENCE PLAN (the v1 quality bar) — cross-app, two sessions:**
> Ruthnie's key insight: at volume the board must be *smart about color*, not a form that drops swatches in a row. Palette Studio already has the engine — `harmony.ts` has **`suggestRolesForList(hexes[])`** (scores every color against every role, assigns each a DISTINCT role: lightest→page bg, darkest→body text, colorful mid→button/CTA…), the plain-language **`CustomRole`** vocabulary + `CUSTOM_ROLE_OPTIONS`, `buildCustomPalette`, and OKLCH math (`oklch.ts`/`color.ts`) for tint/shade ramps + `readableOn` legibility.
> - **This session (Brand Board side):** copy Palette Studio's color engine into Brand Board `lib/` (self-contained, identical logic). Build a **paste-blob driver** (one field takes comma/newline/space-separated hex, w/ or w/o labels → parses → `suggestRolesForList` → distinct smart roles in order). Make colors **sortable (drag → any color becomes header) + relabelable** via the real `CustomRole` labels. Add **"colors in context"** to the board: per-color tint/shade ramp + on-color legibility demo + a small real composition (heading/body/button using assigned roles) so a client sees the SYSTEM, not 6 rectangles.
> - **Ruthnie's separate Palette Studio session (to circle back to):** add a "copy palette blob" export in Palette Studio emitting the same role-tagged format this paste driver understands. Then a fresh Brand Board session aligns the two. Both apps live in the same parent folder, so they can read each other. This makes the two apps genuinely "know each other."
> - **Also still left:** 2nd/3rd board templates for gallery variety · `og-image.png` · git init + push to personal org + apex landing card. Not yet committed/pushed.
>
> **Progress — 2026-07-11 (Session 1 REFRAMED as consumer + layout system built):**
> - **The big reframe (Ruthnie's call):** Brand Board `type: colors+fonts` == Palette Studio, so it was redundant. New identity: **Brand Board is a CONSUMER/compositor** — the one-page *showcase* of the whole kit (palette + type + logo + email signature + QR + digital card), composed into a designed page. The working files ship in the ZIP; the Board is the visual index of them.
> - **Recon done on all 5 kit apps** (Palette/Signature/QR/Digital Card/Icon Kit) — see **`docs/BRAND-KIT-RECON.md`** (full findings) and **`docs/BRAND-KIT-INTEROP-CONTRACT.md`** (frozen v1 JSON shapes). Key finding: all apps are client-side/download-only, nothing hosted. **No backend needed or wanted** — the model is **copy-JSON → paste** ("apps understand each other's language, not a shared server"). Each source app adds a small **"Export to Brand Board"** button emitting the contract shape; Brand Board pastes/uploads.
> - **Consumer built:** `src/components/board/ingest.ts` parses the palette + signature payloads (tolerant — enveloped or bare). Palette → labeled swatches + `scales` ramps + fonts + kitName. Signature → self-contained HTML. QR + Digital Card = image upload tiles. `BoardForm` now has a paste field per asset + uploads.
> - **Layout system ("wireframes") built:** `layouts.ts` + big rewrite of `board-template.css` → **4 distinct composed layouts** (Editorial / Overlap / Split / Poster) with real full-bleed + overlap (e.g. Overlap pulls the palette up over the hero, QR overlaps the signature tile; Split runs a vertical color band; Poster = oversized wordmark + full-bleed color bar). Picker in the form (`Segmented`). Board renders every present block; layout CSS positions them.
> - **Stripped** the color-theory engine I'd copied in (OKLCH/`suggestRolesForList`/culori) — Brand Board is a consumer, doesn't generate palettes. Removed the old jsPDF box-drawer too.
> - **Signature export gotcha handled:** html-to-image can't rasterize iframe content → signature injected INLINE (self-contained HTML makes this safe) so it exports.
> - `tsc` clean, live on :8124.
>
> **Progress — 2026-07-11 (revision/archiving problem solved + page color):**
> - **The client-revision problem** (how to reopen a client's kit weeks later, across tools, with no backend): solved WITHOUT infra. The contract now does TRIPLE duty — (1) export to Brand Board, (2) each app **imports its own shape back** to reopen/revise, (3) **Brand Board Project File**. Decided against Vercel/Redis at current scale (over-build; one client). See updated `BRAND-KIT-INTEROP-CONTRACT.md`.
> - **Brand Board Project File built** (`board/projectFile.ts` + Save/Open buttons): downloads ONE `.opsette-kit.json` with the whole kit (all consumed blobs + layout + name/tagline), reopens by dropping it back in. The durable per-client archive, kept in the user's file system. Version-tolerant load (merges onto emptyBoard).
> - **Page color control added** (Ruthnie's ask — bg was hardcoded bone): top-level Bone/White/Ink presets + custom picker; board derives ink/muted/hairline from page tone so white/bone/dark all read correctly.
> - Ruthnie reviewed the 4 layouts live: **Overlap is her favorite** ("looks like she knows what she's doing" — gallery-worthy). All 4 approved.
> - **NEXT: Ruthnie's Palette Studio session** — ship BOTH "Export to Brand Board" (`type:"palette"` shape) AND "import/paste to reopen" for Palette Studio (the proof-of-concept for the whole export-and-reconsume pattern all kit apps follow). Then a Brand Board session tests the palette consumer end-to-end (Palette Studio dev server up, paste a real blob). Then repeat per app. Not committed/pushed.
>
> **Progress — 2026-07-11 (palette consumer VERIFIED end-to-end + full palette on the board):**
> - Ruthnie pasted a **REAL Palette Studio export** (generated mode: primary/secondary/accent + roles + scales + font) and iterated the consumer to correctness. Key realizations/fixes:
>   - A generated palette genuinely has only **3 named brand colors** (the rest are scale tints + the 6 roles) — so 3 hero swatches is correct, not a bug.
>   - **Roles now editable in the left panel** ("Role colors" list: background/surface/heading/text/mutedText/border) so every hex in the blob is visible/editable.
>   - **Roles now shown ON the board** as a labeled chip+name+hex strip, below the palette swatches/ramps and above Typography — so the client gets the WHOLE color system (3 brand + 6 functional roles, all hexes), not just 3 swatches. This was the "would I be proud to deliver it" bar — Ruthnie confirmed: **"This looks like a legit deliverable. I'd be proud to pass this off."**
>   - **In-Use mock** derives roles from `custom[]` too (fallback) so custom-mode palettes drive it.
>   - **Board auto-grows to fit content** (was fixed 2000px → clipped a 9-color/mock board); preview reserves real measured height; **PNG/PDF export measure real height** so nothing clips. Swatch row is now a wrapping grid. Importer hardened (only scrapes raw hexes for truly unrecognized shapes, never dumps scale tints as swatches). Page-color control shipped earlier this session.
> - `tsc` clean, live on :8124. **The palette round-trip is the proven pattern** for the remaining apps (Signature/Card = same consumer approach). NEXT still: Ruthnie builds Palette Studio's actual "Export to Brand Board" + self-import buttons, then Signature, etc. Committed locally at this checkpoint; NOT pushed to GitHub (push + Actions + apex card = one clean batch after more round-trips verified).

> **Progress — 2026-07-11 (non-destructive import, Save As, signature sizing, QR next):**
> - **Non-destructive import shipped:** imported blobs are now stored on the board (`sourceBlobs.palette/signature`), so the paste field no longer wipes into a void. Each imported asset has a **"Copy blob"** button (re-copy the exact original without opening the saved JSON), a green "✓ Imported — saved with the board" confirmation, and the blobs ride along in the localStorage draft + the project file. Answered Ruthnie's "did I lose data?" — no; data lives in board state + localStorage + the Save file.
> - **Save As modal:** Save now opens a real OS Save dialog (`showSaveFilePicker`, Chrome/Edge) to pick folder + filename; filename-modal fallback elsewhere. No more auto-defaulting to the brand name in Downloads.
> - **Signature sizing:** email signature (native ~500px) scaled ~1.9x via CSS `zoom` so it reads at poster size in a card that hugs it (Ruthnie likes the shadow). Signature Studio interop + template redesign are DONE (Ruthnie's separate session) — templates better but not yet Fiverr-elite; build agent's insight: top Fiverr signatures likely showcase flat IMAGES, not live Gmail HTML (email HTML is too limited to compete visually). Also flagged: a weak logo caps signature quality — future logo session, not a blocker. Signatures are "good enough to ship."
> - **Poster layout collision fixed:** only the swatch bar bleeds edge-to-edge; ramps + role-color strip keep the gutter.
> - **NEXT: QR Creator** (easy — no source-app change needed, just wire the upload tile), then **Digital Card** (upload exported PNG), then the kit is complete.
>
> **LAYOUTS v2 — FUTURE PLAN (Ruthnie's ideas, captured, NOT built yet):**
> - **True asset overlap** — Ruthnie's "overlap" meant layering the *assets themselves* (signature over palette, things on top of things), magazine-style — not just overlapping palette colors. Current Overlap layout only overlaps the palette/QR.
> - **Editorial vs Overlap too similar** — should diverge more (distinct enough to feel like real alternatives).
> - **Split wastes space** — when layering, put the QR code *inside the left color band*.
> - **More layouts wanted** overall.
> - **One-page vs multi-page:** Ruthnie is leaning toward keeping it all on ONE page (likes it, would deliver it) — do NOT force two pages; keep two-page as an optional future add only if a kit gets crowded. Where QR/signature/card stack is part of the layouts-v2 work.
> - **Specific placement idea (Editorial):** the hero has empty whitespace to the RIGHT of the wordmark (see Ruthnie's screenshot arrow). She wants the QR tucked there, overlapping the hero's bottom edge — the kind of intentional asset-overlap she keeps describing. Good spot; do in layouts-v2.
>
> **Progress — 2026-07-11 (QR/card blob-first verified with a REAL blob; Overlap QR fix):**
> - Ruthnie pasted a **real QR Creator blob** — confirmed it's **config-only, NO `image` field** yet (`{config:{url,preset:"dots",fgColor,logoDataUrl:...}}`). Brand Board stores it fine; can't render the QR until QR Creator adds `data.image`. So the QR Creator session's remaining task: **add the rendered QR image to the export blob** (the one change), then one paste shows + stores it. Contract §4 already specifies this.
> - **Fixed the Overlap-layout QR placement bug:** the QR was `position:absolute` meant to overlap the signature tile, but absolute resolved against the board, so with no signature it flew up into the hero circle (Ruthnie's screenshot). Now it's an in-flow element pulled up to overlap the preceding block — predictable regardless of which assets exist.
> - **Image hosting confirmed to Ruthnie:** uploaded/embedded images are data URLs baked into the export (like the logo), nothing hosted. Caveat noted: her signature's `profileImageDataUrl` is a REMOTE url (deebuilt.co) not a data URL — could export blank if CORS blocks it.

### Session 2 — Signature Studio restyle · HIGH PRIORITY (least competitive today)
**Why:** Ruthnie confirmed ours "doesn't compare at all" to competitor HTML signatures. This is the deliverable most likely to disappoint a buyer.
- Study competitor clickable HTML signatures (image-URL-based clickable footers, Gmail/Outlook-safe HTML).
- Raise the styling bar: layout variety (the doc promises "2 layouts: minimal vs. bold"), better type hierarchy, icon/social row, clean table-based HTML that survives Gmail + Outlook.
- Deliver as `signature.html` + `signature_preview.png` per the ZIP structure.
- There is a prior redesign plan for Signature Studio — check `signature-studio/docs/SIGNATURE_REDESIGN_PLAN.md` and the memory `project_signature_redesign_plan` before starting; don't re-plan what's already planned.

### Session 3 — Font pairing in Palette Studio · MEDIUM
**Decision (Ruthnie leaning yes):** fold font pairing INTO Palette Studio rather than a standalone tool, since it already has a font library.
- Add a vibe-based font-pairing mode (modern/warm/bold/minimal → Google Fonts heading + body).
- Live preview of heading + body together.
- **Allow output of just fonts, separate from palette colors** (Ruthnie's explicit ask) — so a Font_Pairing PDF can be exported independently.
- Feeds font names into the Brand Board Generator.

### Session 4 — Social Banner mode in Icon Kit · MEDIUM (premium-tier add-on)
**Decision (Ruthnie leaning yes):** extend Icon Kit with a banner mode rather than a new tool.
- Upload logo, pick brand color, add short tagline → export banners at LinkedIn 1584×396, Facebook 820×312, Twitter/X 1500×500.
- Lives as a new tab/mode inside Icon Kit.

### Session 5 — QR Creator polish · LOW (optional, competitiveness only)
- Competitors do logo-shaped / styled / colored QR codes. Ours is basic.
- Optional lift: styled QR (colors, rounded modules, center logo). Not required for launch — a plain QR still works — but raises the gallery bar.

### Session 6 — Zip Builder / Brand Kit Assembler (NEW) · needed for SCALE
**Why later:** you can hand-zip the first few orders. This tool makes it an assembly line once volume justifies it.
- Accepts uploads (PDFs, PNGs, HTML) from the other tools, organizes into the pre-labeled folder structure, renames cleanly, outputs one Opsette-branded ZIP.
- Folder structure target is in `FIVERR-BUSINESS-STARTER-KIT.md` (ZIP Structure section).

### Session 7 — Digital Card verify · LOW
- Ruthnie thinks it's "probably okay." Quick pass to confirm it's gallery-worthy and vCard export works; light polish only.

---

## Gallery plan (what actually unblocks publishing)

Once Sessions 1–2 (minimum) are done, produce with mock data:
1. A finished **Brand Board PDF** (the hero document — Fiverr allows up to 2 gallery documents).
2. Preview **images**: the email signature rendered, the digital card, a palette strip, the social banners.
3. Optional short **video** walking through the ZIP contents.

Then return to the Fiverr gig draft, fill the gallery, and publish.

---

## Conventions every session must honor
- Opsette head/manifest spec is canonical (`HEAD_AND_MANIFEST.md`).
- SPA-only, never TanStack. Hardcoded build-time base per app slug (never `process.env.VITE_BASE`).
- Brand kit: Phosphor brand-icon generator, dark-mode pattern (`--ops-header-accent` + `html.dark` / `data-theme=dark`), header is chrome only.
- Context-safe `uuid()` helper (crypto.randomUUID breaks on phone-over-http).
- Confirm before bulk-changing sibling apps.
