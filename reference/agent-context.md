# Font Flux JS

_Last Updated: April 14, 2026_

This project is a JavaScript library that converts binary font files (OTF, TTF, WOFF, WOFF2) to and from JSON. Distributed as a single ES module file for use in front-end HTML5 font editor programs. Part of the Glyphr Studio family.

## Read These Files in Order

1. **This file** (`agent-context.md`) — Project overview, architecture, current state
2. **`agent-written-notes.md`** — Technical deep-dive: registries, data flow, gotchas
3. **`gap-analysis.md`** — Table completeness audit (what's fully parsed vs raw bytes)

## Specs

- **OTF**: https://learn.microsoft.com/en-us/typography/opentype/spec/otff
- **TTF**: https://developer.apple.com/fonts/TrueType-Reference-Manual/
- **TTC/OTC**: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#collections
- **WOFF 1.0**: https://www.w3.org/TR/WOFF/ — **WOFF 2.0**: https://www.w3.org/TR/WOFF2/

**Key fact**: OTF and TTF are both OpenType fonts sharing the same sfnt container and required tables. The only difference is glyph outlines — TrueType uses quadratic Bézier (`glyf`/`loca`), CFF uses cubic Bézier (`CFF`/`CFF2`). All shared table parsers work identically for both.

## Project Organization

- **`src/`** — Library source. Entry: `src/main.js` exports `{ FontFlux, initWoff2 }`.
  - `src/font_flux.js` — The `FontFlux` class (v2 public API wrapper)
  - `src/import.js` / `src/export.js` — Core pipeline + parser/writer registries
  - `src/simplify.js` — Raw tables → simplified object; `src/expand.js` — simplified → raw tables
  - `src/glyph.js` / `src/kerning.js` / `src/substitution.js` / `src/color.js` / `src/json.js` / `src/svg_path.js` — Helpers
  - `src/sfnt/` — Shared table parsers (cmap, head, GPOS, COLR, etc.)
  - `src/otf/` — CFF/CFF2-specific (table*CFF.js, table_CFF2.js, cff_common.js, charstring*\*.js)
  - `src/ttf/` — TrueType-specific (glyf, loca, gvar, cvt, fpgm, prep, gasp, cvar)
  - `src/woff/` — WOFF 1/2 wrap/unwrap
  - `src/validate/` — Structural validation + auto-fix
- **`test/`** — Vitest tests mirroring `src/` structure. 592+ tests across 72 files.
- **`docs/`** — VitePress documentation site (API, guides, per-table reference)
- **`demo/`** — Vanilla JS demo app (Vite)
- **`dist/`** — Built output
- **`reference/`** — These agent-facing notes

**Naming convention**: Table files are `table_XYZ.js`. The OS/2 table uses `table_OS-2.js` (filename) but `'OS/2'` (registry key). Table tag case always matches the spec.

## v2 Public API

The library exports only two things: `{ FontFlux, initWoff2 }`.

`FontFlux` is a class wrapping the internal simplified font object. See `README.md` and `docs/index.md` for the full API reference.

**Key methods**: `FontFlux.open(buffer)`, `FontFlux.create({family, style, unitsPerEm, ...})`, `FontFlux.openAll(buffer)`, `.addGlyph()`, `.addKerning()`, `.addSubstitution()`, `.export()`, `.validate()`, `.toJSON()`, `FontFlux.fromJSON()`.

**Instance properties** (live references): `.info`, `.glyphs`, `.kerning`, `.substitutions`, `.axes`, `.instances`, `.features`, `.tables`, `.glyphCount`, `.format`.

## Two Core Use Cases

### Scenario 1 — Load, Edit, Save

Load an existing font → make targeted changes → save. Everything NOT touched must survive the round-trip (GSUB rules, color layers, variable font deltas, bitmap data, etc.).

### Scenario 2 — Author from Scratch

Construct JSON by hand or via convenience functions → export as a real font. The user specifies only what matters; the library generates all required binary tables.

### How Export Works (Hybrid Reconciliation)

`resolveExportSource()` in `export.js` detects the data shape:

- **`_header` present** (imported font): Rebuilds DECOMPOSED_TABLES from simplified fields (honoring edits), preserves non-decomposed tables from stored originals. Lossless for untouched data.
- **No `_header`** (hand-authored): Calls `buildRawFromSimplified()` to generate everything from scratch.

The bridge between scenarios works seamlessly — users can start from an imported font and gradually take over authorship.

## Current State (April 2026)

- **Version**: 2.0.0-beta.0
- **Tests**: 650+ passing across 75 files
- **Tables**: 51 table types with registered parsers/writers (see checklist below)
- **Formats**: TTF, OTF, TTC, OTC, WOFF, WOFF2 all fully supported. CFF, PFB, and PFA import supported (legacy Type 1 converted to CFF outlines).
- **FontFlux class**: Complete v2 API with glyph, kerning, substitution, axis, instance, feature, and hinting methods
- **GSUB decomposition**: Full simplified substitution pipeline (types 1–4, 8 decomposed; types 5/6 raw passthrough)
- **Validation**: Three-level severity (error/warning/info) with auto-fix
- **WOFF2**: Full import/export. Requires `await initWoff2()` once before use.

## Future Work

- COLR/CPAL simplified decomposition (color font editing)
- Variable font delta editing (gvar simplified representation)
- GPOS non-kerning simplified authoring (mark positioning, cursive attachment, etc.)
- WOFF2 forward transforms for better compression ratios (currently uses null transforms)
- Full MATH/JSTF subtable parsing (currently container-level only)
- CFF v1 CIDFont writing completion

## Table Checklist

All 51+ table types are implemented. Every table that has a parser also has a writer.

### SFNT — Shared Tables (src/sfnt)

**Required:** cmap, head, hhea, hmtx, maxp, name, OS/2, post
**Advanced Typographic:** GDEF, GPOS, GSUB, BASE, JSTF, MATH
**Vertical Metrics:** vhea, vmtx
**Variation:** fvar, avar, STAT, MVAR, HVAR, VVAR
**Color/Bitmap:** COLR, CPAL, SVG, CBDT, CBLC, EBDT, EBLC, EBSC, sbix
**Other:** kern, DSIG, hdmx, LTSH, MERG, meta, PCLT, VDMX

### TTF — TrueType-Specific (src/ttf)

**Outline:** loca, glyf
**Hinting:** cvt, fpgm, prep, gasp
**Variation:** gvar, cvar

### OTF — CFF-Specific (src/otf)

**Outline:** CFF (v1), CFF2 (v2)
**Optional:** VORG

### Collections

TTC/OTC container import/export (`ttcf`), including multi-face collections

### Apple AAT (src/sfnt)

bloc, bdat, ltag
