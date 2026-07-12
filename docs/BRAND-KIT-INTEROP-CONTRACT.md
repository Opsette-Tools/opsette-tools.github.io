# Brand Kit Interop Contract

**Owner:** Ruthnie / Opsette Tools
**Created:** 2026-07-11
**Status:** FROZEN v1 shapes. Take this into each app's breakout session and add its "Export to Brand Board" button to match exactly. Brand Board (the consumer) is built against these shapes.

---

## The model: shared language, NOT shared backend

None of these apps has a backend, and **none should get one** for this. They are client-side, local-storage, GitHub-Pages tools — mostly for Ruthnie's own delivery pipeline, low traffic. Adding a server/DB to pass data between them would be a large permanent cost to solve a problem that a clipboard solves for free.

**The mechanism is copy-JSON → paste.** Each source app adds an **"Export to Brand Board"** action that serializes its state to the agreed JSON shape below and copies it to the clipboard (a `navigator.clipboard.writeText(JSON.stringify(payload))`). Brand Board has a matching **paste field per asset** that parses the blob and renders it. Images (QR, logo) are handed off as **uploaded files**, not JSON.

### The pattern does TRIPLE duty (revision + archiving — added 2026-07-11)

The same JSON shape solves the "client wants a revision 3 weeks later, how do I reopen their work?" problem — without a backend:

