# Simplified Schema Design

> Design document for the `raw` / `simplified` dual-layer JSON structure in Font Flux JS.

---

## Overview

Currently, `importFont()` returns a JSON object that mirrors the binary font file table-by-table:

```json
{ "header": { ... }, "tables": { "head": { ... }, "cmap": { ... }, ... } }
```

This is perfect for fidelity but painful for humans. Information about a single glyph is scattered across 4+ tables (`glyf`/`CFF` for outlines, `hmtx` for metrics, `cmap` for unicode mapping, `post` for names). The `name` table encodes simple strings behind platform/encoding/language ID tuples. Metrics that logically belong together are split across `head`, `hhea`, `OS/2`, and `post`.

The new structure wraps the existing output as `raw` and adds a `simplified` view:

```json
{
  "raw": { "header": { ... }, "tables": { ... } },
  "simplified": { "font": { ... }, "glyphs": [ ... ], ... }
}
```

**Import**: binary → parse into `raw` → derive `simplified` from `raw`
**Export**: if `simplified` present → map back to `raw` fields → encode `raw` to binary
**Human authoring**: write only `simplified` (no `raw` needed) → export fills in `raw` automatically

---

## The `simplified` Schema

```jsonc
{
  "simplified": {

    // ── Font identity and metadata ──────────────────────────────────
    "font": {
      "familyName": "My Font",           // REQUIRED
      "styleName": "Regular",            // REQUIRED
      "unitsPerEm": 1000,                // REQUIRED

      // Auto-derived if omitted:
      "fullName": "My Font Regular",             // default: familyName + " " + styleName
      "postScriptName": "MyFont-Regular",        // default: familyName (no spaces) + "-" + styleName

      // Optional identity strings:
      "version": "Version 1.000",
      "copyright": "Copyright 2024 ...",
      "trademark": "...",
      "manufacturer": "...",
      "designer": "...",
      "description": "...",
      "vendorURL": "https://...",
      "designerURL": "https://...",
      "license": "...",
      "licenseURL": "https://...",
      "sampleText": "The quick brown fox...",
      "uniqueID": "...",                         // default: manufacturer + ": " + fullName

      // Core vertical metrics (REQUIRED for proper rendering):
      "ascender": 800,
      "descender": -200,
      "lineGap": 0,                              // default: 0

      // Style properties:
      "italicAngle": 0,                          // default: 0
      "underlinePosition": -100,
      "underlineThickness": 50,
      "isFixedPitch": false,                     // default: false
      "weightClass": 400,                        // default: 400
      "widthClass": 5,                           // default: 5 (Normal)

      // OS/2 classification (optional):
      "fsType": 0,
      "fsSelection": 64,                         // default: auto-derived from style
      "achVendID": "XXXX",                       // default: "XXXX"
      "panose": [0,0,0,0,0,0,0,0,0,0],

      // Timestamps (ISO 8601 strings — converted to/from OpenType longdatetime):
      "created": "2024-01-15T00:00:00Z",         // default: now
      "modified": "2024-01-15T00:00:00Z"          // default: now
    },

    // ── Glyphs ──────────────────────────────────────────────────────
    // Each glyph is a self-contained object: outline + metrics + mapping.
    // This merges data from glyf/CFF + hmtx + cmap + post into one place.
    "glyphs": [
      {
        "name": ".notdef",                // glyph name (→ post / CFF charset)
        "advanceWidth": 500,              // REQUIRED (→ hmtx)
        "leftSideBearing": 0,             // default: computed from outline xMin

        // Unicode mapping (→ builds cmap table):
        "unicode": null,                  // primary codepoint (number or null)
        "unicodes": [],                   // all codepoints (for multi-mapped glyphs)

        // ── TrueType outlines (glyf table) ──
        // Simple glyph — array of contours, each contour is an array of points:
        "contours": [
          [
            { "x": 100, "y": 0, "onCurve": true },
            { "x": 100, "y": 700, "onCurve": true },
            { "x": 500, "y": 700, "onCurve": true },
            { "x": 500, "y": 0, "onCurve": true }
          ]
        ],
        "instructions": [0, 1, 2],        // TrueType instructions (optional)

        // Composite glyph — references to other glyphs:
        "components": [
          {
            "glyphIndex": 36,              // index into glyphs array
            "dx": 0, "dy": 0,             // translation offset
            "scale": 1.0,                  // uniform scale (optional)
            "scaleXY": { "x": 1.0, "y": 1.0 },  // non-uniform (optional)
            "transform": { "xx": 1, "xy": 0, "yx": 0, "yy": 1 },  // 2×2 (optional)
            "useMyMetrics": false
          }
        ],

        // ── CFF outlines ──
        // CFF charstrings are stored as byte arrays (binary-encoded path ops).
        // These round-trip losslessly. Human authoring of CFF paths is possible
        // but requires understanding the CFF charstring format.
        "charString": [139, 234, 117, ...],

        // ── Vertical metrics (if vhea/vmtx present) ──
        "advanceHeight": 1000,
        "topSideBearing": 800
      }
    ],

    // ── Kerning ─────────────────────────────────────────────────────
    // Unified representation of kerning from either the `kern` table
    // or GPOS PairPos lookups. Uses glyph names for human readability;
    // resolved to indices during export.
    "kerning": [
      { "left": "A", "right": "V", "value": -80 },
      { "left": "T", "right": "o", "value": -40 }
    ],

    // ── OpenType features (passthrough) ─────────────────────────────
    // GPOS/GSUB/GDEF are extremely complex structures. For the initial
    // implementation, they pass through from raw when imported, and are
    // written back to raw verbatim on export. A user creating a font
    // from scratch can omit these entirely.
    //
    // Future work: simplify common feature patterns (e.g., ligatures
    // as "f + i → fi" rules, stylistic alternates as name→name maps).
    "features": {
      "GPOS": null,
      "GSUB": null,
      "GDEF": null
    },

    // ── Variable font axes ──────────────────────────────────────────
    "axes": [
      {
        "tag": "wght",
        "name": "Weight",              // human-readable, from name table
        "min": 100,
        "default": 400,
        "max": 900,
        "hidden": false
      }
    ],

    // ── Named instances ─────────────────────────────────────────────
    "instances": [
      {
        "name": "Bold",                // from name table
        "coordinates": { "wght": 700 },
        "postScriptName": "MyFont-Bold"
      }
    ],

    // ── Hinting — gasp table (optional) ─────────────────────────────
    "gasp": [
      { "maxPPEM": 8, "behavior": 2 },
      { "maxPPEM": 65535, "behavior": 15 }
    ],

    // ── TrueType hinting programs (optional, passthrough) ───────────
    "cvt": [0, 10, 20, ...],
    "fpgm": [0, 1, 2, ...],
    "prep": [0, 1, 2, ...]
  }
}
```

