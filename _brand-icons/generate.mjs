#!/usr/bin/env node
// Opsette Tools brand-icon generator.
// Reads the per-tool table below (mirrors ICONS_AND_BRANDING.md) and emits
// favicon.svg, favicon.ico, icon-192.png, icon-512.png per tool to
// ./output/<slug>/. Source Phosphor SVGs are fetched once and cached to
// ./sources/<slug>.svg.
//
// Usage:
//   node generate.mjs            # generate everything
//   node generate.mjs --dry-run  # list what would be produced, no writes

import { readFile, writeFile, mkdir, access, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Brand constants (from ICONS_AND_BRANDING.md)
const ICON_COLOR = "#2f4f46";
const BG_COLOR = "#fafafa";

// Per-tool icon mapping. Keep in sync with ICONS_AND_BRANDING.md.
// `phosphor` is the Phosphor file slug (kebab-case) under
// https://github.com/phosphor-icons/core/raw/main/raw/regular/<file>.svg
const TOOLS = [
  { slug: "streak-tracker",       name: "Streak Tracker",       phosphor: "flame" },
  { slug: "content-flow",         name: "Content Flow",         phosphor: "calendar-blank" },
  { slug: "process-checklist",    name: "Process Checklist",    phosphor: "list-checks" },
  { slug: "route-planner",        name: "Route Planner",        phosphor: "map-trifold" },
  { slug: "decision-wheel",       name: "Decision Wheel",       phosphor: "chart-pie-slice" },
  { slug: "objection-navigator",  name: "Objection Navigator",  phosphor: "chat-centered-dots" },
  { slug: "job-math",             name: "Job Math",             phosphor: "calculator" },
  { slug: "script-builder",       name: "Script Builder",       phosphor: "phone" },
  { slug: "digital-card",         name: "Digital Card",         phosphor: "identification-card" },
  { slug: "qr-creator",           name: "QR Creator",           phosphor: "qr-code" },
  { slug: "random-picker",        name: "Random Picker",        phosphor: "shuffle" },
  { slug: "review-request",       name: "Review Request",       phosphor: "star" },
  { slug: "receipt-maker",        name: "Receipt Maker",        phosphor: "receipt" },
  { slug: "signature-studio",     name: "Signature Studio",     phosphor: "signature" },
  { slug: "contact-capture",      name: "Contact Capture",      phosphor: "address-book" },
  { slug: "space-planner",        name: "Space Planner",        phosphor: "squares-four" },
];

const PHOSPHOR_BASE =
  "https://github.com/phosphor-icons/core/raw/main/raw/regular";

const SOURCES_DIR = path.join(__dirname, "sources");
const OUTPUT_DIR = path.join(__dirname, "output");

const DRY_RUN = process.argv.includes("--dry-run");

// ---------- helpers ---------------------------------------------------------

async function ensureDir(p) {
  if (DRY_RUN) return;
  await mkdir(p, { recursive: true });
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// Fetch Phosphor SVG to ./sources/<slug>.svg (cached). Returns the raw SVG
// string. We name the cache file by tool slug, not by Phosphor name, so
// re-mapping a tool to a different icon invalidates its cache.
async function fetchSource(tool) {
  const cachePath = path.join(SOURCES_DIR, `${tool.slug}.svg`);
  if (await fileExists(cachePath)) {
    return await readFile(cachePath, "utf8");
  }

  const url = `${PHOSPHOR_BASE}/${tool.phosphor}.svg`;
  if (DRY_RUN) {
    return `[would fetch ${url}]`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const svg = await res.text();
  await ensureDir(SOURCES_DIR);
  await writeFile(cachePath, svg, "utf8");
  return svg;
}

// Phosphor regular SVGs use currentColor for stroke + fill. Inject a `color`
// attribute on the root <svg> so they paint Opsette green wherever rendered.
// Also strip any width/height so the host can size them freely.
function recolorSvg(svg, color) {
  let out = svg;
  // Drop fixed width/height attrs on root <svg> (keep viewBox).
  out = out.replace(/<svg([^>]*?)\s+width="[^"]*"/, "<svg$1");
  out = out.replace(/<svg([^>]*?)\s+height="[^"]*"/, "<svg$1");
  // Inject color="..." on root <svg>. Replace if present, else add.
  if (/<svg[^>]*\scolor="[^"]*"/.test(out)) {
    out = out.replace(/<svg([^>]*?)\scolor="[^"]*"/, `<svg$1 color="${color}"`);
  } else {
    out = out.replace(/<svg/, `<svg color="${color}"`);
  }
  return out;
}

// Build a 512×512 (or 192×192) PNG: BG_COLOR canvas with the icon centered
// at ~60% canvas size, painted in ICON_COLOR.
async function renderPwaPng(svg, size, outPath) {
  const innerSize = Math.round(size * 0.6);
  // Render the recolored SVG at innerSize, transparent background.
  const iconBuf = await sharp(Buffer.from(svg), { density: 384 })
    .resize(innerSize, innerSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Composite onto a fafafa canvas.
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: iconBuf, gravity: "center" }])
    .png()
    .toFile(outPath);
}

