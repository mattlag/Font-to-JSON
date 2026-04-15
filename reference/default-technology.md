# Default Technology Decisions for From-Scratch Font Export

_Last Updated: April 15, 2026_

When a user creates a font from scratch via `FontFlux.create()` and exports it, the library makes technology decisions at every point where multiple competing implementations exist. This document records each decision, the alternatives, and the rationale.

These defaults apply to **Scenario 2** (author from scratch). For **Scenario 1** (load → edit → save), the library preserves whatever technologies the original font used.

## Decision Points

### 1. Outline Format: TrueType (`glyf`)

**Default**: TrueType outlines (quadratic Bézier curves, `glyf` + `loca` tables)

**Alternatives**: CFF (cubic Bézier, `CFF ` table), CFF2 (cubic Bézier with variation support, `CFF2` table)

**Rationale**:

- Universal compatibility — every OS, browser, and application supports TrueType.
- Google Fonts requires TrueType. Major families (Noto, Roboto, Inter) ship TrueType.
- Best variable font support: `glyf` + `gvar` is the most widely supported VF stack.
- Supports overlapping contours (CFF v1 does not — CFF2 does but has less renderer support).
- Supports composite glyphs (share outlines between accented characters) for space efficiency.
- OpenType spec comparison table rates `glyf` as "low" data redundancy vs CFF's "moderate".
- `createGlyph()` defaults `format` to `'truetype'` so SVG path input auto-converts to quadratic.

**Where implemented**: `src/glyph.js` (format default), `src/expand.js` (outline table selection based on absence of `charString` on glyphs).

**User override**: Pass `format: 'cff'` to `createGlyph()`, or set `charString` bytes directly on glyphs. The presence of any `charString` on any glyph triggers CFF output.

---

### 2. Kerning: GPOS Table

**Default**: GPOS PairPos lookup with `kern` feature tag (`kerningFormat: 'gpos'`)

**Alternatives**: Legacy `kern` table (OpenType Format 0/2, Apple Format 0/1/2/3), both GPOS + kern (`'gpos+kern'`)

**Rationale**:

- OpenType spec explicitly recommends GPOS over `kern`: _"font vendors are encouraged to record kerning in the GPOS table's 'kern' feature and not in the 'kern' table."_
- GPOS is **mandatory** for variable fonts — no variation mechanism exists for `kern` tables.
- GPOS supports class-based kerning (dramatically more efficient for large glyph sets).
- The legacy `kern` table has severe Windows limitations: only Format 0 supported, only the first subtable is used, no class-based kerning.
- GPOS integrates with the full OpenType Layout engine (script/language/feature system).

**Where implemented**: `src/expand.js` line ~49, `kerningFormat` defaults to `'gpos'`.

**User override**: Set `simplified._options.kerningFormat` to `'kern'` or `'gpos+kern'`.

---

### 3. Character Mapping: cmap Format 4 + Format 12

**Default**: Auto-selected based on glyph Unicode coverage.

- BMP only (U+0000–U+FFFF): Format 4, with Windows (3,1) and Unicode (0,3) encoding records.
- Supplementary planes present (U+10000+): Format 12, with Windows (3,10) and Unicode (0,4) encoding records.

**Alternatives**: Format 0 (byte encoding), Format 2 (high-byte mapping), Format 6 (trimmed array), Format 13 (last-resort), Format 14 (Unicode Variation Sequences)

**Rationale**: This exactly matches the OpenType spec recommendations for new fonts. Format 4 is the most efficient for BMP-only fonts. Format 12 handles the full Unicode range.

**Where implemented**: `src/expand.js`, `buildCmapTable()` function.

**User override**: None needed — auto-selection is always correct.

---

### 4. Variable Fonts: fvar + gvar + HVAR + avar + STAT

**Default**: When `axes` are present, the library generates:

- `fvar` — axis definitions and named instances
- `STAT` — style attributes table (auto-generated from axes, with ELIDABLE flags and "Regular" elided fallback name)
- Additional tables (`gvar`, `avar`, `HVAR`, `MVAR`, `VVAR`, `cvar`) are passed through when provided.

**Alternatives**: CFF2 variations (variation data embedded in CFF2 table)

**Rationale**:

- Since the default outline format is TrueType, the matching variation technology is `gvar`.
- `STAT` is recommended by the spec for variable fonts and supersedes optical size fields in OS/2.
- Auto-generating STAT avoids a common omission that causes problems in font managers and browsers.

**Where implemented**: `src/expand.js`, `buildFvarTable()` and `buildSTATTable()` functions.

**User override**: Provide a STAT table directly in `simplified.tables.STAT` to skip auto-generation.

---

### 5. Substitutions: GSUB with Standard Feature Tags

**Default**: GSUB table with decomposable lookup types (1–4, 8), `DFLT` script, `dflt` language.

**Alternatives**: None — GSUB is the only modern substitution mechanism.

**Rationale**: Feature tags follow the OpenType Layout Tag Registry (`liga`, `smcp`, `aalt`, etc.). Default script `DFLT` provides maximum language coverage.

**Where implemented**: `src/expand.js`, `buildGSUBFromSubstitutions()`.

---

### 6. Color Fonts: COLRv1 + CPAL (Recommended)

**Default**: No color tables are auto-generated (color is always an explicit user choice).

**Recommendation**: COLRv1 (layered vector color with gradients/transforms) + CPAL (color palette).

