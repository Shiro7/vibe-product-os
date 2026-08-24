# VPOS Website

This directory contains the dependency-free public website for VPOS, the official short name for Vibe Product OS.

## Local preview

From the repository root:

```bash
npm run site:dev
```

Open `http://127.0.0.1:4173`.

## Verification

```bash
npm run site:check
```

The check verifies the VPOS identity, required assets, internal links, image accessibility, motion and theme controls, approved installation command, and public-pilot claim boundary.

## Visual system

- Palette: graphite, brushed silver, off-white, and one lime accent.
- Typography: native system sans with a system monospace companion.
- Shape rule: 24px surfaces, 14px controls, full-pill actions.
- Theme: one page-wide theme with system preference and manual desktop control.
- Motion: entry hierarchy and section reveal only, with reduced-motion fallback.

The three raster assets were generated specifically for this project and are stored in `website/assets/`.
