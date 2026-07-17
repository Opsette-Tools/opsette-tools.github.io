# Kit Suite — Connecting the Tools (three mechanisms)

**Owner:** Ruthnie / Opsette Tools
**Created:** 2026-07-16
**Status:** PLAN ONLY — not built. Take into a parallel build session (all dev servers up at once).
**Supersedes:** the earlier `KIT-SUITE-DEEPLINK-PLAN.md` framing (deep-link is now just one of three mechanisms below).
**Depends on:** `BRAND-KIT-INTEROP-CONTRACT.md` — the frozen JSON shapes + every app's existing `fromKitJson` (export + reopen) paths. **None of the shapes change.** This is all *transport* on top of what already ships.

---

## The goal

A real paid job = "build someone a little brand kit." Today that means 6 browser tabs, typing the same brand facts into each, copying blobs out, pasting into Brand Board. This plan cuts steps three ways. The mechanisms **layer** — they're not competing; each tool can get whichever fit it.

| # | Mechanism | Solves | Cost | Tabs? | Data size |
|---|---|---|---|---|---|
| **1** | **Brand core in a URL** | Re-typing name/logo/colors into every tool | Cheap | New tab | Tiny (fits URL) |
| **2** | **Clipboard deep-link** | Reopening an *existing* asset to revise it | Medium | New tab | Any size (clipboard courier) |
| **3** | **Iframe modal** | Editing an asset *without leaving Brand Board* | Heavier | **No tab** | **Any size** (same-origin postMessage) |

**Recommended build order:** #1 first (cheapest, kills the most typing), then **#3 on Palette Studio only** as a prototype (the "one app" feeling — validate it before fanning out), keep #2 as the universal fallback. Details per-mechanism below.

---

## Mechanism 1 — Brand core in a URL (build first)