**Alternatives**: COLRv0 (simple layer stacking), SVG table, sbix (Apple bitmap), CBDT/CBLC (Google bitmap), EBDT/EBLC (legacy bitmap)

**Rationale**:

- COLRv1 is the most modern format, jointly developed by Google and Microsoft.
- Fully scalable vectors with gradients, transforms, compositing, and clip paths.
- Supported by all major browsers and operating systems.
- Much smaller file size than SVG or bitmap approaches.
- The SVG table is being de-emphasized in favor of COLRv1.

---

### 7. Hinting: Unhinted with gasp Table

**Default**: `FontFlux.create()` generates a `gasp` table with `[{ maxPPEM: 0xFFFF, behavior: 0x000A }]` (GASP_DOGRAY + GASP_SYMMETRIC_SMOOTHING at all sizes). No `cvt`, `fpgm`, `prep`, or per-glyph instructions.

**Alternatives**: Manual TrueType hinting (cvt/fpgm/prep/glyf instructions), CFF hinting (stems/zones in Private DICT)

**Rationale**:

- Manual TrueType hinting is an extremely specialized craft requiring deep expertise.
- CFF hinting (stem/zone declarations) requires deep typographic knowledge.
- Modern rasterizers (DirectWrite, CoreText, FreeType) perform excellent auto-hinting and anti-aliasing without manual hints.
- The `gasp` table tells rasterizers to use symmetric smoothing, which is optimal for unhinted fonts.

**Where implemented**: `src/font_flux.js` (`FontFlux.create()` default data), `src/expand.js` (gasp table generation).

**User override**: Provide `cvt`, `fpgm`, `prep` arrays in the simplified data. Set per-glyph `instructions` on individual glyphs.

---

### 8. post Table: Format 2.0 with Glyph Names

**Default**: `post` table version 2.0 with explicit per-glyph name strings.

**Alternatives**: Format 3.0 (no glyph names — required for CFF fonts per spec), Format 1.0 (standard Mac ordering only)

**Rationale**: Format 2.0 includes per-glyph name strings, essential for PostScript interoperability, PDF generation, and debugging with font tools. The OpenType spec says CFF fonts should use format 3.0, but since the default is TrueType, format 2.0 is correct.

**Where implemented**: `src/expand.js`, `buildPostTable()`.

---

### 9. OS/2 Table: Version 4 with USE_TYPO_METRICS

**Default**: OS/2 version 4 with `fsSelection` bit 7 (`0x0080`, USE_TYPO_METRICS) set when computing fsSelection from scratch.

**Alternatives**: Version 5 (adds optical size fields, superseded by STAT), earlier versions

**Rationale**:

- The OpenType spec recommends USE_TYPO_METRICS for consistent cross-platform line spacing.
- When set, applications use `sTypoAscender`/`sTypoDescender`/`sTypoLineGap` instead of the platform-specific `usWinAscent`/`usWinDescent` values.
- `hhea.ascender`/`descender`/`lineGap` are already harmonized with the sTypo values in `buildHheaTable()`.

**Where implemented**: `src/expand.js`, `buildOS2Table()` — the flag is set only when `font.fsSelection` is undefined (i.e. from-scratch fonts). Imported fonts preserve their original value.

---

### 10. name Table: Windows + Mac + Unicode Platforms

**Default**: Three platform records per name entry:

- Windows (platformID 3, encodingID 1, languageID 0x0409)
- Macintosh (platformID 1, encodingID 0, languageID 0)
- Unicode (platformID 0, encodingID 3, languageID 0)

**Alternatives**: Windows + Unicode only (dropping Mac)

**Rationale**: The spec says Mac platform names "are no longer required on modern platforms," but some legacy software still expects them. Including all three is harmless and maximizes compatibility.

**Where implemented**: `src/expand.js`, `buildNameTable()` and `addNameRecord()`.

---

### 11. Output File Format: SFNT (.ttf)

**Default**: Bare SFNT output for hand-authored fonts.

**Alternatives**: WOFF (zlib-compressed wrapper), WOFF2 (Brotli-compressed wrapper)

**Rationale**: SFNT is the universal format — works everywhere and can be wrapped as WOFF/WOFF2 later. For from-scratch fonts there is no "original format" to match.

**Where implemented**: `src/export.js`, `defaultFormatFrom()` returns `'sfnt'` when no `_woff` metadata is present.

**User override**: Pass `{ format: 'woff' }` or `{ format: 'woff2' }` to `.export()`.

---

## Summary Table

| Decision          | Default                     | Key Reason                                |
| ----------------- | --------------------------- | ----------------------------------------- |
| Outline format    | TrueType (`glyf`)           | Universal compat, Google Fonts standard   |
| Kerning           | GPOS `kern` feature         | OpenType spec recommends, required for VF |
| Character mapping | cmap Format 4 + 12          | Spec recommendation, auto-selected        |
| Variable fonts    | fvar + gvar + STAT          | Most supported VF stack                   |
| Substitutions     | GSUB + standard tags        | Only modern mechanism                     |
| Color fonts       | COLRv1 + CPAL (recommended) | Modern vector color, broad support        |
| Hinting           | Unhinted + gasp             | Modern rasterizers auto-hint well         |
| post table        | Format 2.0                  | Glyph names for interop                   |
| OS/2              | v4 + USE_TYPO_METRICS       | Consistent line spacing                   |
| name platforms    | Windows + Mac + Unicode     | Max compatibility                         |
| File format       | SFNT (.ttf)                 | Universal, can wrap later                 |
