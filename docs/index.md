# Font Flux JS Documentation

Convert fonts to JSON, make edits, then convert them back!

Font Flux JS is a JavaScript library for parsing OpenType/TrueType font binaries into structured JSON, then exporting that JSON back into a valid font binary. Every table is fully parsed into human-readable fields! If you're ambitious, you can also create a font JSON from scratch and turn it into a font.

Font Flux JS is part of the Glyphr Studio family. Any questions or feedback? We'd love to hear from you: mail@glyphrstudio.com

## What this docs site covers

- How to validate JSON before export.
- What a valid top-level font JSON object looks like.
- Table-by-table reference pages with JSON fragment examples, practical notes, and pitfalls.

## Quick links

- [Validation guide](./guide/validation.md)
- [Creating Fonts](./creating-fonts.md)
- [Creating an OTF](./creating-otf.md)
- [Creating a TTF](./creating-ttf.md)
- [Creating a TTC / OTC Collection](./creating-ttc-otc.md)
- [Table references](./tables/index.md)

## API

| Function                                    | Description                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `importFont(buffer)`                        | Parse an `ArrayBuffer` into a simplified font object (TTF/OTF/TTC/WOFF/WOFF2). |
| `exportFont(fontData, options?)`            | Convert a font object back to binary. Returns an `ArrayBuffer`.                |
| `fontToJSON(fontData, indent?)`             | Serialize a font object to a JSON string (handles BigInt, strips internals).   |
| `fontFromJSON(jsonString)`                  | Deserialize a JSON string back into a font object for `exportFont`.            |
| `initWoff2()`                               | Initialize WOFF2 support (async). Must be awaited once before WOFF2 use.       |
| `validateJSON(fontData)`                    | Check a font object for structural issues. Returns `{ valid, issues[] }`.      |
| `buildSimplified(raw)`                      | Convert raw `{ header, tables }` into the simplified structure.                |
| `buildRawFromSimplified(simplified)`        | Convert simplified back to `{ header, tables }`.                               |
| `importFontTables(buffer)`                  | Low-level import returning raw `{ header, tables }` without simplification.    |
| `interpretCharString(bytes, subrs, gsubrs)` | Interpret CFF Type 2 charstring bytes into cubic Bézier contour commands.      |
| `disassembleCharString(bytes)`              | Disassemble CFF charstring bytes into human-readable text.                     |
| `contoursToSVGPath(contours)`               | Convert glyph contours (TrueType or CFF) to an SVG path `d` string.            |
| `svgPathToContours(pathData, format)`       | Parse an SVG path `d` string into `'truetype'` or `'cff'` contours.            |

See the [README](https://github.com/mattlag/Font-Flux-JS#readme) for installation and usage examples.

## Top-level JSON shape

`importFont` returns a **simplified** structure:

```json
{
	"font": {
		"familyName": "MyFont",
		"styleName": "Regular",
		"unitsPerEm": 1000,
		"ascender": 800,
		"descender": -200
	},
	"glyphs": [
		{ "name": ".notdef", "advanceWidth": 500 },
		{ "name": "A", "unicode": 65, "advanceWidth": 600, "contours": ["..."] }
	],
	"kerning": [{ "left": "A", "right": "V", "value": -80 }],
	"tables": {
		"head": { "unitsPerEm": 1000, "...": "..." },
		"cmap": { "...": "..." }
	},
	"_header": { "sfVersion": 65536 }
}
```

The top-level fields (`font`, `glyphs`, `kerning`) are the human-friendly editing interface. The `tables` object preserves every parsed table for lossless binary round-trip.

## Working with glyph outlines

`importFont` produces simplified glyph data with decoded outline contours ready for inspection and editing.

### TrueType glyphs (TTF)

TrueType glyphs use **quadratic Bézier** curves. Each contour is an array of points:

```json
{ "x": 200, "y": 500, "onCurve": true }
```

- `onCurve: true` — an on-curve point (line endpoint or curve anchor).
- `onCurve: false` — a quadratic off-curve control point.
- Consecutive off-curve points have an implied on-curve midpoint between them.

### CFF glyphs (OTF)

CFF glyphs use **cubic Bézier** curves. The raw table stores opaque Type 2 charstring byte arrays. Font Flux interprets these into contour commands:

```json
{ "type": "M", "x": 100, "y": 700 }
{ "type": "L", "x": 400, "y": 700 }
{ "type": "C", "x1": 400, "y1": 500, "x2": 200, "y2": 300, "x": 100, "y": 300 }
```

- `M` — moveTo (start of contour)
- `L` — lineTo
- `C` — cubic curveTo with two control points (`x1,y1`, `x2,y2`) and an endpoint (`x,y`)

Each simplified CFF glyph includes:

- `contours` — decoded cubic Bézier commands (as above)
- `charString` — the raw charstring byte array (for lossless round-tripping)
- `charStringDisassembly` — human-readable disassembly text

Use `interpretCharString` and `disassembleCharString` for manual charstring work at the table level.

### SVG path conversion

Font Flux provides read/write conversion between glyph contours and SVG path `d` strings. This is useful for visual editing, round-trip glyph modification, and interop with SVG-based tools.

```js
import { contoursToSVGPath, svgPathToContours } from 'font-flux';

// Read: contours → SVG path string
const d = contoursToSVGPath(glyph.contours);
// d = "M100 700 L400 700 C400 500 200 300 100 300 Z"

// Write: SVG path string → contours
const cffContours = svgPathToContours(d, 'cff'); // cubic commands
const ttfContours = svgPathToContours(d, 'truetype'); // quadratic points
```

`contoursToSVGPath` auto-detects whether the input is TrueType or CFF format:

- TrueType contours produce `Q` (quadratic) commands in the SVG path.
- CFF contours produce `C` (cubic) commands.

`svgPathToContours` accepts any valid SVG path (M, L, H, V, C, S, Q, T, Z plus relative variants) and converts to the requested format:

- `'cff'` — cubic command objects. Quadratic curves are promoted to cubic (lossless degree elevation).
- `'truetype'` — point arrays with `onCurve`. Cubic curves are approximated as quadratic (subdivision with 0.5-unit error threshold).

Coordinates are kept in font-space (Y-up). To render in SVG (Y-down), apply `transform="scale(1,-1)"` on the SVG element.

## Workflow recommendation

1. Start from `importFont` output when possible.
2. Edit the simplified fields (`font`, `glyphs`, `kerning`) for common changes.
3. Edit `tables` directly for low-level or table-specific changes.
4. Run `validateJSON` to check for structural issues.
5. Only call `exportFont` when `report.valid === true`.