**The friction it kills** (Ruthnie's words): starting a client kit means the same 4 facts — **brand name, tagline, logo, palette colors** — get typed into every tool by hand, and you're flipping tabs going "wait, what did I type over there?"

**The fix:** a tiny **brand-core** seed — `{ name, tagline, logo, colors, fonts }`, no baked images — small enough to ride in a URL. Set it once; every other tool opens **pre-seeded** so its starting canvas already looks like the client instead of blank defaults.

- This is **seed a NEW asset**, distinct from mechanism 2's "reopen THIS asset." Front-loads the four facts you'd otherwise re-enter five times.
- Logo is the worst repeat (re-uploaded 4×). A small logo *can* exceed a comfy URL length — so: if the logo dataURL is under ~4 KB, inline it; otherwise seed name/tagline/colors/fonts via URL and let the tool prompt for the logo once. (Or pair with the clipboard for the logo specifically.) Note this fork in the build.

**URL shape:**
```
tools.opsette.io/icon-kit/?seed=<base64(brandCore)>
```
On load, a tool checks `?seed=`, decodes the brand core, and pre-fills name/tagline/colors/fonts (+ logo if present). Everything else stays default. Pure additive — no seed param = today's behavior unchanged.

**"New client kit" starter (the front door):** one screen — type name, tagline, drop logo, pick a seed color → generates the brand core → hands you pre-seeded links to each tool. Turns "set up 6 tabs" into "fill one form." Lives in Brand Board (or the apex landing). Build after the per-tool `?seed=` reader works.

---

## Mechanism 2 — Clipboard deep-link (the universal fallback)

**What it does:** reopen an *existing* asset (to revise it) in a new tab, at any blob size.

**Why not just put the blob in the URL:** baked-image blobs are huge — palette carries a PNG+PDF, a card kit hit **16.8 MB**; URLs cap ~8–32 KB. So the blob can't ride the URL.

**How it works — the URL is a note that says "look at the clipboard," it carries no data:**
1. Brand Board copies the stored blob to the clipboard (`writeText` — it already does this) AND opens the tool at `…/<slug>/?reopen=clipboard&from=brand-board`.
2. The tool, on load, sees `?reopen=clipboard`, reads the clipboard (`readText`), and feeds the text to its **existing `fromKitJson`** — the same function its paste-to-reopen box already uses.

**Honest caveat:** browsers won't let a page silently read the clipboard on load (privacy). So the tool shows a **one-tap "Load from Brand Board" banner**; the read happens on that tap. 2 clicks vs. today's 5. On Chromium desktop, once clipboard-read is granted once, later loads can be automatic.

**The reopen-only slim payload insight:** reopen needs only the lightweight *inputs* (base/rule/font), never the baked images (Brand Board holds those for display). So for small apps (Palette, QR) a slim reopen blob fits in a URL — an optional true-zero-click fast-path (`?reopen=url&kit=<slim>`). Layer on later; clipboard is the floor.

---

## Mechanism 3 — Iframe modal (the "one app" feeling — no tab, full data)

**This is the one that actually removes the tabs.** Brand Board opens a modal; inside it loads e.g. `palette-studio/` in an `<iframe>`. You edit the palette right there, in Brand Board, no new tab. Done → the palette flows straight back into the board.

### Why it works cleanly HERE specifically: same-origin

Full data passes between an iframe and its parent (via `postMessage`) only when both are the **same origin** (protocol + domain + port). Your tools are all `https://tools.opsette.io/<slug>/` — **same origin.** That's the green light:

- **No size limit** — `postMessage` carries the full blob, baked images and all. The URL/clipboard size problem *vanishes* inside the frame.
- **No permission prompt** — no clipboard involved.
- **Feels like one app**, not a jump to another.

This is the payoff of the apex+routes hosting: because everything lives under one subdomain, iframing is friction-free. If a tool lived on a different domain, it'd be cross-origin and locked.

### ✅ Hosting confirmed clear (checked 2026-07-16)

- **GitHub Pages sends no `X-Frame-Options` by default** — tools are embeddable out of the box.
- **Verified:** grepped all kit tools' `index.html` — **none** carry `X-Frame-Options` or a CSP `frame-ancestors` meta tag. Nothing blocks framing today. (Re-check with `grep -rniE "x-frame-options|frame-ancestors" */index.html` before building if anything changed.)
- All of this is pure client-side (iframe + postMessage) — **no server, no backend, works on static GitHub Pages.**

### The postMessage contract (new, small, per embeddable tool)

Parent (Brand Board) and child (tool) agree on two messages:

```ts
// Brand Board → tool, after the iframe loads: hand it the current blob (or nothing = fresh)
{ source: "opsette-embed", kind: "load", payload: <the full blob> }

// tool → Brand Board, when the user saves inside the modal: hand the revised blob back
{ source: "opsette-embed", kind: "save", payload: <the revised blob> }
```

- Tool detects it's embedded via `?embed=1` (or `window.parent !== window` + an origin check on the message). On `load`, it runs its existing `fromKitJson`/reopen. On the user's Save/Export, instead of (or in addition to) downloading, it `postMessage`s `kind:"save"` up. Brand Board re-ingests via its existing `type`-routed ingest.
- **Always verify `event.origin === "https://tools.opsette.io"`** on both sides before trusting a message — the one security must-do with postMessage.

### The two real costs (not blockers, just work)

1. **`?embed=1` chrome-hiding mode** per tool — hide the tool's own header/footer/share/About when embedded, so the modal reads as one app, not "an app inside an app." Small, cosmetic, per-tool.
2. **Each embeddable tool needs the postMessage listener + save-emitter.** More per-tool wiring than mechanism 2's "read clipboard on load," but it reuses the same `fromKitJson`/export underneath.

### Recommendation: prototype on Palette Studio ↔ Brand Board FIRST

Palette is the asset you revise most and has the cleanest reopen. Build the modal + `?embed=1` + postMessage on that one pairing, live in it, and decide if the feeling justifies fanning out. If the embedded chrome or messaging turns fussy, you've spent it on one tool and mechanism 2 is still the floor.

---

## Per-tool wiring summary (all additive, all reuse existing export/reopen)

| Tool | Slug | Seed reader (#1) | Clipboard reopen (#2) | Iframe embed (#3) |
|---|---|---|---|---|
| **Palette Studio** | `palette-studio` | ✅ name/tagline/colors/fonts | ✅ `reopenFromPaste` exists | ⭐ **prototype here first** |
| **QR Creator** | `qr-creator` | ✅ (colors → fg/bg) | ✅ config restore | phase 2 |
| **Digital Card** | `digital-card` | ✅ name/logo/colors | ✅ `setCard` | phase 2 |
| **Signature Studio** | `signature-studio` | ✅ name/logo/colors | ✅ (clipboard only — carries full html) | phase 2 |
| **Icon Kit** | `icon-kit` | ✅ name/logo/colors | ✅ `fromSocialKitJson` (clipboard only) | phase 2 |
| **Brand Board** | `brand-board` | — (the hub/launcher) | emits `?reopen=clipboard` links + inbound handler | **the modal host** |

**Shared bits to build once:** a `brandCore` type + `encodeSeed`/`decodeSeed`, a `readReopenIntent`/`clearReopenParams` helper, the postMessage `load`/`save` contract with the origin check, and a `SLUGS` map. Decide: `_shared` import vs. a ~30-line copy per app (lean `_shared` if the apps already consume it).

---

## What this deliberately does NOT do

- **No backend, no shared DB, no live tab-to-tab sync.** Live sync needs a server or a shared-worker mess and solves a problem you don't have (kits are built once, not co-edited). The project file + these three mechanisms give ~95% of the feeling at ~5% of the cost.
- **No change to the frozen JSON shapes.** Transport only.
- **No promise of silent zero-click for the clipboard path.** One-tap fallback, honestly.
- **The `.opsette-kit.json` project file remains the real "full data" store** — the durable per-client archive. These mechanisms move data across a *click*; the file holds the whole kit losslessly. Brand Board's "Open Project" is the front door to a returning client.

---

## ✅ SHIPPED — Mechanism 1 (Brand core in a URL), 2026-07-17

Built end to end across all six repos, typechecked (`tsc -b`) clean everywhere, vendored copies verified in sync. **Awaiting production build + commit.**

**The shared module (vendored, not imported — repos can't cross-import at build time):**
- `_shared/opsette-kit-link/opsette-kit-link.ts` is the canonical master; `_shared/opsette-kit-link/sync.mjs` pushes a byte-identical copy into each tool at `src/lib/opsette-kit-link.ts` (Signature Studio: `src/utils/`), exactly like `_shared/fonts`, `opsette-share`, `opsette-header`, `opsette-bridge`. Run `node _shared/opsette-kit-link/sync.mjs` to re-sync, `--check` to verify. The `_shared/` master is local-only; the vendored copies are committed inside each app repo.
- It carries: `BrandCore` type; `encodeSeed`/`decodeSeed` (URL-safe base64, with the **4 KB logo threshold** — `LOGO_SEED_MAX_BYTES`, fork #1 below, locked in); `readSeedFromUrl` / `readReopenIntent` / `isEmbedded` / `clearLinkParams`; `buildSeedLink`; a `SLUGS` map; and the **Mechanism 3 postMessage contract already stubbed** (`EmbedLoadMessage`/`EmbedSaveMessage`, `isTrustedEmbedMessage` with the origin guard, `embedLoad`/`embedSave`) so wiring the iframe later is small. Pure additive — no `?seed=` = today's behavior, unchanged.

**Per-tool seed readers** (each maps the generic core to its own state via a tool-local `seed.ts` adapter, kept OUT of the shared module so it stays tool-agnostic; the seed WINS over the last-saved state so arriving from the starter opens on THIS client, and the URL param is cleared after so a refresh falls back to normal):
- **Palette Studio** — `colors[0]` → base hex, `fonts.id` → font pairing. (`src/lib/seed.ts`, wired in `App.tsx`.)
- **QR Creator** — primary → `fgColor`, a `background`-role color → `bgColor`, name → `label`, small logo → `logoDataUrl`. (`src/lib/seed.ts`, `pages/Index.tsx` lazy init.)
- **Digital Card** — name → `businessName`, tagline → `title`, primary → `accentColor`, small logo → `photo` (no distinct logo field). Seed sits above localStorage, below the `?data=` share param. (`src/lib/seed.ts`, `pages/Index.tsx`.)
- **Signature Studio** — name → `company`, tagline → `tagline`, primary → `accentColor`, small logo → `logoDataUrl`. Seeded inside `loadDraft()`. (`src/utils/seed.ts`, `hooks/useSignatureForm.ts`.)
- **Icon Kit** — applied ONCE at App mount by merging into BOTH panels' localStorage keys before they hydrate (the panels re-mount on every tab switch, so props would re-fire; localStorage is the race-free channel). Social: name → headline, tagline → subhead, logo → watermark, primary → bg/accent. Favicon: name → appName + initials fallback, primary → bgColor, logo → image tab. Defaults the tab to **Social** when seeded. (`src/lib/seed.ts`, `App.tsx`.)

**The "New client kit" starter** (`brand-board/src/components/NewClientKitModal.tsx`) — the front door. Opens from the header **Kit ▾** menu. Pre-fills name/tagline/logo/color/font **from the current board** (so a pasted palette means the color + font come free), lets you edit them, and hands out a pre-seeded link per tool (open-in-new-tab + copy per link + Copy-all). On localhost the links target the running dev servers (port map from `DEV_SERVERS.md`); deployed, they target the apex. The **4 KB logo alert** fires when the logo's too big to inline.

**Also this session (Ruthnie's live feedback):**
- **Header decluttered** — the 5 loose buttons (New kit · Open · Save · PNG · PDF) collapsed into two dropdowns: **Kit ▾** (New client kit · Open · Save · ─ · Clear board) and **Download ▾** (PNG · PDF).
- **Clear board / Reset** — new destructive-confirm action in the Kit menu. Resets to `emptyBoard()`, which the autosave effect then persists, so a refresh STAYS empty (fixes "stuck with the last kit on the dev server, no way to start clean"). Never touches a saved `.opsette-kit.json`.
- **Alert opacity fix** — the "logo too big" alert was a murky green because Brand Board themes `colorInfo: "#2f4f46"`; switched to a clean `warning` (amber), also more correct semantically.

### Deferred convenience (Ruthnie's idea — NOT critical, circle back when it's an actual inconvenience)

Move the seeded **"Open in [Tool]"** link OUT of the modal and INTO each collapsible left-panel asset section (Palette / Signature / QR / Card / Social), beside the buttons already there — where your hand already is when you think "go make the signature." The modal stays as the "spin up everything at once" launcher; the per-section link is the per-tool convenience. **Blocked on a design cleanup first:** the section action buttons are currently inconsistent and need a thoughtful pass before adding a third — Import + Copy everywhere, but QR and Digital Card also have **Remove** (Digital's is on a second row), and Social/Icon Kit has **Upload images**. Options floated: minimize Import/Copy to **icon-only** or **stack** them to make room. Do the button-consistency pass, THEN add the seeded link. Seed-only (Mechanism 1) for these links — the "reopen the existing blob" version is really Mechanism 2, deferred.

---

## ✅ SHIPPED — Mechanism 3 (Iframe drawer), Palette Studio prototype, 2026-07-17

Built and **verified live** (Ruthnie: "This is killer. Love it."). Palette Studio now embeds inside Brand Board in a resizable side drawer; editing a palette in-place and hitting Save emits the revised blob straight back onto the board — no new tab, no copy/paste. Both repos typecheck (`tsc -b`) clean. **Awaiting production build + commit.**

**The drawer chose a maskless right-side Drawer over a modal** (per the plan's recommendation) so the board stays live beside the editor — the "one app" feeling. Made **generic and reusable** (`ToolEmbedDrawer`) from the start, because the same shell fans out to Card/Signature/QR/Icon Kit next.

**Palette Studio (`?embed=1` embed mode):**
- Hides its own header/footer/intro; a slim green "Editing your palette · Save to Brand Board" bar (`components/palette/EmbedSaveBar.tsx`) replaces the header.
- On mount posts a `ready` ping up, then listens for the parent's `load` message → runs the existing `reopenFromPaste`. Origin-checked (`isTrustedEmbedMessage`, dev localhost added only under `import.meta.env.DEV`).
- **Save-emits the same baked blob as "Export to Brand Board"** — the blob-builder was lifted out of `ExportPanel` into one `buildKitBlob` (published up via `onBuildBlobReady`), so the clipboard export and the postMessage save can't diverge (PNG + PDF baked in both).
- In embed mode it **won't** seed from URL, restore this device's last palette, or persist — so editing a client's palette in the drawer never clobbers the user's own standalone palette. (`App.tsx`.)

**Brand Board (`components/ToolEmbedDrawer.tsx` — the reusable host):**
- Maskless right drawer. A thin Brand-Board toolbar on top carries the tool title + a real **close (X)** — needed because a maskless drawer has no backdrop to click away, and the tool's own bar only offers Save. **Closing never emits; only the in-frame Save pushes a revision.**
- **Drag-resizable from the left edge**, width clamped to [380px, 92vw], **persisted per-tool** to `localStorage` (`opsette-embed-w:<slug>`) so it reopens the size you left it. (Added after Ruthnie flagged 620px is too narrow for the Social/Brand assets that Icon Kit will feed.)
- Sends the current blob down on the child's `ready`/`onload`; receives `save` up → hands it to the caller. `BrandBoardApp.applyRevisedPalette` **confirms** ("Apply the revised palette?") before ingesting via the existing `ingestPalettePayload`, then closes the drawer. (Fork #3 resolved: confirm, not silent auto-apply.)
- Trigger lives in the palette Collapse section: **"Edit palette in Palette Studio"** leads; the manual paste box stays below as the fallback. (`components/board/BoardForm.tsx`, `onEditPalette`.)

**Live-verify notes (Ruthnie, 2026-07-17):** save-emit-to-board confirmed working end to end. One transient: the first `load` handshake looked stale (dev server left running overnight) — resolved itself on a fresh open, and every subsequent load carried the board's palette in correctly. Watch this once more after the production build; harden the ready/onload timing if it recurs.

---

## ✅ SHIPPED — Mechanism 3 FULL FAN-OUT (all 5 tools), 2026-07-17

The prototype fanned out to every embeddable tool the same session. **All six repos typecheck (`tsc -b`) clean; shared module in sync. Awaiting production build + commit + Ruthnie's per-tool verify.**

**Drawer upgrades (from Ruthnie's live feedback on the prototype):**
- **Close (X)** — the maskless drawer had no way to back out (no backdrop to click, only Save). Added a thin Brand-Board toolbar (tool title + close X) above the iframe. Closing never emits; only the in-frame Save pushes a change.
- **Drag-resizable** left edge, width clamped [380px, 92vw], **persisted per tool** (`opsette-embed-w:<slug>`). Icon Kit's Social assets get a wider default (900px); Signature 720; Card 680; Palette/QR 620.
- **Fixed the "drag never releases" bug** — an `<iframe>` swallows mouse events, so once the cursor crossed into it the parent never saw `mouseup` and the drag stuck on (even across monitors). Fix: a transparent full-drawer **shield** (pointer-events) while dragging keeps every event in the parent doc, plus `blur`/`mouseleave` bailouts. Live width readout while dragging.

**Brand Board host generalized:** `ToolEmbedDrawer.tsx` (reusable, not palette-specific) + a registry `components/board/embedTools.ts` — one entry per tool (slug, dev port, title, default width, `currentBlob` reader, `apply` via the existing `ingest*` path). BrandBoardApp holds one `drawerTool` state + one confirm-then-apply handler. `BoardForm` shows an **"Edit in <Tool>"** primary button atop every asset section (palette/signature/qr/card/social), manual paste kept below as fallback. Adding a tool = one registry entry + it's covered.

**Per-tool embed mode (each: `?embed=1` chrome-hide + `load` listener reusing existing reopen + save-emit reusing existing export, posting `embedSave` up):**
- **Digital Card** (Ant, HashRouter, port 8104) — `pages/Index.tsx`; load → `fromKitJson` → `setCard`; save bakes `renderWebImage` + `toKitJson` (PNG + .vcf). New `EmbedSaveBar` (Ant). **Also fixed a config deviation:** its `vite.config.ts` hardcoded `base:"/digital-card/"` for BOTH dev and build (off-pattern) — the dev server 302-redirected `/?embed=1` → `/digital-card/?embed=1`. Converted to the canonical `command === "build" ? "/digital-card/" : "/"`. **Digital Card's dev server needs a restart** to serve at `/` (the redirect preserves `?embed=1` so the drawer works either way meanwhile).
- **Signature Studio** (Ant, BrowserRouter, port 8114, shared module under `src/utils/`) — chrome hidden in `AppShell`; load → `fromKitJson` → `replaceAll` + `setSelectedTemplateId` (context setters directly, **skipping the reopen modal's `navigate("/")`** — no surprise routing in the frame); save `toKitJson(template, data)`. Forces the inline preview to show when embedded even at narrow widths. New `EmbedSaveBar` (Ant).
- **QR Creator** (shadcn/Tailwind, HashRouter, port 8108) — `pages/Index.tsx`; captures `isEmbedded()` in a `useMemo` **before** the `clearLinkParams` effect strips `?embed=`; load → `fromKitJson` → `setConfig`; save `await toKitJson(config)`. Hides footer + "Reopen a saved QR" + the QRLibrary when embedded. Its `EmbedSaveBar` uses the **shadcn Button + lucide** (no Ant).
- **Icon Kit** (Ant, port 8118) — the hard one. Its two panels hydrate from localStorage at mount, and a postMessage `load` arrives AFTER mount, so the seed's pre-mount merge can't be reused directly. Solution: new `applyEmbedBlob(raw)` in `lib/seed.ts` reuses the reopen recipe (`fromSocialKitJson` → `configForTab`) to merge the blob's per-tab configs into both localStorage keys, then App bumps a `loadNonce` that **keys the panels so they remount and re-hydrate branded**. Save uses `buildCombinedExport("both", tab, liveState)` (baked PNGs + per-tab reopen configs) read from localStorage. App split into `IconKitInner` for `App.useApp()`. New `EmbedSaveBar` (Ant). **Verify hardest** — the remount-on-load path is the novel bit.

**Verify checklist (Ruthnie, per tool):** open each tool's "Edit in <Tool>" from Brand Board → drawer loads carrying the board's current asset → edit → "Save to Brand Board" → confirm → the board updates. Watch the Icon Kit load (remount) and the Signature narrow-width preview specifically.

---

## Open product forks for Ruthnie (not code)

1. **Logo in the seed URL:** inline when small, else prompt once in the target. Confirm the ~4 KB threshold feel.
2. **Iframe fan-out:** after the Palette prototype, which tools are worth embedding vs. left on the new-tab deep-link? (Icon Kit's heavy UI may be happier in its own tab.)
3. **Return auto-ingest:** when a revised blob comes back (clipboard or postMessage), auto-apply or one-tap confirm? Recommend **confirm**, so an accidental return can't silently overwrite board edits.
4. **New-client-kit starter home:** in Brand Board, or on the apex landing as the suite's front door? Recommend **Brand Board** (it already holds the kit + project file).
