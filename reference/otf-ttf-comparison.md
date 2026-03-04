# OTF vs TTF: Similarities, Differences, and Project Impact

## Executive Summary

**OTF and TTF are not two separate formats.** They are both OpenType fonts that share the same container format (sfnt) and the same set of required metadata tables. The only fundamental difference is how glyph outlines are stored: TrueType uses quadratic Bézier curves in `glyf`/`loca` tables, while CFF-flavored OpenType uses cubic Bézier curves in `CFF`/`CFF2` tables.

This means our existing 8 table parsers (`cmap`, `head`, `hhea`, `hmtx`, `maxp`, `name`, `OS/2`, `post`) already work identically for both OTF and TTF files — confirmed by passing round-trip tests for both `oblegg.otf` and `oblegg.ttf`.

---

## 1. Container Format

Both OTF and TTF use the **sfnt** container format. The binary structure is identical:

| Component                       | OTF (CFF outlines)                                | TTF (TrueType outlines)               |
| ------------------------------- | ------------------------------------------------- | ------------------------------------- |
| **sfntVersion** (first 4 bytes) | `0x4F54544F` ("OTTO")                             | `0x00010000` (or `0x74727565` "true") |
| **Offset Table**                | numTables, searchRange, entrySelector, rangeShift | Identical                             |
| **Table Directory**             | tag, checksum, offset, length per table           | Identical                             |
| **Checksum calculation**        | Sum of uint32 values                              | Identical                             |
| **Table alignment**             | 4-byte aligned                                    | Identical                             |
| **Byte order**                  | Big-endian                                        | Identical                             |

The _only_ difference at the container level is the 4-byte version tag at offset 0.

> **Project note:** Our `import.js` already reads sfntVersion and stores it. Our `export.js` writes it back. Both OTF and TTF are handled correctly with no special casing.

---

## 2. Required Tables

Both formats require exactly the same 8 metadata tables. These tables have **identical binary formats** regardless of whether the font uses TrueType or CFF outlines:

| Table  | Purpose                           | Format identical? | Our status     |
| ------ | --------------------------------- | ----------------- | -------------- |
| `cmap` | Character-to-glyph mapping        | **Yes**           | ✅ Implemented |
| `head` | Font header (units, dates, flags) | **Yes** ¹         | ✅ Implemented |
| `hhea` | Horizontal header (metrics count) | **Yes**           | ✅ Implemented |
| `hmtx` | Horizontal metrics per glyph      | **Yes**           | ✅ Implemented |
| `maxp` | Maximum profile                   | **Mostly** ²      | ✅ Implemented |
| `name` | Naming table (strings)            | **Yes**           | ✅ Implemented |
| `OS/2` | OS/2 and Windows metrics          | **Yes**           | ✅ Implemented |
| `post` | PostScript name mapping           | **Yes**           | ✅ Implemented |

**Notes:**

1. `head.indexToLocFormat` is only meaningful for TrueType fonts (selects short/long `loca` format). CFF fonts set this to 0.
2. `maxp` has two versions: **v0.5** (6 bytes: version + numGlyphs) used by CFF fonts, and **v1.0** (32 bytes: +13 TrueType-specific fields like maxPoints, maxContours, maxZones, etc.) used by TrueType fonts. Our parser already handles both.

### Verdict: 100% shared across OTF and TTF

All 8 required tables use the same binary format. No separate `src/ttf/` parsers are needed for these tables.

---

## 3. Outline Data — The Core Difference

This is where OTF and TTF diverge. Each font has **one** outline representation:

### 3a. TrueType Outlines (`glyf` + `loca`)

