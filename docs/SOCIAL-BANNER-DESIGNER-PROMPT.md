# Social Banner Designer — build prompt / spec

Purpose: this is (a) a **taste-probe prompt** to paste into Lovable to see whether a
design-first tool can render the layouts Ruthnie actually wants, and (b) the **spec
for the real build** — a standalone Ant Design + React repo, separate from Icon Kit.

Why a separate tool: Icon Kit stays focused on logos + favicons. The social/banner
designer becomes its own thing. Whatever renders well in the probe gets rebuilt
properly in the Ant stack (positioned CSS/DOM layouts + rasterized export), NOT
kept as Lovable's default Tailwind output.

The point of the probe: the previous canvas layouts failed by being "blocked-in" —
every element in its own safe rectangle, and each new layout was just an existing
primitive relabeled (a promo that's the highlight-marker recolored, a credential
that's just a left border). The prompt below forbids exactly that and demands real
compositional design, so the probe result is meaningful either way.

---

## PASTE THIS INTO LOVABLE

Build a **social banner + card designer** — a focused tool for creating polished,
professional social media banners and profile cards. This is a design tool, so the
output must look like a real designer made it, not like a form that rearranges text.

**Tech (non-negotiable):**
- React + TypeScript, built with **Ant Design** components for all UI chrome
  (inputs, buttons, selects, panels, layout shell). Do NOT hand-roll raw Tailwind
  primitives for the interface — use Ant. It should look enterprise-grade, not
  vibe-coded.
- The banner canvas itself is composed with **positioned HTML/CSS** (absolute
  positioning, z-index, transforms, CSS blend modes, box-shadow) — NOT flat drawn
  rectangles — so elements can genuinely **overlap and layer**. Export the composed
  banner to PNG/JPEG (use html-to-image or an equivalent DOM-to-image rasterizer;
  photos export as JPEG to keep size down, graphic-only banners as PNG).

**The core idea — layouts that MEAN something:**
The left panel is a simple editor. The right side is a live preview of the banner.
The user picks a **template by PURPOSE**, fills in the fields it needs, and it looks
designed. Templates are NOT a positional toggle (centered / left / split). Each
template has a real point of view and a real visual hierarchy:

1. **Promotion / Sale** — the offer is the hero: large, dominant, the first thing you
   read. Everything else (brand, logo) supports it. Think a real promo poster.
2. **Call to action** — the CTA is the point ("Book a call", "Let's build your
   systems"). Rendered as a real button/pill treatment, prominent.
3. **Credential / Highlight** — the name + a credential line carry real weight (e.g.
   business name big, "Family Nurse Practitioner, Board Certified" reading as a
   confident credential, NOT fine print).
4. **Photo-forward** — an uploaded image dominates; text rides over it with a proper
   readability scrim (a gradient darkening behind the text so it survives on the
   photo).
5. **Logo-prominent** — the brand mark is the star.

**Design requirements (this is the whole test — do not cut corners here):**
- **Overlap and layering are required, not optional.** A headline may cross onto a
  color field; a logo may overlap a photo edge; elements may sit on top of each
  other with intentional overlap and depth. Do NOT put every element in its own
  isolated rectangle. Blocked-in, grid-cell layouts are a failure.
- Each template must look **visibly different** from the others — different
  hierarchy, different composition, different focal point. A new template that is
  just an old one with a recolored badge or an added border is a failure.
- Use real design craft: layered translucency, CSS blend modes (multiply /
  soft-light / overlay), tonal gradients within shapes, confident color fields,
  real type scale contrast between hero and supporting text. Not "a splash of color
  and some dots."
- When text sits over a photo or a color field, it MUST stay legible (scrim /
  knockout behind it).

**Fields (all optional except where a template needs one):**
- Brand / business name
- Eyebrow (small line above — service, category)
- Tagline
- Offer (e.g. "50% OFF", "Free consultation") — the Promotion template's hero
- CTA (e.g. "Book a call") — the CTA template's hero
- Logo upload
- Background photo upload
- Accent color (drives the whole palette)
- Font pairing

**Smart adaptation:** a template uses only the fields that are filled and rebalances
its hierarchy when an optional field is empty — never leaves a hole or a lonely
centered line. Picking a template should do the design thinking so the user doesn't
have to.

**Controls:** template picker, the field inputs above, accent color, font pairing,
light/dark background toggle, background image opacity, and Download. Platform sizes
(LinkedIn banner, Facebook cover, Twitter/X header, square post) selectable.

Make it feel like a real product a small business owner would happily use to make a
promotion banner, a credential card, or a CTA banner in under a minute — and be
proud to post it.

---

## For the real Ant-stack rebuild (after the probe)

- Repo: standalone Vite + React + TypeScript + **Ant Design**, GitHub-Pages
  apex-routes pattern (base = "/<repo>/", no CNAME), wired into the Opsette Tools
  landing like the other kit tools.
- Layouts: **positioned CSS/DOM React components**, one per purpose — this is what
  makes overlap free and stops the blocked-in look that killed the canvas version.
- Export: DOM-to-image (html-to-image / satori). Photo layouts → JPEG ~85%;
  graphic-only → PNG. (Brand-board export already flattens to raster, so this fits.)
- Reuse from Icon Kit only what earns it: the font-pairing data (`shared-fonts.ts`),
  the contrast/mute color helpers, the brand-board blob shape. Leave logos/favicons
  in Icon Kit.