1. **Export to Brand Board** — source app → the showcase (below).
2. **Import own shape** — each kit app also **pastes its own export back in** to reopen/revise. Same shape, small add. So revising a client = paste their saved palette blob into Palette Studio, tweak, re-export. Build this alongside the export button in each app's session.
3. **Brand Board Project File** — Brand Board (which consumes every app's blob) can **"Save Project"** → download ONE `.opsette-kit.json` holding the whole kit (all blobs + layout + name/tagline), and **"Open Project"** → rehydrate. This is the durable per-client archive: one file per client, kept in the user's own file system (`Clients/Acme/acme.opsette-kit.json`), survives browser wipes. ✅ Built in Brand Board on 2026-07-11 (`board/projectFile.ts`). It's the file-system alternative to per-app localStorage; the same JSON becomes DB rows if a backend is ever added (not now — over-build at current scale).

**So each kit app's session ships BOTH:** an "Export to Brand Board" button AND an "import/paste to reopen" path for its own shape.

Every JSON payload carries a `type` discriminator and a `v` version, so Brand Board can route a pasted blob to the right slot and reject/upgrade old shapes.

```ts
// The envelope every JSON export shares.
interface KitPayload<TType extends string, TData> {
  type: TType;   // "palette" | "signature" | "card"
  v: 1;
  data: TData;
  source: "opsette";   // sanity guard so a random paste is rejected
}
```

---

## 1. Palette Studio → `type: "palette"`  ·  BUILD FIRST

The foundation — colors + fonts drive the whole board. Data already exists in memory at the `ExportPanel` boundary (`palette` + `fontPair`); this is a small additive "Copy as JSON" button, no model changes.

```ts
interface PalettePayload {
  type: "palette";
  v: 1;
  source: "opsette";
  data: {
    kitName: string;          // ExportPanel's kitName state — label for the board
    base: string;             // seed hex
    rule: string;             // HarmonyRule
    vibrancy: string;
    temperature: string;
    // Named colors (the ones a board shows as primary swatches):
    primary: string;
    secondary: string;
    accent: string;
    accent2?: string;         // only for tetradic
    // The six semantic roles:
    roles: {
      background: string;
      surface: string;
      text: string;
      heading: string;
      mutedText: string;
      border: string;
    };
    // The three 10-stop scales (keys "50".."900"):
    scales: {
      primary: Record<string, string>;
      accent: Record<string, string>;
      neutral: Record<string, string>;
    };
    // Only present in "choose my own colors" mode — the user's exact
    // colors with their assigned role + optional custom name:
    custom?: { hex: string; role: string; name?: string }[];
    // Fonts live OUTSIDE Palette in memory — include them here:
    font: {
      id: string;
      heading: string;        // family name, e.g. "Playfair Display"
      body: string;           // family name, e.g. "Inter"
      googleHref: string;     // the Google Fonts <link> href
    };
  };
}
```

**To add in Palette Studio (`src/lib/exporters.ts` + `ExportPanel.tsx`):**
- A `toKitJson(palette, fontPair, kitName)` emitter that returns the object above.
- An **"Export to Brand Board"** button (a 4th action alongside CSS/Tailwind/AntD) that copies `JSON.stringify(payload)`.
- Essentially: `JSON.stringify({ type:"palette", v:1, source:"opsette", data:{ ...palette, scales:{primary:palette.primaryScale, accent:palette.accentScale, neutral:palette.neutrals}, font:fontPair, kitName }})`.

**Brand Board consumes:** primary/secondary/accent for the hero + swatch row, `scales` for tint/shade ramps ("colors in context"), `roles` for the mini in-context composition, `font.heading`/`font.body` (+ `googleHref`) to load and render the real type specimen, `kitName` to title the board.

### ✅ SHIPPED in Palette Studio — 2026-07-11

Both halves of the "triple duty" are built and verified against the frozen shape:

- **Export** — `toKitJson(palette, fontPair, kitName)` in `src/lib/exporters.ts` emits the exact `PalettePayload` above (envelope + named colors + `roles` + three `scales` + optional `custom[]` for "My own colors" palettes + `font`). The **"Export to Brand Board"** button lives in `ExportPanel.tsx` and copies `JSON.stringify(payload)` to the clipboard.
  - **Deviation from the doc, intentional:** the doc said "a 4th action alongside CSS/Tailwind/AntD" — those are *tabs* showing copyable code, but Export-to-Brand-Board is a one-shot clipboard copy, so it's a **button in the panel header** next to Download, not a 4th tab. Cleaner and one click. The payload shape is unchanged.
- **Reopen (import own shape)** — `fromKitJson(raw)` in `exporters.ts` (strict on the envelope `type`/`v`/`source`, never throws, returns `null` for junk). A **"Reopen a saved palette"** link in the StartCard header opens a paste modal. It restores the **inputs** that produced the palette (`base`/`rule`/`vibrancy`/`temperature` + font, or the `custom[]` list) — never the derived palette — so `buildPalette`/`buildCustomPalette` rebuild an identical result and every control reflects the reopened state. Lossless round-trip.

**Verified end-to-end with Brand Board (2026-07-11):** a real exported blob (base `#e8884a`, split-complementary) pasted into Brand Board rendered the 3 brand swatches, all 3 scale ramps, and the fonts correctly.

**~~Gap~~ RESOLVED on the Brand Board side (2026-07-11):** the consumer now walks `data.roles` fully — the six semantic role colors (background/surface/text/heading/mutedText/border) appear as **editable rows in Brand Board's left panel** AND as a **labeled chip+name+hex strip on the board** (below the palette swatches/ramps, above Typography), so the client gets the whole color system. Roles also drive the In-Use mock, and the board's own type (wordmark/headings/tagline/footer) now **adopts the role colors** (heading→brand name, mutedText→tagline/captions) so the guide reads as one system. The `data.custom[]` "My own colors" variant is handled (all colors shown, labeled by name/role; roles derived from custom[] as a fallback). Round-trip fully working; nothing left open here.

**Also done in the same session (unrelated to interop, noted for provenance):** the "Preview & download brand kit" flow was simplified from a naming-modal → new-browser-tab hop into a single modal with the name field on the left and a **live, updates-as-you-type** `<BrandKitPreview>` on the right (new reusable `ScaledPreview` wrapper scales the fixed 1080px node to fit the pane; download snapshots the same node at full res). The redundant "5. Font pairing" card (`TypographyPicker`) was deleted — it duplicated the always-visible Live preview's font dropdown + mockup — and cards renumbered 1–5, so "Your palette" now sits higher without scrolling.

---

## 2. Signature Studio → `type: "signature"`

The HTML is already fully self-contained (inline styles, SVG-as-data-URI icons, base64 logo/photo — no external assets), so Brand Board can render a faithful preview in an `<iframe srcdoc>`. Two valid handoffs; ship **A** (cleanest), **B** optional.

**A — payload (re-render, live, sharp):**
```ts
interface SignaturePayload {
  type: "signature";
  v: 1;
  source: "opsette";
  data: {
    templateId: string;       // e.g. "modern-card-style"
    signature: SignatureData; // the full data object (see recon)
    html: string;             // template.renderHtml(data) — the self-contained email HTML
  };
}
```
Include `html` directly so Brand Board does NOT need to import all 21 templates — it just drops `data.html` into `<iframe srcdoc={html}>`. (`templateId` + `signature` are carried for future re-rendering / editing.)

**B — optional image:** add a `signature_preview.png` export (html-to-image over the preview node) for when a flat image is preferred over a live iframe.

**To add in Signature Studio (`CopyPanel.tsx`):** an **"Export to Brand Board"** button that copies `JSON.stringify({ type:"signature", v:1, source:"opsette", data:{ templateId, signature:data, html: template.renderHtml(data) }})`.

**Brand Board consumes:** drops `data.html` into a sandboxed `<iframe srcdoc>` tile on the board.

### ✅ SHIPPED in Signature Studio — 2026-07-11 (commit `be6c9b8`, pushed)

Both halves of the "triple duty" are built, typechecked (`tsc -b`), production-built, and pushed:

- **Export** — `toKitJson(template, data)` in `src/utils/brandKit.ts` emits the exact frozen `SignaturePayload` (envelope + `templateId` + full `signature` + self-contained `html` via `template.renderHtml(data)`). An **"Export to Brand Board"** button in `CopyPanel.tsx` copies `JSON.stringify(payload)` to the clipboard.
  - **Deviation from the doc, intentional (same call Palette Studio made):** the button is a clipboard action in the panel, not a 4th preview tab — Export is a one-shot copy, the tabs show copyable output. Payload shape unchanged.
- **Reopen (import own shape)** — `fromKitJson(raw)` in `brandKit.ts` (strict zod on the envelope `type`/`v`/`source`, never throws, returns `null` for junk; runs the signature through the same `sanitizeSignatureData` the share link uses). A new `ReopenExportModal` opens from a **"Reopen"** button in the `SavedSignatures` header. On success it restores template + data via `replaceAll`/`setSelectedTemplateId` and **navigates to the Studio editor** so the result is visible.

**Bugs found + fixed during the session (noted so they don't recur):**
1. `onReopen` was a required prop but only wired into the Studio page's `<SavedSignatures>`, not the standalone `/saved` page → runtime `onReopen is not a function`. Fixed both call sites.
2. Reopen from `/saved` updated editor state on a page that doesn't show it ("did nothing") → now navigates to `/` (Studio) after reopen.
3. **`tsc --noEmit` is a false green on these apps** — the root `tsconfig.json` has `"files": []` and only `references` sub-projects, so it checks nothing. **Use `tsc -b`.** It correctly caught the missing-prop error `--noEmit` missed.

**Also in the same session (UX polish on the Copy panel):** the five equal "fat buttons" were restructured into two labeled groups — **Copy** (Rich signature / HTML / Plain text) and **Share** (Share link / Export to Brand Board) — under a new reusable `.group-label` eyebrow class (supersedes two ad-hoc duplicate eyebrow styles). Per Ruthnie, all five are now uniform outlined/bordered buttons (no primary purple fill).

> **NEXT (separate session): the Signature templates themselves.** Ruthnie's verdict: the current 21 templates "look like they were picked from the garbage" and can't compete with Fiverr HTML-signature sellers. That's the Session-2 restyle in `FIVERR-KIT-BUILD-PLAN.md` — check `signature-studio/docs/SIGNATURE_REDESIGN_PLAN.md` and memory `project_signature_redesign_plan` before starting. Interop (this section) is done and independent of the restyle.

---

## 3. Digital Card → `type: "card"`

`CardData` already round-trips through the base64 share hash, so it's portable. The rendered PNG is ephemeral (download-only), so **data-paste + re-render is the path**, OR upload the exported PNG.

**A — payload (re-render mini card):**
```ts
interface CardPayload {
  type: "card";
  v: 1;
  source: "opsette";
  data: {
    cardStyle: string;        // one of 9 templates
    card: CardData;           // the full data object (see recon)
  };
}
```
Re-rendering requires Brand Board to reuse the `cards/*` template components. Heavier lift than an image. **For v1, prefer the image path (B)** unless a live card is worth the extra wiring.

**B — image (simplest):** the user exports the **web PNG** from Digital Card and uploads it to Brand Board as a tile.

**Gaps worth fixing in Digital Card while you're in there (optional, not blocking):**
- No dedicated **logo** field — only a person `photo` or initials. A brand kit usually wants the logo. Consider adding `logo: string` distinct from `photo`.
- Only **one `accentColor`** — fine for a card, just noted.

**Brand Board consumes:** for v1, an uploaded card PNG dropped into a tile. (Payload re-render is a v2 upgrade.)

---

## 4. QR Creator → `type: "qr"`  (REVISED 2026-07-11 — blob-first, consistent with the rest)

Same triple-duty pattern as every other app: one blob that Brand Board **stores/archives** AND that pastes back into QR Creator to **reopen**. The config is the reopen data; the **rendered image** is what Brand Board displays. QR Creator already renders the QR on screen, so including the image is a small add.

```ts
interface QrPayload {
  type: "qr";
  v: 1;
  source: "opsette";
  data: {
    config: {                 // the QR settings — for reopen/recreate in QR Creator
      url: string;
      label?: string;
      preset: string;         // classic | rounded | branded
      dotStyle?: string;
      fgColor: string;
      bgColor: string;
      useGradient?: boolean;
      gradientColor?: string;
      gradientType?: string;
      eyeStyle?: string;
      eyeColor?: string | null;
      size: number;
      includeBorder: boolean;
      logoDataUrl: string | null;
    };
    image: string;            // ← ADD THIS: the rendered QR as a data URL (PNG or SVG),
                              //    so ONE paste shows the QR on the board. Without it
                              //    the user must upload the downloaded PNG separately.
    url?: string;             // convenience: the encoded URL at top level
  };
}
```

**To add in QR Creator:**
- **"Export to Brand Board"** → the `config` you already have **PLUS `data.image`** (grab the rendered QR — the same render you download — as a data URL). This is the only change from the current export, which is config-only.
- **"Reopen" (self-import)** → paste a `qr` blob back to rebuild the QR from `config` (same pattern as Palette Studio's reopen).

**Brand Board consumes (BUILT 2026-07-11):** `ingestQrPayload` reads `data.image` to display the QR, and **stores the whole blob** on the board (`sourceBlobs.qr`) — held, re-copyable via "Copy blob", archived in the project file, pasteable back into QR Creator. If a blob has no `image` yet, Brand Board shows a small upload fallback for the downloaded PNG. Brand Board does NOT regenerate the QR (no duplicated rendering logic) — QR Creator stays the source of truth for how a QR looks.

### ✅ SHIPPED in QR Creator — 2026-07-11

Both halves of the triple duty are built, typechecked (`tsc -b`), and verified end-to-end (Ruthnie tested the reopen round-trip live):

- **Export** — `toKitJson(config)` in `src/lib/brandKit.ts` is now **async** and emits the exact revised `QrPayload`: envelope + full `config` + **`data.image`** (the rendered QR as an **SVG data URL**, same `buildOptions` as the preview/downloads, at the config's export size) + top-level `data.url`. Nothing is hosted — the image travels inside the blob, so one paste both shows the QR on the board and archives it. The **"Export to Brand Board"** button (kept that name — consistent with Palette/Signature) lives in the new toolbar and copies `JSON.stringify(payload)`.
- **Reopen (import own shape)** — `fromKitJson(raw)` (strict zod envelope, tolerant inner config merged onto `DEFAULT_CONFIG`, never throws, `null` for junk; tolerates the new `image`/`url` keys). A **"Reopen a saved QR"** link opens `QRReopenModal` (this app's shadcn dialog, not Ant — matches QR Creator's own stack); on success it restores the config and the preview rebuilds identically.

**Also shipped this session (quality lift for the Fiverr gallery, beyond interop):**
- **Premium styling** — `QRConfig` gained `dotStyle` (6 module shapes), `eyeStyle` + optional separate `eyeColor` (the biggest "designer QR" tell, scan-safe), and gradient controls (`useGradient`/`gradientColor`/`gradientType`). 5 quick-start presets seed these granular fields. All in the new `src/lib/qr-options.ts` `buildOptions`.
- **Scan-safety guardrails** — error correction locked to level H, a minimum quiet zone even with border off, logo coverage capped at 28%, and a **live low-contrast warning** in the customize panel (WCAG contrast ratio, min 3:1). A paid QR that doesn't scan is a refund; these keep every styling choice inside scannable range. **Deliberately did NOT build AI logo-morph QR** (Ruthnie's product call) — unreliable scanners, refund risk.
- **Branded "Scan me" card** export (`src/lib/qr-card.ts`) — composites the QR into a brand-colored card (label headline, white QR tile w/ shadow, "SCAN WITH YOUR CAMERA" pill+chevron, Opsette footer) on a canvas at 2x. The gallery-worthy deliverable vs. a bare QR. (Design not yet reviewed by Ruthnie — canvas-drawn, easy to iterate later.)
- **Layout** — rebuilt Index to **side-by-side** (controls left, QR preview + toolbar right, sticky on desktop; QR-on-top stacked on mobile). Toolbar replaced the flat 4-button grid: Download dropdown (PNG/SVG/Card) + Export on one row, Copy + Save below.
- **Bug fixed:** the QR preview used a module-level `QRCodeStyling` singleton that drew into a detached DOM node after the layout remount (blank preview, no console error). Moved to a per-component `useRef` — always appends to the live container.

---

## 5. Icon Kit → `type: "social"`  (REVISED 2026-07-11 — social + brand assets, blob-first)

**The plan grew:** Icon Kit's Brand Board export is NOT just a logo — it's a **generic bag of brand images**: social banners (LinkedIn/Facebook/X, any platform), a profile avatar, a **favicon** (real need — a client often has a logo but no favicon), app icons, whatever Icon Kit produces. Brand Board renders them generically by aspect ratio, so **Icon Kit can send any mix and it just works — no fixed set required.**

```ts
interface SocialPayload {
  type: "social";
  v: 1;
  source: "opsette";
  data: {
    // An OPEN-ENDED list. Each item needs `image`; the rest is optional.
    assets: {
      label: string;        // shown under the image, e.g. "LinkedIn banner", "Favicon"
      kind?: string;        // hint only: "banner" | "avatar" | "favicon" | "icon" | ...
      image: string;        // the rendered image as a data URL (PNG/SVG). REQUIRED.
      width?: number;       // natural px — drives layout (wide→banner row, square→compact)
      height?: number;
    }[];
  };
}
```
Example: `{ assets: [ {label:"LinkedIn banner", kind:"banner", image:"data:…", width:1584, height:396}, {label:"Facebook cover", kind:"banner", image:"data:…", width:820, height:312}, {label:"Profile avatar", kind:"avatar", image:"data:…", width:400, height:400}, {label:"Favicon", kind:"favicon", image:"data:…", width:512, height:512} ] }`

**To add in Icon Kit:**
- **"Export to Brand Board"** → build the `assets[]` list from whatever the user generated (each banner mode output, the avatar, the favicon…), each as a rendered `image` data URL with `label` + `width`/`height`. Send as many or as few as exist.
- **"Reopen" (self-import)** → ✅ SHIPPED 2026-07-11 (see below). The blob carries `data.config` (the full builder state) alongside `data.assets[]`, so the SAME blob does double duty: Brand Board reads `assets[]`, Reopen reads `config` to rebuild the whole design losslessly.

**Brand Board consumes (BUILT 2026-07-11):** `ingestSocialPayload` reads `data.assets[]` into `socialAssets`; the board renders a **"Social & Brand Assets"** block — wide items (ratio ≥ 1.8) span a full row like banners, near-square items (avatar/favicon/icon) sit compact side by side. The whole blob is stored (`sourceBlobs.social`) — archived, re-copyable, pasteable back. A manual **"Upload images"** multi-file fallback exists (drop banner/favicon PNGs directly, each auto-labeled + relabelable). **No per-type logic** — any image with dimensions lays out sensibly, so Icon Kit can add asset types later with zero Brand Board changes.

> **Multi-page note (planned, not built):** the social block is content-heavy (multiple banners). Ruthnie decided this pushes Brand Board to a **paged deliverable** — Page 1 Foundation (palette/type/mock), Page 2 Applications (signature/QR/card), Page 3 Social (banners). Labeled, unified pages; multi-page PDF + per-page PNGs for 3 gallery images. That's the next substantial Brand Board session AFTER the kit apps are content-complete. See `FIVERR-KIT-BUILD-PLAN.md`.

### ✅ SHIPPED in Icon Kit — 2026-07-11 (Social & Banners)

Built, typechecked (`tsc -b`), production-built, committed + pushed. The export matches the frozen `type:"social"` shape above exactly (verified against the board's `ingestSocialPayload` / `SocialAsset` type).

- **One design → four outputs:** a **Social card** (1200×630 OG) + three profile banners (**LinkedIn 1584×396**, **Facebook 820×312**, **Twitter/X 1500×500**). Shared inputs (brand name, tagline, text color, logo, background) drive all four live previews at once — no rebuilding per platform.
- **Export** builds `data.assets[]` from the **selected** outputs (per-tile checkboxes + "Select all"), each a rendered PNG data URL with `label` ("LinkedIn banner"…), `kind` ("banner"/"card"), and natural `width`/`height`. One paste brings the whole selection over. `renderBanner()` / `renderSocial()` in `src/lib/icon-kit/canvas.ts`; export + selection UI in `src/components/icon-kit/SocialPanel.tsx`.
- **"Download selected as PNG"** for the ZIP path; per-tile PNG download too.

**Design decisions (why it's built this way):**
- **Merged into the existing Social tab, NOT a new tab** (Ruthnie's call) — the four sizes share identical inputs, so a size/preview list beats N tabs that force rebuilding the same design.
- **Per-output layout (Option B):** shared content, each preview its own Left/Centered toggle (+ Split for the card) — a wide banner and a square card frame differently.
- **Safe-zone-aware framing** — the real quality lift: all three platforms overlay a bottom-left avatar, so content is biased upward (~42% mid) and, in Left layout, starts right of a per-platform avatar-safe column (Facebook 22% / Twitter 16% / LinkedIn 14%). The profile pic never lands on the brand.
- **Photo bg = Social card only**; banners use solid/gradient (a cropped photo behind a thin banner reads badly).
- **localStorage persistence** on BOTH Social + Favicon panels (`iconkit.social.v1` / `iconkit.favicon.v1`, via new `usePersistentReducer` hook) — switching tabs / reloading no longer wipes a client's in-progress work (the tab-reset gap Ruthnie flagged).
- **Banner PNGs are solid, edge-to-edge, exact ratio — never transparent** (a transparent social banner looks broken on the platforms). If the board ever shows **white beside a banner**, that's the board slot white-filling a non-full-width image → **board-side fix**: size the slot to the asset's ratio (`width`/`height` are sent) or letterbox transparent, don't white-fill.

**Ruthnie's product call:** the banner builder **ships in the tool but is held back from the Fiverr gig for now** — she wants to study real banner design first so no buyer feels shortchanged. Reopen for the gig once she's confident in a color/design direction.

> **Premium-enhancement backlog (social banners)** — captured for when she circles back, to lift it above "solid/gradient/image bg":
> - **Safe-zone guide overlay** (preview-only, never exported) — a ghosted circle showing where each platform's avatar lands, so clearance is visible while designing.
> - **Large faded logo watermark** as a texture layer — the single biggest "designed vs. template" lift beyond flat color.
> - **Subtle geometric/pattern layer** — soft shapes, a diagonal color block, a thin accent rule, a dot grid — one tasteful texture element.
> - **Eyebrow line** (small ALL-CAPS role/location above the name) for real 3-tier type hierarchy, not just big/small.
> - **Genuinely distinct layout presets** (asymmetric anchor; logo-lockup left + tagline right) rather than Left/Centered variants.
> - **Duotone / brand-tinted photo** bg option (photo mapped to brand colors) so a photo doesn't fight the palette.
> - **Auto text-contrast** — warn or auto-flip text color when it fails WCAG on the chosen bg (same guardrail QR Creator got).
> - **Font choice** (borrow Palette Studio's pairing library) instead of Inter-only.

### ✅ SHIPPED in Icon Kit — 2026-07-11 (premium banner builder + reopen)

The whole premium-enhancement backlog above was built in one session, plus the missing **reopen** half of the triple duty. Typechecked (`tsc -b`), production-built, committed + pushed. Two commits: the premium builder, then reopen.

**Premium banner builder** (`src/lib/icon-kit/canvas.ts`, `SocialPanel.tsx`, new `src/lib/icon-kit/social-design.ts` + `src/components/icon-kit/social-controls.tsx` + `SafeZoneOverlay.tsx`):
- **Design layers** shared by the OG card and all three banners, drawn in z-order background → watermark → texture → content: **large faded logo watermark** (bleeds off a chosen edge, opacity/size controls); **10 texture/shape options** (corner glow, diagonal block, accent rule, dot grid, arc lines, vertical stripes, confetti, wave band, blueprint grid, halftone) tinted from an **accent color**; **duotone / brand-tinted photo** backgrounds; **eyebrow line** for real 3-tier type hierarchy (eyebrow → name → tagline); **font-pairing library** (10 pairings borrowed from Palette Studio — no longer Inter-only).
- **Distinct banner layouts** beyond Left/Centered: **photo panel** (a person/product photo carved into one side behind a straight/diagonal/curve divider, with a **drag-to-position focal point + zoom** so a portrait shows the face, not the chin); a text-forward **Highlight** layout; and an optional **contact bar** (website / phone / CTA pill) that rides on any layout.
- **Highlight is a style category** (bold color / underline / marker block / glow) chosen by **clicking words** in the name or tagline (multi-word + scattered selection; no typed phrase). Shows only on the Highlight layout. Long **taglines wrap to 2 lines** on narrow layouts (no hard char cap).
- **Guardrails + UX:** WCAG **auto-contrast shield** with one-tap flip (same guardrail QR Creator got); **preview-only safe-zone avatar overlay** (never in the export); **wide sticky two-column layout** (controls left, live previews right) that stacks on mobile.

**Reopen (self-import) — the fix for the "if feasible" gap:** the frozen `type:"social"` shape only carried `assets[]` (rendered images = output, not inputs), so a pasted blob couldn't rebuild the design. Fixed by adding **`data.config`** (the full builder state) to the export — the board ignores it, Reopen consumes it. New `src/lib/icon-kit/brand-kit.ts` has `toSocialKitJson(assets, config)` and `fromSocialKitJson(raw)` (strict envelope, never throws, `null` for junk; `config` optional so **pre-config blobs still validate** — Reopen tells the user plainly to re-export rather than silently doing nothing). A **"Reopen a saved design"** button + paste modal restores name/font/background/watermark/texture/photo/highlight/layouts/contact bar via a single `patch` dispatch. Same "one blob does both jobs" model as Palette/Signature/QR.
- **Note:** blobs exported BEFORE this change (images only, no `config`) can't reopen losslessly — Reopen surfaces a clear message. Every export from now on is self-contained and round-trips.
- Persistence bumped to `iconkit.social.v2` (state shape changed).

**Product call unchanged:** the banner builder still **ships in the tool but is held from the Fiverr gig** until Ruthnie is confident in a color/design direction. The reopen + premium work makes it gig-ready when she is.

### ✅ SHIPPED in Icon Kit — 2026-07-12 (Favicon export + combined "export both")

The Favicon tab now exports to Brand Board too, and — the bigger change — a **single blob can carry BOTH tabs' assets**. Typechecked (`tsc -b`), production-built, verified end-to-end (Ruthnie pasted a 7-asset blob into Brand Board: 4 social + 3 favicon, all rendered on the "Social & Brand Assets" page). Same frozen `type:"social"` shape — **no board-side change**.

**Why one blob, not two:** Brand Board has ONE social slot (`sourceBlobs.social`) and its `BoardForm` sets `socialAssets: assets` **wholesale** on paste — a second paste REPLACES the first, it doesn't append. So pasting a banner blob then a favicon blob would wipe the banners. The fix is tool-side: Icon Kit emits ONE combined blob so a single paste lands the whole set.

- **Favicon export** (`buildFaviconAssets` in `FaviconPanel.tsx`) sends **3 client-facing icons**, not every generated file (16/48/192/maskable/SVG would be near-identical clutter on a showcase): **App icon (512)**, **Apple touch icon (180, forced opaque** so no transparent checkerboard**)**, **Favicon (32)** — `kind:"icon"/"icon"/"favicon"`. Reopen restores the favicon builder (source/bg/shape/padding/app-name), guarding against a mis-pasted banner blob by only patching keys it owns.
- **Combined "export both"** (`src/lib/icon-kit/export-assets.ts` + shared `ExportToBoardButton.tsx`): one export control per tab. Touch only one tab → it exports just that tab (plain button). Touch **both** → a **popover** offers "Export this tab" or "Export both," and "both" concatenates `[...banners, ...favicons]` into one `type:"social"` blob (banners lead, favicon squares follow). The blob carries the CURRENT tab's `config` for reopen.
- **Placeholder guard (Ruthnie's requirement):** the Favicon tab is never empty (defaults to "OP" on a green tile). `faviconIsDirty` / `socialIsDirty` compare state field-by-field against the initial, so "Export both" only appears/enables when the OTHER tab has real work — a stock default never rides into a client's kit. (The one confusing moment in the session was a stale logo render, not a gate bug: a real logo was in state but its render hadn't caught up, so an export briefly under-counted; re-uploading fixed it. The dirty gate itself worked correctly throughout.)
- **Persistence unchanged and confirmed safe:** two separate localStorage keys (`iconkit.favicon.v1` / `iconkit.social.v2`), so switching tabs never wipes the other's work. The combined exporter reads the inactive tab's state from its persisted key (both panels flush on every change).
- **Cleanup:** shared `blobToDataUrl` factored into `download.ts` (was a private copy in SocialPanel); both panels' export buttons now route through the one shared component. Known dev-only note: exporting the pure `build*Assets`/`*IsDirty` helpers from the panel component files trips a Vite Fast-Refresh warning (full reload instead of hot-swap on edits to those two files) — zero production impact; kept because co-locating the render logic with its panel is the better structure than scattering it to satisfy HMR.

---

## Build / test sequence (agreed)

1. **Palette Studio session** → add "Export to Brand Board" (the `palette` payload). ← START HERE
2. **Brand Board session** → build the palette consumer; paste a real blob, test end to end with Palette Studio's dev server up.
3. Repeat per app: Signature → its consumer, Card → its consumer. One at a time, test each.
4. QR + Icon Kit need no source changes — wire their upload tiles into Brand Board whenever.

Meanwhile (independent of data): build Brand Board's **layout system** — the multiple composed "wireframe" layouts whose blocks are the slots these payloads fill. That work doesn't depend on the shapes being finalized, because each block is just a slot.