| Aspect                      | Details                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Tables**                  | `glyf` (glyph data), `loca` (index to location)                                                        |
| **Curves**                  | Quadratic (2nd-order) Bézier                                                                           |
| **Coordinate precision**    | 1 design unit (integer)                                                                                |
| **Composite glyphs**        | Component references with affine transforms                                                            |
| **Hinting**                 | TrueType instructions (bytecode interpreter) — moves outline points by controlled amounts              |
| **Variation**               | `gvar` table (delta tuples per glyph) + `cvar` table (hint variations)                                 |
| **Fill rule**               | Non-zero winding (overlapping contours allowed in newer specs)                                         |
| **Related optional tables** | `cvt` (control values), `fpgm` (font program), `prep` (pre-program), `gasp` (grid-fitting preferences) |

**`loca` table:**

- Array of `numGlyphs + 1` offsets into the `glyf` table
- Two formats: **short** (Offset16, values divided by 2) or **long** (Offset32)
- Selected by `head.indexToLocFormat` (0 = short, 1 = long)

**`glyf` table:**

- No table header — offsets come from `loca`
- Each glyph has a header: `numberOfContours` (int16), `xMin`, `yMin`, `xMax`, `yMax`
- **Simple glyphs** (`numberOfContours >= 0`): endPtsOfContours[], instructionLength, instructions[], flags[], xCoordinates[], yCoordinates[]
- **Composite glyphs** (`numberOfContours < 0`): sequence of component records (flags, glyphIndex, arguments, optional transform matrix)
- Coordinates are delta-encoded and flag-compressed (on-curve/off-curve, x/y byte vs short, repeat)
- Empty glyphs (like space) have zero-length entries (consecutive equal offsets in `loca`)

### 3b. CFF Outlines (`CFF` or `CFF2`)

| Aspect                      | Details                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| **Tables**                  | `CFF ` (version 1) or `CFF2` (version 2)                                 |
| **Curves**                  | Cubic (3rd-order) Bézier                                                 |
| **Coordinate precision**    | 1/65536 design unit (Fixed 16.16)                                        |
| **Composite glyphs**        | Subroutine sharing (not component references)                            |
| **Hinting**                 | Alignment zones + stem declarations (not bytecode)                       |
| **Variation**               | CFF2 only: blend operators + VariationStore within the CFF2 table itself |
| **Fill rule**               | Even-odd (CFF v1) or non-zero winding (CFF2)                             |
| **Related optional tables** | `VORG` (vertical origin)                                                 |

**CFF internal structure:**

- Self-contained binary format with its own header, INDEX structures, DICT structures
- Header → TopDICT → GlobalSubrINDEX → CharStringINDEX → FontDICTs → PrivateDICTs
- Numbers use special variable-length encoding (not standard OpenType uint16/uint32)
- Stack-based decoding for both DICT and CharString data
- Contains redundant data (glyph names, metrics) that duplicates other OpenType tables

**CFF2 improvements over CFF v1:**

- Eliminates redundant data (no Name INDEX, String INDEX, Encoding, charset)
- Glyph widths removed from CharStrings (uses `hmtx` instead)
- Supports OpenType Font Variations (blend + vsindex operators)
- Non-zero winding fill rule (allows overlapping contours)
- Larger stack (513 vs 48)

### 3c. Side-by-side Outline Comparison

| Feature                  | glyf (TrueType)                         | CFF / CFF2                         |
| ------------------------ | --------------------------------------- | ---------------------------------- |
| Curve type               | Quadratic Bézier                        | Cubic Bézier                       |
| Points per curve segment | 3 (start, control, end)                 | 4 (start, 2 controls, end)         |
| Coordinate encoding      | Flag-compressed deltas (integers)       | Stack-based encoded numbers        |
| Glyph access             | `loca` offset array → `glyf`            | CharStringINDEX                    |
| Glyph reuse              | Composite glyph components              | Subroutines (callsubr/callgsubr)   |
| Hinting model            | Bytecode instructions (Turing-complete) | Declarative stem/zone hints        |
| Path direction           | Clockwise = filled                      | Counterclockwise = filled          |
| Overlapping paths        | Allowed                                 | CFF: not allowed; CFF2: allowed    |
| Data complexity          | Moderate (flag compression)             | High (stack-based DICT/CharString) |

