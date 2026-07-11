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

## 5. Icon Kit → image upload only (NO JSON needed for v1)

Exports `favicons.zip` (svg/ico/PNGs 16–512 + maskable + manifest) and a separate 1200×630 og-image.png. The **logo mark** Brand Board wants is `icon-512.png` from the zip.

- Note: the **original hi-res logo is discarded** after rasterizing to favicon sizes. If you want a crisp large logo on the board, upload the source logo directly to Brand Board (it already has a logo upload), OR add a standalone `logo.png` export to Icon Kit later.

**Brand Board consumes:** the logo via its existing upload (source logo preferred over `icon-512.png` for crispness).

---

## Build / test sequence (agreed)

1. **Palette Studio session** → add "Export to Brand Board" (the `palette` payload). ← START HERE
2. **Brand Board session** → build the palette consumer; paste a real blob, test end to end with Palette Studio's dev server up.
3. Repeat per app: Signature → its consumer, Card → its consumer. One at a time, test each.
4. QR + Icon Kit need no source changes — wire their upload tiles into Brand Board whenever.

Meanwhile (independent of data): build Brand Board's **layout system** — the multiple composed "wireframe" layouts whose blocks are the slots these payloads fill. That work doesn't depend on the shapes being finalized, because each block is just a slot.
