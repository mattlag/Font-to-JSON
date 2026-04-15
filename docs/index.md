# Font Flux JS Documentation

Convert fonts to JSON, make edits, then convert them back!

Font Flux JS is a JavaScript library for parsing OpenType/TrueType font binaries into structured JSON, then exporting that JSON back into a valid font binary. Every table is fully parsed into human-readable fields! If you're ambitious, you can also create a font from scratch.

Font Flux JS is part of the Glyphr Studio family. Any questions or feedback? We'd love to hear from you: mail@glyphrstudio.com

## What this docs site covers

- The `FontFlux` class API and how to use it.
- How to validate before export.
- What the internal font data structure looks like.
- Table-by-table reference pages with JSON fragment examples, practical notes, and pitfalls.

## Quick links

- [Validation guide](./guide/validation.md)
- [Creating Fonts](./creating-fonts.md)
- [Creating Glyphs](./creating-glyphs.md)
- [Creating Kerning](./creating-kerning.md)
- [Creating Substitutions (GSUB)](./creating-substitutions.md)
- [Creating an OTF](./creating-otf.md)
- [Creating a TTF](./creating-ttf.md)
- [Table references](./tables/index.md)

## API

Everything goes through the `FontFlux` class. The library exports two things:

```js
import { FontFlux, initWoff2 } from 'font-flux-js';
```

### Static factories

| Method                                   | Description                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| `FontFlux.open(buffer)`                  | Parse an `ArrayBuffer` into a `FontFlux` instance (TTF/OTF/TTC/WOFF/WOFF2).    |
| `FontFlux.openAll(buffer)`               | Parse a font collection (TTC/OTC), returning an array of `FontFlux` instances. |
| `FontFlux.create(options)`               | Create a new empty font from metadata (`family`, `unitsPerEm`, etc.).          |
| `FontFlux.fromJSON(jsonString)`          | Deserialize a JSON string into a `FontFlux` instance.                          |
| `FontFlux.exportCollection(fonts, opts)` | Export multiple `FontFlux` instances as a single TTC/OTC collection.           |
| `FontFlux.initWoff2()` / `initWoff2()`   | Initialize WOFF2 support (async). Must be awaited once before WOFF2 use.       |

### Instance properties (live references)

| Property         | Description                                                                      |
| ---------------- | -------------------------------------------------------------------------------- |
| `.info`          | Font metadata object (`familyName`, `styleName`, `unitsPerEm`, `ascender`, etc.) |
| `.glyphs`        | Array of glyph objects (`name`, `unicode`, `advanceWidth`, `contours`, ...)      |
| `.kerning`       | Array of kerning pairs `{ left, right, value }`                                  |
| `.substitutions` | Array of GSUB substitution rules (ligatures, small caps, alternates, etc.)       |
| `.axes`          | Variable font axes (from fvar)                                                   |
| `.instances`     | Named instances (from fvar)                                                      |
| `.features`      | OpenType layout features (GPOS, GSUB, GDEF)                                      |
| `.tables`        | All parsed tables (for advanced/lossless access)                                 |
| `.glyphCount`    | Number of glyphs                                                                 |
| `.format`        | Font format string: `'truetype'`, `'cff'`, or `'cff2'`                           |

### Glyph methods

| Method                      | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| `.listGlyphs()`             | List all glyph names                                      |
| `.getGlyph(id)`             | Get glyph by name, code point, or hex string (`'U+0041'`) |
| `.hasGlyph(id)`             | Check if a glyph exists                                   |
| `.addGlyph(glyphOrOptions)` | Add a glyph (raw object or options for createGlyph)       |
| `.removeGlyph(id)`          | Remove a glyph (also cleans up kerning references)        |

### Font info methods

| Method              | Description                            |
| ------------------- | -------------------------------------- |
| `.getInfo()`        | Get the font metadata (live reference) |
| `.setInfo(partial)` | Merge partial updates into font info   |

### Kerning methods

| Method                        | Description                                    |
| ----------------------------- | ---------------------------------------------- |
| `.getKerning(left, right)`    | Look up kerning value between two glyphs       |
| `.addKerning(input)`          | Add kerning pair(s) from flexible input format |
| `.removeKerning(left, right)` | Remove a specific kerning pair                 |
| `.listKerning()`              | List all kerning pairs                         |
| `.clearKerning()`             | Remove all kerning                             |

### Substitution methods (GSUB)

| Method                                | Description                                                      |
| ------------------------------------- | ---------------------------------------------------------------- |
| `.listSubstitutions(filter?)`         | List all substitution rules, optionally filtered by type/feature |
| `.getSubstitution(glyphId, options?)` | Find substitution rules for a specific glyph                     |
| `.addSubstitution(input)`             | Add substitution rule(s) from flexible input format              |
| `.removeSubstitution(filter)`         | Remove rules matching a filter                                   |
| `.clearSubstitutions()`               | Remove all substitutions                                         |

### Axis & instance methods

