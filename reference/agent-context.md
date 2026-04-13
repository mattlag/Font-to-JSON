# Font Flux JS

_Last Updated: April 3, 2026_

This project aims to create a JavaScript library that can read in a binary font file (OTF, TTF, WOFF) and convert it's data into JSON format. Secondarily, this library will be able to take a properly formatted JSON file and convert it back to a font file. This will be distributed as a single .js file using JavaScript modules to be included in front-end HTML5 font editor programs.

I am a human and I will write notes to you, a coding agent, in this file agent-context.md I have also created a file for you called `reference\agent-written-notes.md` this is a space for you to maintain. As this project proceeds, it will be iterative, and along the way new agents will have to get up to speed and be effective contributing to this project. Periodically, please look back at what you have done and make notes in this file. The contents do not have to make sense to a human, the goal is to make future agents onboard and be effective to this project as efficiently as possible.

# Specs and context

Different font formats have the following spec that can be referenced when parsing and writing font files

## OTF

Overview: https://learn.microsoft.com/en-us/typography/opentype/spec/overview
Font file: https://learn.microsoft.com/en-us/typography/opentype/spec/otff
Tables: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## TTF

Table of contents: https://developer.apple.com/fonts/TrueType-Reference-Manual/
Tables: https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6.html

## TTC and OTC

Overview: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#collections
Overview: https://docs.fileformat.com/font/ttc/

## WOFF / WOFF2

WOFF 1.0 spec: https://www.w3.org/TR/WOFF/
WOFF 2.0 spec: https://www.w3.org/TR/WOFF2/

Both WOFF and WOFF2 are fully supported (import + export). WOFF1 uses zlib (pako) compression per-table. WOFF2 uses Brotli compression for the entire font data stream and supports content-aware transforms for glyf, loca, and hmtx tables.

WOFF2 requires `await initWoff2()` before use to initialize the Brotli compression backend.

# Project organization

## src

This will be where all main code is written. It should be organized in a way that will make sense to human maintainers. The root can have individual JS files that contain similar functionality. The `src` folder will have a `main.js` file where everything starts, and exposes the main import and export functionality. Additional `import.js` and `export.js` files will hold conversion code.

There are three child folders:

- `src/sfnt/` — shared tables that are identical for both OTF and TTF (e.g. cmap, head, hhea, hmtx, maxp, name, OS/2, post, and shared optional tables like kern, GPOS, GSUB). Files follow the naming convention `table_XYZ.js`.
- `src/otf/` — CFF/CFF2-specific table parsers (CFF v1 and CFF2 implemented).
- `src/ttf/` — TrueType-specific table parsers (loca, glyf implemented).

One special note is the "OS/2" table, this should be referred to in code and file names as "OS-2". Font tables have mixed uppercase / lowercase, and table name case should always be honored.

## test

The test folder will have a similar organization to the `src` folder, but contain tests. The main test in the root of the folder will be a "round trip" test. This will be importing a sample test file, converting it to JSON, then converting it back to the same type of font, then importing it again to convert it to a second JSON file. The idea is the first and second JSON files will match, showing no import or export errors.

## dist

This will be a place where the `src` files will be bundled for distribution or publishing. We will do this after main functionality meets a minimum bar

## reference

This folder will be for reference materials, project notes, and possibly spec files.

# Project plan

After each phase of work, give me a one-sentence summary of what was done that can be used as a Git commit message.

# Two Core Use Cases (High-Level Directives)

Everything in this library serves one of two scenarios. All architectural decisions
should be evaluated against both.

## Scenario 1 — Load, Edit, Save

A user loads an existing font, makes small targeted changes via the simplified JSON
fields (rename family, adjust a glyph, tweak kerning), and saves a new font file.

**Guiding principle**: Minimal impact. Parts of the font NOT explicitly changed by
the user must survive the round-trip untouched — including complex structures like
GSUB rules, COLR color layers, variable font deltas, bitmap data, etc.

## Scenario 2 — Author from Scratch

A font editor or person constructs JSON by hand (using convenience functions) and
exports it as a real font file.

**Guiding principle**: Ease of use. The user specifies only what matters (family name,
glyphs, metrics, kerning) and the library generates all required binary tables.

## The Bridge (1 → 2)