---

## Field-by-Field Mapping: `simplified` ↔ `raw`

### Font Identity → name table

The `name` table stores strings as records with `(platformID, encodingID, languageID, nameID)` tuples. The simplified layer uses plain string properties.

**On import** (raw → simplified): Extract the best available string for each nameID, preferring Windows Unicode BMP (platform 3, encoding 1, language 0x0409) → Unicode (platform 0) → Macintosh Roman (platform 1).

**On export** (simplified → raw): Generate name records for all three platforms for each supplied string.

| simplified field      | nameID | raw table |
| --------------------- | ------ | --------- |
| `font.copyright`      | 0      | `name`    |
| `font.familyName`     | 1      | `name`    |
| `font.styleName`      | 2      | `name`    |
| `font.uniqueID`       | 3      | `name`    |
| `font.fullName`       | 4      | `name`    |
| `font.version`        | 5      | `name`    |
| `font.postScriptName` | 6      | `name`    |
| `font.trademark`      | 7      | `name`    |
| `font.manufacturer`   | 8      | `name`    |
| `font.designer`       | 9      | `name`    |
| `font.description`    | 10     | `name`    |
| `font.vendorURL`      | 11     | `name`    |
| `font.designerURL`    | 12     | `name`    |
| `font.license`        | 13     | `name`    |
| `font.licenseURL`     | 14     | `name`    |
| `font.sampleText`     | 19     | `name`    |

**Auto-derived on export if omitted:**

- `fullName` = `familyName + " " + styleName`
- `postScriptName` = `familyName.replace(/\s/g, '') + "-" + styleName`
- `uniqueID` = `manufacturer + ": " + fullName` (or `fullName` if no manufacturer)
- `version` = `"Version 1.000"`

### Font Metrics → head + hhea + OS/2 + post

