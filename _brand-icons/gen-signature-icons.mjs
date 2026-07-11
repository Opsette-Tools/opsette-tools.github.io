#!/usr/bin/env node
// Signature Studio icon generator.
//
// Gmail/Outlook strip inline data:image/svg+xml, so signature icons must be
// HOSTED raster PNGs. This renders the same glyph paths used by
// signature-studio/src/utils/renderSignatureHtml.ts into PNGs under
//   ../signature-icons/
// which GitHub Pages serves at https://tools.opsette.io/signature-icons/.
//
// Output naming:
//   social-<key>.png            brand-colored social glyph (fixed color)
//   contact-<key>-<colorkey>.png contact glyph tinted for each preset accent
//
// Icons are rendered at 2x (retina): a 16px display icon → 32px PNG, etc.
// We render at a generous 64px so any display size 13–24px stays crisp.

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "signature-icons");

// The raster size we bake. 64px covers every display size (13–24px) at 2x+.
const PNG_SIZE = 64;

const SOCIAL = {
  linkedin: { color: "#0A66C2", path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.74v20.51C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.74C24 .78 23.2 0 22.22 0z" },
  twitter: { color: "#000000", path: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.49l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z" },
  instagram: { color: "#E4405F", path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.91.56-.79.31-1.46.72-2.13 1.38A5.9 5.9 0 0 0 .63 4.14c-.3.76-.5 1.63-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.67.66 1.34 1.07 2.13 1.38.76.3 1.63.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.63-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm7.85-10.41a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" },
  facebook: { color: "#1877F2", path: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" },
  youtube: { color: "#FF0000", path: "M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.8zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" },
  tiktok: { color: "#000000", path: "M19.32 5.56a5.07 5.07 0 0 1-1.06-.11 5.18 5.18 0 0 1-3.16-2.4 5.05 5.05 0 0 1-.77-2.45V.5h-3.4v13.6a3.06 3.06 0 0 1-5.5 1.84 3.06 3.06 0 0 1 3.06-4.78V7.7a6.46 6.46 0 0 0-6.46 6.46A6.46 6.46 0 0 0 8.5 20.62a6.46 6.46 0 0 0 6.46-6.46V7.06a8.55 8.55 0 0 0 4.86 1.5V5.56z" },
};

const CONTACT = {
  email: "M3 5.5h18c.55 0 1 .45 1 1v11c0 .55-.45 1-1 1H3c-.55 0-1-.45-1-1v-11c0-.55.45-1 1-1zm1.6 1.5L12 12.2 19.4 7H4.6zM20 9.1l-7.4 5.2c-.36.25-.84.25-1.2 0L4 9.1V17h16V9.1z",
  phone: "M6.6 2.5c.5 0 .95.3 1.13.78l1.2 3.1c.16.42.06.9-.27 1.2L7.2 9.1c1.02 2 2.7 3.68 4.7 4.7l1.5-1.46c.3-.33.78-.43 1.2-.27l3.1 1.2c.48.18.78.63.78 1.13V19c0 1.1-.9 2-2 2-8.28 0-15-6.72-15-15 0-1.1.9-2 2-2h2.62z",
  web: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.9 6h-2.95a15.6 15.6 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.9 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82A13.7 13.7 0 0 1 12 4.04zM4.26 14a8 8 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26zm.84 2h2.95c.34 1.27.8 2.46 1.38 3.56A8.03 8.03 0 0 1 5.1 16zm2.95-8H5.1a8.03 8.03 0 0 1 4.33-3.56A15.6 15.6 0 0 0 8.05 8zM12 19.96A13.7 13.7 0 0 1 10.09 16h3.82A13.7 13.7 0 0 1 12 19.96zM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.27 5.56c.58-1.1 1.04-2.29 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38a8 8 0 0 1 0 4h-3.38z",
  address: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
};

// Contact-icon accent colors: the 6 Brand-tab presets + a neutral fallback.
// The colorkey is the hex without the leading '#', lowercased. The app maps a
// signature's accent to the nearest of these (exact preset match, else neutral).
const CONTACT_COLORS = {
  "c2410c": "#c2410c", // rust
  "4338ca": "#4338ca", // indigo
  "0f766e": "#0f766e", // teal
  "be123c": "#be123c", // crimson
  "0e1420": "#0e1420", // ink
  "7c3aed": "#7c3aed", // violet
  "4f46e5": "#4f46e5", // legacy indigo default
  neutral: "#5b6478", // fallback for any custom color
};

function svg(pathD, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${color}"><path d="${pathD}"/></svg>`;
}

async function renderPng(svgStr, outPath) {
  const buf = await sharp(Buffer.from(svgStr), { density: 384 })
    .resize(PNG_SIZE, PNG_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(outPath, buf);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let count = 0;

  for (const [key, { color, path: p }] of Object.entries(SOCIAL)) {
    await renderPng(svg(p, color), path.join(OUT, `social-${key}.png`));
    count++;
    // White variant, for social icons sitting on a colored bar (Contact Rail).
    await renderPng(svg(p, "#ffffff"), path.join(OUT, `social-${key}-white.png`));
    count++;
  }

  for (const [key, p] of Object.entries(CONTACT)) {
    for (const [ckey, hex] of Object.entries(CONTACT_COLORS)) {
      await renderPng(svg(p, hex), path.join(OUT, `contact-${key}-${ckey}.png`));
      count++;
    }
  }

  console.log(`Wrote ${count} PNGs to ${path.relative(process.cwd(), OUT)} (${PNG_SIZE}px each)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