A user may start in Scenario 1 with small edits and gradually take over authorship.
The library must support this transition seamlessly — edits via simplified fields
AND edits via convenience functions must both be honored on export.

See `reference/two-scenario-architecture.md` for the full analysis, gap inventory,
proposed reconciliation approach, and convenience function plan.

# Current Strategy

Current focus areas:

## Phase: Architecture & Convenience (Active)

1. **Fix the reconciliation gap**: `resolveExportSource()` currently ignores simplified
   field edits when `_header` is present. Implement hybrid export path that rebuilds
   decomposed tables from simplified fields while preserving non-decomposed tables.
2. **Convenience functions**: `createFont()`, `addGlyph()`/`removeGlyph()`,
   `addKerning()`/`removeKerning()`, `detachFromOriginal()`, `subsetFont()`.
3. **Fill minor builder gaps**: vmtx/vhea builders in expand.js (vertical metrics
   are decomposed on import but not rebuilt on export).

## Future Work

- GSUB builder for ligatures and alternates (simplified authoring)
- COLR/CPAL simplified decomposition (color font editing)
- Variable font delta editing (gvar simplified representation)
- WOFF2 forward transforms for better compression ratios
- export.js refactor to use DataWriter for header/directory

# Table Checklist

Every table defined in the OpenType specification, categorized by where it lives in this project.

## SFNT — Shared Tables (src/sfnt)

Tables that are identical for both TrueType - and CFF-based fonts.

### Required Tables

- [x] cmap — Character to glyph mapping
- [x] head — Font header
- [x] hhea — Horizontal header
- [x] hmtx — Horizontal metrics
- [x] maxp — Maximum profile
- [x] name — Naming table
- [x] OS/2 — OS/2 and Windows specific metrics
- [x] post — PostScript name mapping

### Advanced Typographic Tables

- [x] GDEF — Glyph definition data
- [x] GPOS — Glyph positioning data
- [x] GSUB — Glyph substitution data
- [x] BASE — Baseline data
- [x] JSTF — Justification data
- [x] MATH — Math layout data

### Vertical Metrics

- [x] vhea — Vertical metrics header
- [x] vmtx — Vertical metrics

### Other Shared Tables

- [x] kern — Kerning (legacy, prefer GPOS)
- [x] DSIG — Digital signature
- [x] hdmx — Horizontal device metrics
- [x] LTSH — Linear threshold data
- [x] MERG — Merge
- [x] meta — Metadata
- [x] PCLT — PCL 5 data
- [x] VDMX — Vertical device metrics

### Bitmap Glyph Tables

- [x] EBLC — Embedded bitmap location data
- [x] EBDT — Embedded bitmap data
- [x] EBSC — Embedded bitmap scaling data
- [x] CBLC — Color bitmap location data
- [x] CBDT — Color bitmap data
- [x] sbix — Standard bitmap graphics

### Color Font Tables

- [x] COLR — Color table
- [x] CPAL — Color palette table
- [x] SVG — SVG glyph descriptions

### Font Variations Tables (shared)

- [x] fvar — Font variations (defines axes)
- [x] avar — Axis variations (axis mapping)
- [x] STAT — Style attributes (required for variable, optional otherwise)
- [x] MVAR — Metrics variations
- [x] HVAR — Horizontal metrics variations
- [x] VVAR — Vertical metrics variations

## TTF — TrueType-Specific Tables (src/ttf)

### Outline Tables (required for TrueType fonts)

- [x] loca — Index to location (glyph offsets)
- [x] glyf — Glyph data (TrueType outlines)

### Hinting Tables (optional)

- [x] cvt — Control Value Table
- [x] fpgm — Font program
- [x] prep — Control Value Program
- [x] gasp — Grid-fitting/Scan-conversion

### TrueType Variation Tables

- [x] gvar — Glyph variations
- [x] cvar — CVT variations

## OTF — CFF-Specific Tables (src/otf)

### Outline Tables (one required for CFF-based fonts)

- [x] CFF — Compact Font Format 1.0
- [x] CFF2 — Compact Font Format 2.0

### Optional

- [x] VORG — Vertical Origin

## SFNT Collections

- [x] TTC/OTC container import/export (`ttcf`), including multi-face collections
