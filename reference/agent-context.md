# Font-to-JSON

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

## WOFF

WOFF and WOFF2 will come later

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

Here is the order in which we will build this library.

We will start with OTF fonts, importing and exporting general file header data, then moving on to tables. When support for a table is being written, the flow will work like this (using 'OS/2' as an example shared table):

1. read the online spec to understand that table and how it is constructed.
2. create a file in `src\sfnt` (for shared tables) or `src\ttf`/`src\otf` (for format-specific tables) called `table_OS-2.js`, which will contain both the logic that will read binary data and convert it to JSON, as well as take well-formatted JSON data and convert it back into binary for that table.
3. add any updates to `src\main.js` or any other JS files in src that may need to handle this new table.
4. create a file in `test\sfnt` (or `test\ttf`/`test\otf`) called `table_OS-2.test.js` for any table specific tests.

# Short term strategy

This section will be updated based on what phase of support we are working on.

1: fvar, avar, STAT, gvar (variable-font support is the biggest modern gap)
2: HVAR, MVAR, VVAR, cvar (variation refinements; important after core variable support)
3: kern (legacy, still common in older fonts), BASE (useful for complex scripts)
4: CBLC/CBDT, sbix, EBLC/EBDT/EBSC (emoji/image-heavy ecosystems)
Low priority: JSTF, MATH (domain-specific), meta, hdmx, LTSH, VDMX, PCLT, VORG, ltag
Very low/skip for now: DSIG (deprecated), FFTM (non-standard), MERG (rare)

# Overall Roadmap — Complete Table Checklist

Every table defined in the OpenType specification, categorized by where it lives
in this project. Checked items are implemented and tested. Unchecked items are
listed in recommended implementation order (highest priority first).

## SFNT — Shared Tables (src/sfnt)

Tables that are identical for both TrueType- and CFF-based fonts.

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
- [ ] DSIG — Digital signature
- [ ] hdmx — Horizontal device metrics
- [ ] LTSH — Linear threshold data
- [ ] MERG — Merge
- [ ] meta — Metadata
- [ ] PCLT — PCL 5 data
- [ ] VDMX — Vertical device metrics

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

- [ ] VORG — Vertical Origin