// favicon.ico = 16×16 + 32×32, transparent background, icon in ICON_COLOR.
async function renderFaviconIco(svg, outPath) {
  const sizes = [16, 32];
  const pngs = await Promise.all(
    sizes.map((size) =>
      sharp(Buffer.from(svg), { density: 384 })
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    )
  );
  const ico = await pngToIco(pngs);
  await writeFile(outPath, ico);
}

// ---------- main ------------------------------------------------------------

async function main() {
  console.log(
    `${DRY_RUN ? "[DRY-RUN] " : ""}Opsette brand-icon generator — ${TOOLS.length} tools\n`
  );

  await ensureDir(SOURCES_DIR);
  await ensureDir(OUTPUT_DIR);

  for (const tool of TOOLS) {
    const outDir = path.join(OUTPUT_DIR, tool.slug);
    const faviconSvg = path.join(outDir, "favicon.svg");
    const faviconIco = path.join(outDir, "favicon.ico");
    const icon192 = path.join(outDir, "icon-192.png");
    const icon512 = path.join(outDir, "icon-512.png");

    if (DRY_RUN) {
      console.log(`[${tool.slug}]  Phosphor: ${tool.phosphor}`);
      console.log(`  fetch  ${PHOSPHOR_BASE}/${tool.phosphor}.svg → sources/${tool.slug}.svg`);
      console.log(`  write  ${path.relative(__dirname, faviconSvg)}`);
      console.log(`  write  ${path.relative(__dirname, faviconIco)} (16+32)`);
      console.log(`  write  ${path.relative(__dirname, icon192)} (192×192, ${BG_COLOR} bg)`);
      console.log(`  write  ${path.relative(__dirname, icon512)} (512×512, ${BG_COLOR} bg)`);
      console.log("");
      continue;
    }

    process.stdout.write(`[${tool.slug}] `);
    const rawSvg = await fetchSource(tool);
    const colored = recolorSvg(rawSvg, ICON_COLOR);

    await ensureDir(outDir);
    await writeFile(faviconSvg, colored, "utf8");
    process.stdout.write("svg ");

    await renderFaviconIco(colored, faviconIco);
    process.stdout.write("ico ");

    await renderPwaPng(colored, 192, icon192);
    process.stdout.write("192 ");

    await renderPwaPng(colored, 512, icon512);
    process.stdout.write("512 ");

    console.log("✓");
  }

  if (!DRY_RUN) {
    console.log("\nBuilding contact sheet…");
    await buildContactSheet();
    console.log("Done.");
  } else {
    console.log("\nAlso would write: output/_contact-sheet.png (4×4 grid of icon-512.png)");
  }
}

// 4×4 contact sheet of every tool's icon-512.png with the tool name labeled
// below each tile. 512px tile + 64px label gutter, on #fafafa background.
async function buildContactSheet() {
  const TILE = 512;
  const LABEL_H = 80;
  const PAD = 24;
  const COLS = 4;
  const ROWS = 4;
  const cellW = TILE + PAD * 2;
  const cellH = TILE + LABEL_H + PAD;
  const sheetW = cellW * COLS;
  const sheetH = cellH * ROWS;

  const composites = [];
  for (let i = 0; i < TOOLS.length; i++) {
    const tool = TOOLS[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * cellW + PAD;
    const y = row * cellH + PAD;

    const tilePath = path.join(OUTPUT_DIR, tool.slug, "icon-512.png");
    const tileBuf = await readFile(tilePath);
    composites.push({ input: tileBuf, left: x, top: y });

    // Label below tile, centered in the tile width.
    const labelSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${LABEL_H}">
         <style>
           .t { font: 600 28px 'Inter','Segoe UI',Arial,sans-serif; fill: #1a1a1a; }
         </style>
         <text x="50%" y="58%" text-anchor="middle" class="t">${tool.name}</text>
       </svg>`
    );
    composites.push({ input: labelSvg, left: x, top: y + TILE + 8 });
  }

  await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite(composites)
    .png()
    .toFile(path.join(OUTPUT_DIR, "_contact-sheet.png"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