| Method                   | Description                     |
| ------------------------ | ------------------------------- |
| `.listAxes()`            | List all variation axes         |
| `.getAxis(tag)`          | Get axis by tag (e.g. `'wght'`) |
| `.addAxis(axis)`         | Add a variation axis            |
| `.removeAxis(tag)`       | Remove a variation axis         |
| `.setAxis(tag, changes)` | Update axis properties          |
| `.listInstances()`       | List named instances            |
| `.addInstance(instance)` | Add a named instance            |
| `.removeInstance(name)`  | Remove a named instance         |

### Feature & hinting methods

| Method               | Description                                         |
| -------------------- | --------------------------------------------------- |
| `.getFeatures()`     | Get OpenType features (GPOS, GSUB, GDEF)            |
| `.setFeatures(data)` | Replace or update feature tables                    |
| `.getHinting()`      | Get TrueType hinting tables (gasp, cvt, fpgm, prep) |
| `.setHinting(data)`  | Update TrueType hinting tables                      |

### Export & serialization

| Method              | Description                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| `.export(options?)` | Export to binary `ArrayBuffer`. Options: `{ format: 'sfnt' \| 'woff' \| 'woff2' }` |
| `.toJSON(indent?)`  | Serialize to JSON string                                                           |
| `.validate()`       | Check for structural issues. Returns `{ valid, errors, warnings, ... }`            |
| `.detach()`         | Strip stored tables/header, converting to a pure hand-authored shape               |

### Static utilities

| Method                                     | Description                                                  |
| ------------------------------------------ | ------------------------------------------------------------ |
| `FontFlux.svgToContours(d, format?)`       | Parse an SVG path `d` string into font contour data          |
| `FontFlux.contoursToSVG(contours)`         | Convert font contours to an SVG path `d` string              |
| `FontFlux.interpretCharString(bytes, ...)` | Interpret CFF charstring bytecode into cubic Bézier contours |
| `FontFlux.disassembleCharString(bytes)`    | Disassemble CFF charstring into human-readable text          |
| `FontFlux.compileCharString(contours)`     | Compile CFF contours into Type 2 charstring bytes            |
| `FontFlux.assembleCharString(text)`        | Assemble human-readable charstring text into bytes           |

See the [README](https://github.com/mattlag/Font-Flux-JS#readme) for installation and usage examples.

## Internal data structure

`FontFlux.open()` parses a font binary into a **simplified** internal structure. The instance properties (`.info`, `.glyphs`, `.kerning`, etc.) are live references into this data:

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
	"substitutions": [
		{
			"type": "ligature",
			"feature": "liga",
			"components": ["f", "i"],
			"ligature": "fi"
		}
	],
	"tables": {
		"head": { "unitsPerEm": 1000, "...": "..." },
		"cmap": { "...": "..." }
	},
	"_header": { "sfVersion": 65536 }
}
```

The top-level fields (`font`, `glyphs`, `kerning`) are the human-friendly editing interface. The `tables` object preserves every parsed table for lossless binary round-trip.

## Working with glyph outlines

`FontFlux.open()` produces simplified glyph data with decoded outline contours ready for inspection and editing.

For a complete guide to creating glyphs from scratch — including metadata, outline formats, and examples — see [Creating Glyphs](./creating-glyphs.md).

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

Use `FontFlux.interpretCharString()` and `FontFlux.disassembleCharString()` for manual charstring work at the table level.

### SVG path conversion

Font Flux provides read/write conversion between glyph contours and SVG path `d` strings. This is useful for visual editing, round-trip glyph modification, and interop with SVG-based tools.

```js
import { FontFlux } from 'font-flux-js';

// Read: contours → SVG path string
const d = FontFlux.contoursToSVG(glyph.contours);
// d = "M100 700 L400 700 C400 500 200 300 100 300 Z"

// Write: SVG path string → contours
const cffContours = FontFlux.svgToContours(d, 'cff'); // cubic commands
const ttfContours = FontFlux.svgToContours(d, 'truetype'); // quadratic points
```

`FontFlux.contoursToSVG()` auto-detects whether the input is TrueType or CFF format:

- TrueType contours produce `Q` (quadratic) commands in the SVG path.
- CFF contours produce `C` (cubic) commands.

`FontFlux.svgToContours()` accepts any valid SVG path (M, L, H, V, C, S, Q, T, Z plus relative variants) and converts to the requested format:

- `'cff'` — cubic command objects. Quadratic curves are promoted to cubic (lossless degree elevation).
- `'truetype'` — point arrays with `onCurve`. Cubic curves are approximated as quadratic (subdivision with 0.5-unit error threshold).

Coordinates are kept in font-space (Y-up). To render in SVG (Y-down), apply `transform="scale(1,-1)"` on the SVG element.

## Workflow recommendation

1. Start from `FontFlux.open()` output when possible.
2. Edit via instance properties and methods (`.info`, `.glyphs`, `.addGlyph()`, etc.) for common changes.
3. Edit `.tables` directly for low-level or table-specific changes.
4. Run `.validate()` to check for structural issues.
5. Only call `.export()` when `report.valid === true`.
