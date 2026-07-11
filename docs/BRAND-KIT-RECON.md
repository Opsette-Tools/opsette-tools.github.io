# Brand Kit Apps — Output Recon (reference)

**Owner:** Ruthnie / Opsette Tools · **Created:** 2026-07-11
**Purpose:** Full findings from reading what each kit app outputs today, so Brand Board can consume them. The frozen shapes derived from this live in `BRAND-KIT-INTEROP-CONTRACT.md` — this doc is the detailed reference (exact types, file:line, what's missing) to keep open while working in each app.

---

## Summary table

| App | Outputs today | Portable data? | Consumable now? | Small addition needed |
|---|---|---|---|---|
| Palette Studio | CSS-vars / Tailwind / AntD strings + brand-kit PNG. No JSON. | Rich `Palette` object in memory; fonts separate. Not exported as JSON. | Only via lossy CSS-vars parse | **"Copy as JSON"** (colors + roles + scales + font + kitName) |
| Signature Studio | Clipboard HTML (self-contained, email-safe) + plain text. 21 templates. No image. | `SignatureData` + `templateId`; HTML iframe-ready. Has kit-mode share. | **Yes — HTML → `<iframe srcdoc>`** | Optional: `{templateId, data}` JSON, or `signature_preview.png` |
| Digital Card | Web PNG (2×) + print PNG (300 DPI) + vCard + share URL. 9 templates. | `CardData` round-trips base64. PNG is ephemeral. | Data yes; image ephemeral | **"Copy card data JSON"**; add real `logo` field |
| QR Creator | PNG or SVG at chosen size, full styling baked in. | `QRConfig` exists, never serialized. | **Yes — uploaded PNG/SVG** | None for v1 |
| Icon Kit | `favicons.zip` (svg/ico/PNG 16–512 + maskable + manifest) + 1200×630 og-image.png. | No metadata export. Source logo discarded. | **Yes — `icon-512.png`** | Optional: standalone `logo.png` |

## Three cross-cutting facts
1. **Every app is client-side, download-only — nothing hosted or fetchable.** Brand Board can never auto-pull; the user hands it the output (paste JSON or upload image). Fits the "plug it in" pipeline.
2. **Two consumption paths by asset type:** data-paste (Palette, Signature, Card — rich portable objects → re-render, live/sharp) vs. image-upload (QR, Icon Kit logo — just drop the file).
3. **All gaps are tiny, additive, on the source apps — not Brand Board.** No app needs restructuring.

---

## Palette Studio (detail)
- `Palette` type at `harmony.ts:180-204`: `base, rule, vibrancy, temperature, primary, secondary, accent, accent2?, neutrals(Scale), primaryScale(Scale), accentScale(Scale), roles{background,surface,text,heading,mutedText,border}, custom?`.
- `Scale` = 10-stop `Record<50..900, hex>` (`color.ts:100`). Colors normalized lowercase `#rrggbb`. `accent2` only for tetradic.
- **Fonts NOT in `Palette`** — carried separately as `FontPair` (`presets.ts:12-20`: `{id,label,heading,body,headingFamily,bodyFamily,googleHref}`), passed to `ExportPanel` alongside palette.
- Exports (`exporters.ts` + `ExportPanel.tsx`): `toCssVars` (`:root{}` — most complete, all roles + 3 scales), `toTailwind`, `toAntd`, + brand-kit PNG (html-to-image). Per-swatch click copies one hex.
- **No JSON / blob / toJSON / "copy all" of the `Palette` object.** localStorage (`palette-studio:v1`) holds only the seed `{baseHex,rule,vibrancy,temperature,fontPairId}`, not the resolved palette, and nothing from custom mode.
- Custom mode: `CustomRole` (`harmony.ts:244-252`: pageBg|sectionBg|bodyText|heading|button|accent|secondaryText|border), `CustomColor {hex, role, name?}` (`:254-259`). `buildCustomPalette` stashes raw input on `palette.custom` (`:421`). Custom **names** live only here — not in any text export.
- **Ideal add:** `toKitJson` emitting `{...palette, scales, font, kitName}` + an "Export to Brand Board" button. Data already in memory at `ExportPanel.tsx:115`.

## Signature Studio (detail)
- **21 templates** (README says 35+, code ships 21) in 7 categories, `src/data/templates/*` aggregated in `index.ts:10`. `LayoutType = stacked|two-column|card|inline|banner|footer`.
- `SignatureTemplate` (`types/template.ts:20-32`) has `renderHtml(data)=>string` + `renderPlainText(data)=>string` + metadata.
- **Output is string-only, via clipboard** — no file, no image. `CopyPanel.tsx`: "Copy rich" (ClipboardItem text/html + text/plain), "Copy HTML", "Copy plain text", "Share link". 8KB Outlook-clip warning.
- **HTML is fully self-contained:** inline styles, table-based, no `<style>`/`<head>`, icons inlined as `data:image/svg+xml`, logo/photo as base64 data URLs. Directly droppable into an iframe.
- `SignatureData` (`types/signature.ts:1-38`): identity/contact/media(`logoUrl,logoDataUrl,profileImageDataUrl`)/6 socials/CTA/disclaimer/`accentColor` (default `#4f46e5`). All strings. `SavedSignature` wraps it, max 3.
- Already has `shareLink.ts` URL-hash **kit-mode** share (`SharePayload {v,mode,t,d,stripped?}`, lz-string+Zod) sharing company branding only — a "brand kit" concept exists.
- **No PNG/raster export at all.**
- **Ideal add:** "Export to Brand Board" copying `{templateId, data, html: renderHtml(data)}`. Optional `signature_preview.png`.

## Digital Card (detail)
- **9 templates** (`CardStyle`, `types/card.ts:1`): 5 business (`modern,clean,bold,minimal,neon`), 3 contact (`profile,split,stacked`), 1 handout. Sizes in `print.ts:14-20`.
- Exports (`ActionBar.tsx`): share URL (base64 `CardData` minus photo → `#/?data=`), vCard `.vcf` (VCARD 3.0, embedded base64 PHOTO + socials), **web PNG** (html-to-image 2×, transparent), **print PNG** (300 DPI, business+handout only), QR PNG (encodes vCard or ctaUrl).
- **PNG is ephemeral** — download-only, never stored/hosted; Brand Board can't fetch it.
- `CardData` (`types/card.ts:12-59`): name/title/business/phone/email/website + 8 socials + address + `photo`(base64) + `accentColor`(one hex) + style/size + handout promo fields + font fields. Round-trips via `share.ts` encode/decode.
- **No dedicated `logo` field** (only person `photo` or initials). **One `accentColor`**, no palette. Photo stripped from share hash.
- **Ideal add:** "Copy card data JSON"; consider a real `logo` field distinct from `photo`. For v1 Brand Board, uploaded web-PNG is simplest.

## QR Creator (detail)
- Lib: `qr-code-styling` v1.9.2. Exports via `window.__qrDownload` (`QRPreview.tsx:110-129`): **PNG download**, **SVG download**, **PNG blob → clipboard**. Export size = `config.size` 200–600px (default 300); SVG is vector.
- Styling: fg/bg hex, 3 presets (`classic|rounded|branded`, branded has gradient), center **logo** (data URL, imageSize 0.3), border toggle, ECL fixed `H`.
- `QRConfig` (`types/qr.ts:3-12`): `{url,label,preset,fgColor,bgColor,size,includeBorder,logoDataUrl}`. Encodes a **URL only**. `label` is caption, not encoded. localStorage library stores config (incl. logo data URL), not rendered image.
- **No data-URL/JSON export; `qr-code-styling` not a shared dep.**
- **v1: consume the user-exported SVG (preferred) or PNG upload.** No source change needed.

## Icon Kit (detail)
- Two tabs. **Favicon** → `favicons.zip` (JSZip): `favicon.svg`, `favicon.ico` (16/32/48), `favicon-16/32.png`, `apple-touch-icon.png`(180 opaque), `icon-192/512.png`, `icon-512-maskable.png`(opaque+padding), `site.webmanifest`, `README.txt`. **Social** → `og-image.png` fixed 1200×630 (text card, not a logo).
- Input: initials (default "OP") / emoji / **upload logo** (PNG/JPG/SVG → data URL, drawn contained). Upload optional.
- **No profile/avatar export** (a 50%-radius favicon is circular but only ships inside the zip at ≤512). **Original hi-res logo discarded** after rasterizing. **No brand-color metadata export.**
- Output is browser-download only; no programmatic handoff.
- **v1: Brand Board uses its own logo upload (source logo, crisper) or `icon-512.png` from the zip.** Optional add: standalone `logo.png`/`profile.png`.