| simplified field          | raw field(s) written                                                          | Notes                                          |
| ------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| `font.unitsPerEm`         | `head.unitsPerEm`                                                             | Required                                       |
| `font.ascender`           | `hhea.ascender`, `OS/2.sTypoAscender`                                         | Required                                       |
| `font.descender`          | `hhea.descender`, `OS/2.sTypoDescender`                                       | Required                                       |
| `font.lineGap`            | `hhea.lineGap`, `OS/2.sTypoLineGap`                                           | Default: 0                                     |
| `font.italicAngle`        | `post.italicAngle`, influences `head.macStyle` bit 1                          | Default: 0                                     |
| `font.underlinePosition`  | `post.underlinePosition`                                                      |                                                |
| `font.underlineThickness` | `post.underlineThickness`                                                     |                                                |
| `font.isFixedPitch`       | `post.isFixedPitch`                                                           | Default: false → 0                             |
| `font.weightClass`        | `OS/2.usWeightClass`, influences `head.macStyle` bit 0 and `OS/2.fsSelection` | Default: 400                                   |
| `font.widthClass`         | `OS/2.usWidthClass`                                                           | Default: 5                                     |
| `font.fsType`             | `OS/2.fsType`                                                                 | Default: 0                                     |
| `font.fsSelection`        | `OS/2.fsSelection`                                                            | Default: auto (REGULAR=64, BOLD, ITALIC, etc.) |
| `font.achVendID`          | `OS/2.achVendID`                                                              | Default: "XXXX"                                |
| `font.panose`             | `OS/2.panose`                                                                 | Default: [0,0,0,0,0,0,0,0,0,0]                 |
| `font.created`            | `head.created` (ISO 8601 → longdatetime)                                      | Default: current time                          |
| `font.modified`           | `head.modified` (ISO 8601 → longdatetime)                                     | Default: current time                          |

### Auto-calculated fields (never stored in simplified)

These raw fields are **always computed** from glyph data during simplified → raw export. A human never needs to supply them:

| raw field                           | Computed from                                                   |
| ----------------------------------- | --------------------------------------------------------------- |
| `head.xMin`, `yMin`, `xMax`, `yMax` | Min/max of all glyph bounding boxes                             |
| `head.macStyle`                     | `weightClass ≥ 700` → BOLD bit; `italicAngle ≠ 0` → ITALIC bit  |
| `head.indexToLocFormat`             | Whether loca offsets fit in uint16 (divide by 2) or need uint32 |
| `head.checksumAdjustment`           | Whole-file checksum                                             |
| `hhea.advanceWidthMax`              | Max of all glyph advance widths                                 |
| `hhea.minLeftSideBearing`           | Min of all glyph left side bearings                             |
| `hhea.minRightSideBearing`          | Min of all (advanceWidth - (lsb + xMax - xMin))                 |
| `hhea.xMaxExtent`                   | Max of all (lsb + xMax - xMin)                                  |
| `hhea.numberOfHMetrics`             | Number of glyphs                                                |
| `maxp.numGlyphs`                    | `glyphs.length`                                                 |
| `OS/2.xAvgCharWidth`                | Average advance width across all glyphs                         |
| `OS/2.usFirstCharIndex`             | Min unicode codepoint                                           |
| `OS/2.usLastCharIndex`              | Max unicode codepoint                                           |
| `OS/2.ulUnicodeRange1-4`            | Computed from glyph unicode coverage                            |
| `OS/2.usWinAscent`                  | Global yMax                                                     |
| `OS/2.usWinDescent`                 | `abs(global yMin)`                                              |
| `OS/2.sxHeight`                     | yMax of glyphs for 'x', 'v', 'w', 'y' (or ascender/2)           |
| `OS/2.sCapHeight`                   | yMax of glyphs for 'H', 'I', 'K', etc. (or global yMax)         |
| `OS/2.usDefaultChar`                | 32 if space glyph exists, else 0                                |
| `OS/2.usBreakChar`                  | 32 if space glyph exists, else 0                                |
| `header.searchRange`                | `16 * 2^floor(log2(numTables))`                                 |
| `header.entrySelector`              | `floor(log2(numTables))`                                        |
| `header.rangeShift`                 | `numTables * 16 - searchRange`                                  |
| `loca` (entire table)               | Byte offsets derived from glyf data                             |
| `hmtx` (entire table)               | From individual glyph advanceWidth + leftSideBearing            |
| `cmap` (entire table)               | From individual glyph unicode(s)                                |

### Glyphs → glyf/CFF + hmtx + cmap + post

The `simplified.glyphs` array is the core of the human-friendly format. Each glyph is self-contained.

**On import** (raw → simplified):