---

## 4. Optional Tables — Shared vs Specific

### Shared Optional Tables (work identically for both)

These tables are format-agnostic and work the same regardless of outline type:

| Category                | Tables                                        |
| ----------------------- | --------------------------------------------- |
| **Advanced Typography** | `GDEF`, `GPOS`, `GSUB`, `JSTF`                |
| **Baseline**            | `BASE`                                        |
| **Math**                | `MATH`                                        |
| **Color**               | `COLR`, `CPAL`, `CBDT`, `CBLC`, `sbix`, `SVG` |
| **Kerning**             | `kern` (legacy), `GPOS` (modern)              |
| **Vertical metrics**    | `vmtx`, `vhea`                                |
| **Digital signatures**  | `DSIG`                                        |
| **Bitmap**              | `EBLC`, `EBDT`, `EBSC`                        |

### TrueType-Specific Tables

| Table  | Purpose                                                         | Required?                   |
| ------ | --------------------------------------------------------------- | --------------------------- |
| `glyf` | Glyph outline data                                              | Yes (for TrueType outlines) |
| `loca` | Index-to-location offsets into `glyf`                           | Yes (for TrueType outlines) |
| `cvt ` | Control value table (values referenced by hinting instructions) | Optional                    |
| `fpgm` | Font program (instructions executed once at font load)          | Optional                    |
| `prep` | Pre-program (instructions executed at each size change)         | Optional                    |
| `gasp` | Grid-fitting and scan-conversion procedure                      | Optional                    |
| `gvar` | Glyph variations (for variable TrueType fonts)                  | Optional                    |
| `cvar` | CVT variations (for variable TrueType fonts)                    | Optional                    |

### CFF-Specific Tables

| Table  | Purpose                                     | Required?                 |
| ------ | ------------------------------------------- | ------------------------- |
| `CFF ` | Compact Font Format v1 outlines             | Yes (for CFF v1 outlines) |
| `CFF2` | Compact Font Format v2 outlines             | Yes (for CFF v2 outlines) |
| `VORG` | Vertical origin (CFF-specific optimization) | Optional                  |

### Variable Font Tables (shared infrastructure, different glyph variation)

| Table                  | Used by       | Purpose                                           |
| ---------------------- | ------------- | ------------------------------------------------- |
| `fvar`                 | Both          | Font variations axis definitions                  |
| `avar`                 | Both          | Axis variation segment maps                       |
| `STAT`                 | Both          | Style attributes                                  |
| `MVAR`                 | Both          | Metrics variations                                |
| `HVAR`                 | Both          | Horizontal metrics variations                     |
| `VVAR`                 | Both          | Vertical metrics variations                       |
| `gvar`                 | TrueType only | Glyph outline variations                          |
| `cvar`                 | TrueType only | CVT variations                                    |
| CFF2 `blend`/`vsindex` | CFF2 only     | Glyph outline variations (embedded in CFF2 table) |

---

## 5. Impact on This Project

### What we already have

Our 8 implemented tables handle all required metadata for both OTF and TTF. These shared tables now live in `src/sfnt/`, correctly reflecting that they are format-agnostic sfnt tables. Both `oblegg.otf` and `oblegg.ttf` pass round-trip tests with this exact same code.

### Folder structure

```
src/
  sfnt/    — shared tables (cmap, head, hhea, hmtx, maxp, name, OS/2, post, future shared optional)
  otf/     — future: CFF/CFF2-specific table parsers
  ttf/     — future: TrueType-specific table parsers (glyf, loca)
test/
  sfnt/    — shared table tests
  otf/     — future: CFF-specific tests
  ttf/     — future: TrueType-specific tests
```

### What comes next — two independent paths

| Path                  | Tables          | Complexity                                                                                                                          | Benefit                                   |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **TrueType outlines** | `loca` + `glyf` | Moderate — flag-compressed coordinates, composite glyphs, but no stack-based decoding                                               | Enables full round-trip of TTF glyph data |
| **CFF outlines**      | `CFF` / `CFF2`  | High — self-contained binary format with stack-based DICT/CharString decoding, subroutine handling, variable-length number encoding | Enables full round-trip of OTF glyph data |

### Recommendations

1. **Continue with shared tables next.** Any remaining shared optional tables (like `kern`, `GPOS`, `GSUB`) benefit both formats equally.

2. **Implement TrueType outlines (`loca` + `glyf`) before CFF.** Rationale:
   - `loca` is trivial (just an offset array — ~30 lines of code)
   - `glyf` is moderately complex but uses standard integer encoding (no stack-based decoding)
   - TrueType is arguably more prevalent (most system fonts, Google Fonts, variable fonts)
   - This gives us full glyph data round-trip for .ttf files sooner

3. **CFF/CFF2 can follow later.** It's a significantly larger effort:
   - CFF is essentially a _font-within-a-font_ with its own header, INDEX, DICT, and CharString formats
   - Requires implementing a stack-based decoder and special number encoding
   - CFF2 adds variation blend operators on top
   - But: CFF is important for professional type design (Adobe fonts, many commercial fonts)

4. **Folder structure is now correct.** Shared tables live in `src/sfnt/`, with empty `src/otf/` and `src/ttf/` ready for format-specific code. TrueType-specific tables (`glyf`, `loca`) will go in `src/ttf/`; CFF-specific code will go in `src/otf/`.

5. **Shared functionality is already shared.** `DataReader`, `DataWriter`, the import/export registries, and the dependency ordering system all work for both formats. No architectural changes needed.

### Overlap Summary

| Category                     | Overlap  | Detail                                                        |
| ---------------------------- | -------- | ------------------------------------------------------------- |
| Container format             | **100%** | Identical sfnt wrapper, header, table directory               |
| Required tables (8)          | **100%** | Same binary format, already implemented                       |
| Shared optional tables       | **100%** | GPOS, GSUB, GDEF, kern, etc. are format-agnostic              |
| Glyph outline data           | **0%**   | Completely different (glyf vs CFF) — no code sharing possible |
| Hinting                      | **0%**   | Completely different model (bytecode vs declarative zones)    |
| Variable font glyph data     | **0%**   | gvar vs CFF2 blend operators                                  |
| Variable font infrastructure | **~80%** | fvar, avar, STAT, MVAR, HVAR, VVAR are shared                 |

---

## 6. Quick Reference — How to Identify Font Type

```javascript
// First 4 bytes of the file determine the outline type:
const sfntVersion = dataView.getUint32(0);

if (sfntVersion === 0x4f54544f) {
	// "OTTO" — CFF outlines (what people typically call "OTF")
} else if (sfntVersion === 0x00010000 || sfntVersion === 0x74727565) {
	// TrueType outlines (what people typically call "TTF")
	// 0x74727565 = "true" (older Apple format, rare)
}
```

---

## Sources

- [OpenType Spec: Font File](https://learn.microsoft.com/en-us/typography/opentype/spec/otff)
- [OpenType Spec: Overview](https://learn.microsoft.com/en-us/typography/opentype/spec/overview)
- [OpenType Spec: glyf Table](https://learn.microsoft.com/en-us/typography/opentype/spec/glyf)
- [OpenType Spec: loca Table](https://learn.microsoft.com/en-us/typography/opentype/spec/loca)
- [OpenType Spec: CFF Table](https://learn.microsoft.com/en-us/typography/opentype/spec/cff)
- [OpenType Spec: CFF2 Table](https://learn.microsoft.com/en-us/typography/opentype/spec/cff2)
- [OpenType Spec: Glyph Format Comparison](https://learn.microsoft.com/en-us/typography/opentype/spec/glyphformatcomparison)
- [Apple TrueType Reference Manual](https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6.html)