| simplified glyph field | Source in raw                                                           |
| ---------------------- | ----------------------------------------------------------------------- |
| `name`                 | `post.glyphNames[i]` (v2) or standard name table (v1) or CFF charset    |
| `unicode`              | First codepoint from `cmap` that maps to this glyph index               |
| `unicodes`             | All codepoints from `cmap` that map to this glyph index (if >1)         |
| `advanceWidth`         | `hmtx.hMetrics[i].advanceWidth` (or last hMetric for tail glyphs)       |
| `leftSideBearing`      | `hmtx.hMetrics[i].lsb` or `hmtx.leftSideBearings[i - numberOfHMetrics]` |
| `contours`             | `glyf.glyphs[i].contours` (simple glyph, TrueType only)                 |
| `instructions`         | `glyf.glyphs[i].instructions` (TrueType only)                           |
| `components`           | `glyf.glyphs[i].components` (composite glyph, TrueType only)            |
| `charString`           | `CFF.fonts[0].charStrings[i]` (CFF only)                                |
| `advanceHeight`        | `vmtx.vMetrics[i].advanceHeight` (if vmtx present)                      |
| `topSideBearing`       | `vmtx.vMetrics[i].tsb` (if vmtx present)                                |

**On export** (simplified → raw):

1. **glyf table**: Built from `glyphs[].contours` / `glyphs[].components`. Bounding box (`xMin`, `yMin`, `xMax`, `yMax`) computed from contour points. `null` entries for glyphs with no outlines.
2. **CFF table**: `charStrings` assembled from `glyphs[].charString`. Charset built from `glyphs[].name`.
3. **hmtx table**: `hMetrics` assembled from `glyphs[].advanceWidth` + `glyphs[].leftSideBearing`.
4. **cmap table**: Subtables generated from `glyphs[].unicode` / `glyphs[].unicodes`. Format 4 (BMP) or Format 12 (if any codepoint > 0xFFFF).
5. **post table**: `glyphNames` assembled from `glyphs[].name`.
6. **loca table**: Derived from written glyf byte offsets (not from simplified directly).

### Kerning → kern / GPOS

**On import**:

- Extract pairs from `kern` table (format 0 subtables: `pairs[].left`, `pairs[].right`, `pairs[].value`)
- Also extract pairs from GPOS PairPos lookups (lookup type 2) where the value is a simple xAdvance adjustment
- Resolve glyph indices to glyph names using `simplified.glyphs[index].name`
- Deduplicate — GPOS pairs override kern pairs if both exist

**On export**:

- Resolve glyph names to indices
- Write to `kern` table (format 0) as the default target
- If the source `raw` had GPOS kerning instead, write to GPOS (preserve the original structure)

### Variable Font → fvar + name

**On import**:

- `simplified.axes[i].tag` ← `fvar.axes[i].axisTag`
- `simplified.axes[i].name` ← Look up `fvar.axes[i].axisNameID` in name table
- `simplified.axes[i].min/default/max` ← `fvar.axes[i].minValue/defaultValue/maxValue`
- `simplified.axes[i].hidden` ← `fvar.axes[i].flags & 0x0001`
- `simplified.instances[i].name` ← Look up `fvar.instances[i].subfamilyNameID` in name table
- `simplified.instances[i].coordinates` ← Map `fvar.instances[i].coordinates` array to `{ [axisTag]: value }` object

**On export**:

- Create name table records for axis names and instance names
- Build `fvar.axes` and `fvar.instances` arrays from simplified representations

### Hinting → gasp, cvt, fpgm, prep

These are passed through with minimal transformation:

- `simplified.gasp` ↔ `raw.tables.gasp.gaspRanges` (if the raw table structure uses that shape — adapt to actual field names)
- `simplified.cvt` ↔ `raw.tables['cvt '].values`
- `simplified.fpgm` ↔ `raw.tables.fpgm.instructions`
- `simplified.prep` ↔ `raw.tables.prep.instructions`

---

## Timestamp Conversion

OpenType uses "longdatetime" — a signed 64-bit integer counting seconds since **1904-01-01 00:00:00 UTC**.

```
ISO 8601 string  ↔  OpenType longdatetime (BigInt)

// ISO → longdatetime:
const EPOCH_OFFSET = BigInt(Date.UTC(1904, 0, 1, 0, 0, 0)) // -2082844800000ms
const ms = Date.parse(isoString)
const longdatetime = BigInt(ms - Number(EPOCH_OFFSET)) / 1000n

// longdatetime → ISO:
const ms = Number(longdatetime * 1000n) + Number(EPOCH_OFFSET)
new Date(ms).toISOString()
```

---

## Export Priority Rules

When exporting, the system resolves data in this priority order:

1. **`raw` tables** — if `raw` is provided and has full table data, use it directly (this is the existing path, unchanged)
2. **`simplified` overrides** — if `simplified` is present, its data takes priority and is mapped into `raw` before encoding
3. **Auto-derivation** — fields in the "auto-calculated" table above are always recomputed from the final glyph data

This means:

- **Import → re-export**: both `raw` and `simplified` exist. `raw` is used by default (preserves original bytes). The `simplified` data is informational.
- **Human-authored JSON**: only `simplified` exists. The export pipeline builds `raw` from `simplified`, then encodes.
- **Hybrid**: if both exist and the user modified `simplified`, the `simplified` data overwrites the corresponding `raw` fields.

A flag (to be designed) could control behavior: `"source": "simplified"` or `"source": "raw"` to explicitly choose. Default: `"simplified"` if present, otherwise `"raw"`.

---

## What Humans Must Provide (Minimum Viable Font)

To create a font from scratch using only `simplified`, a human needs:

```jsonc
{
	"simplified": {
		"font": {
			"familyName": "My Font",
			"styleName": "Regular",
			"unitsPerEm": 1000,
			"ascender": 800,
			"descender": -200,
		},
		"glyphs": [
			{
				"name": ".notdef",
				"advanceWidth": 500,
				"contours": [
					[
						{ "x": 50, "y": 0, "onCurve": true },
						{ "x": 50, "y": 700, "onCurve": true },
						{ "x": 450, "y": 700, "onCurve": true },
						{ "x": 450, "y": 0, "onCurve": true },
					],
				],
			},
			{
				"name": "space",
				"unicode": 32,
				"advanceWidth": 250,
			},
			{
				"name": "A",
				"unicode": 65,
				"advanceWidth": 600,
				"contours": [
					[
						{ "x": 0, "y": 0, "onCurve": true },
						{ "x": 300, "y": 700, "onCurve": true },
						{ "x": 600, "y": 0, "onCurve": true },
					],
				],
			},
		],
	},
}
```

Everything else — `head`, `hhea`, `maxp`, `OS/2`, `name`, `post`, `cmap`, `hmtx`, `loca` — is auto-generated.

---

## Implementation Plan

### Phase 1: Import — `raw` → `simplified` derivation

New module: `src/simplify.js`

- `buildSimplified(raw)` → simplified object
- Functions for each section:
  - `extractFontIdentity(nameTbl)` — reads name records, picks best platform
  - `extractFontMetrics(head, hhea, os2, post)` — merges metrics
  - `buildSimplifiedGlyphs(glyf|CFF, hmtx, cmap, post, vmtx?)` — builds unified glyphs
  - `extractKerning(kern, GPOS, glyphNames)` — unified kerning
  - `extractVariationAxes(fvar, nameTbl)` — axes + instances
  - `longdatetimeToISO(bigint)` — timestamp conversion

### Phase 2: Export — `simplified` → `raw` expansion

New module: `src/expand.js`

- `buildRawFromSimplified(simplified)` → raw object
- Functions for each section:
  - `buildNameTable(font)` — generates multi-platform name records
  - `buildHeadTable(font, glyphMetrics)` — head from metrics
  - `buildHheaTable(font, glyphMetrics)` — hhea from metrics
  - `buildOS2Table(font, glyphMetrics)` — OS/2 from metrics
  - `buildPostTable(font, glyphs)` — post from glyph names
  - `buildGlyfTable(glyphs)` — glyf from contours/components
  - `buildHmtxTable(glyphs)` — hmtx from glyph metrics
  - `buildCmapTable(glyphs)` — cmap from glyph unicodes
  - `buildMaxpTable(glyphs, isCFF)` — maxp from glyph count
  - `buildKernTable(kerning, glyphNameToIndex)` — kern from pairs
  - `isoToLongdatetime(string)` — timestamp conversion
  - `computeGlyphMetrics(glyphs)` — bbox/bearing aggregates

### Phase 3: Integration

- Modify `importFont()` to return `{ raw: { header, tables }, simplified: {...} }`
- Modify `exportFont()` to check for `simplified` and expand it before encoding
- Update collection (TTC) flow similarly
- Add tests for the new round-trip: import → simplified → export → reimport

### Phase 4: Future Enhancements

- Simplified CFF path commands (moveTo/lineTo/curveTo instead of raw charstring bytes)
- Simplified GSUB features (ligature rules as `"f + i → fi"`)
- Simplified GPOS features (mark positioning, cursive attachment)
- JSON Schema / validation for the simplified structure
