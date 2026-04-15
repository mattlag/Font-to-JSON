# Creating Glyphs

This guide covers how to create individual glyph data for a Font Flux font. Whether you're building a font from scratch in a font editor, generating glyphs programmatically, or hand-authoring JSON — this is the reference for glyph structure, metadata, and outline formats.

## Quick start with `.addGlyph()`

The `.addGlyph()` method accepts metadata and outline data in several formats, and adds the glyph to the font.

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.create({ family: 'My Font' });

font.addGlyph({
	name: 'A',
	unicode: 65,
	advanceWidth: 600,
	path: 'M 0 0 L 250 700 L 500 700 L 250 0 Z',
});
```

That's the simplest form — a name, a Unicode code point, a width, and an SVG path string. The method handles everything else: contour conversion, format detection, and charstring compilation.

You can also construct glyph objects directly as plain JSON and push them into `font.glyphs` without using `.addGlyph()`. The method is a convenience, not a requirement.

## Looking up glyphs with `.getGlyph()`

Use `.getGlyph()` to look up a glyph by name, Unicode code point, or hex string:

```js
font.getGlyph('A'); // by glyph name
font.getGlyph(65); // by numeric code point
font.getGlyph('U+0041'); // by hex string
font.getGlyph('0x41'); // also works
```

Returns the glyph object or `undefined` if not found. The same flexible identifiers work with `.getKerning()` — see [Creating Kerning](./creating-kerning.md).

## Glyph metadata reference

### Required fields

| Field          | Type     | Description                                                                                                                                           |
| -------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`         | `string` | The glyph's PostScript name. Used in the `post` table and CFF charset. Examples: `".notdef"`, `"space"`, `"A"`, `"uni0041"`, `"ampersand"`.           |
| `advanceWidth` | `number` | Horizontal advance width in font units. This is the total horizontal space the glyph occupies, including any whitespace before and after the outline. |

### Optional fields

| Field             | Type       | Default         | Description                                                                                                                                                                                                                                                               |
| ----------------- | ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unicode`         | `number`   | —               | Single Unicode code point mapped to this glyph. Example: `65` for "A".                                                                                                                                                                                                    |
| `unicodes`        | `number[]` | —               | Multiple Unicode code points for glyphs mapped to more than one character. Takes priority over `unicode` if both are specified.                                                                                                                                           |
| `leftSideBearing` | `number`   | xMin of outline | The distance from the glyph origin (x=0) to the leftmost edge of the outline. Almost always equals the outline's minimum x coordinate, so you rarely need to set this. Only specify it if you intentionally want the glyph origin offset from the leftmost outline point. |
| `advanceHeight`   | `number`   | —               | Vertical advance height (for vertical text layout). Only needed if your font includes vertical metrics (`vhea`/`vmtx` tables).                                                                                                                                            |
| `topSideBearing`  | `number`   | —               | Vertical top side bearing (for vertical text layout).                                                                                                                                                                                                                     |
| `instructions`    | `number[]` | —               | TrueType hinting instructions as a byte array. Only relevant for TTF glyphs that need hinting.                                                                                                                                                                            |

### Unicode mapping

Most glyphs have a single Unicode code point:

```js
{ name: 'A', unicode: 65, advanceWidth: 600 }
```

Some glyphs map to multiple code points (e.g., a glyph used for both a Latin and Greek character):

```js
{ name: 'Omega', unicodes: [937, 8486], advanceWidth: 700 }
```

Glyphs with no Unicode mapping (like `.notdef` or unencoded alternates) omit both fields:

```js
{ name: '.notdef', advanceWidth: 500 }
```

### Understanding `advanceWidth`

The advance width is the total horizontal space occupied by the glyph, measured in font units. It includes:

- **Left side bearing (LSB)**: space from the glyph origin to the left edge of the outline
- **Glyph width**: the actual width of the drawn outline
- **Right side bearing (RSB)**: space from the right edge of the outline to the advance width

```
|←─── advanceWidth ──────────────→|
|     |←─ glyph width ─→|        |
|←LSB→|                  |←─RSB──→|
|     |   ██   ██        |        |
|     |  ████████        |        |
|     | ██      ██       |        |
|     |██        ██      |        |
origin                     next glyph origin
```

LSB and RSB are derived from the outline bounds and advance width — you don't need to specify them. The only metric you must provide is `advanceWidth`.

### About `leftSideBearing`

The left side bearing defaults to the minimum x coordinate of the glyph's outline. This is correct for nearly all glyphs. The only reason to set it explicitly is if you want the glyph origin to not align with the leftmost outline point — an extremely rare situation.

**Recommendation: don't set `leftSideBearing` unless you have a specific reason to.**

## Outline formats

Font Flux supports three ways to specify glyph outlines. Use whichever is most natural for your workflow.

### 1. SVG path string (`path`)

The easiest format for hand-authoring. Provide an SVG path `d` attribute string and let Font Flux handle the conversion.

```js
font.addGlyph({
	name: 'square',
	unicode: 0x25a0,
	advanceWidth: 800,
	path: 'M 100 0 L 100 700 L 700 700 L 700 0 Z',
});
```

Supported SVG commands: `M` (moveTo), `L` (lineTo), `C` (cubic curveTo), `Q` (quadratic curveTo), `Z` (closePath), and their lowercase (relative) variants. `H` (horizontal lineTo), `V` (vertical lineTo), `S` (smooth cubic), `T` (smooth quadratic), and `A` (arc) are also supported.

#### Format hint

By default, SVG paths are converted to **CFF contours** (cubic Béziers for OTF). To produce TrueType contours (quadratic Béziers for TTF), pass `format: 'truetype'`:

```js
font.addGlyph({
	name: 'square',
	unicode: 0x25a0,
	advanceWidth: 800,
	path: 'M 100 0 L 100 700 L 700 700 L 700 0 Z',
	format: 'truetype',
});
```

If the SVG path contains cubic curves (`C` commands) and you specify `format: 'truetype'`, the cubics are automatically approximated as quadratic curves.

#### When to use SVG paths

- You're exporting outlines from an SVG-based design tool (Figma, Illustrator, Inkscape).
- You want the simplest possible hand-authoring experience.
- You're generating outlines programmatically and SVG path syntax is familiar.

### 2. CFF contours (PostScript / cubic Bézier)

CFF contours use the same format that `FontFlux.open()` produces for OTF files. Each contour is an array of commands with `type`, `x`, `y` properties.

#### Commands

| Type | Name    | Properties                       | Description                                                                               |
| ---- | ------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `M`  | moveTo  | `x`, `y`                         | Start a new contour at this point. Every contour must begin with an `M` command.          |
| `L`  | lineTo  | `x`, `y`                         | Draw a straight line to this point.                                                       |
| `C`  | curveTo | `x1`, `y1`, `x2`, `y2`, `x`, `y` | Draw a cubic Bézier curve. `x1,y1` and `x2,y2` are control points; `x,y` is the endpoint. |

#### Example: Triangle

```js
font.addGlyph({
	name: 'triangle',
	unicode: 0x25b3,
	advanceWidth: 700,
	contours: [
		[
			{ type: 'M', x: 50, y: 0 },
			{ type: 'L', x: 350, y: 700 },
			{ type: 'L', x: 650, y: 0 },
		],
	],
});
```

#### Example: Letter with a curve

```js
font.addGlyph({
	name: 'D',
	unicode: 68,
	advanceWidth: 650,
	contours: [
		[
			{ type: 'M', x: 80, y: 0 },
			{ type: 'L', x: 80, y: 700 },
			{ type: 'L', x: 300, y: 700 },
			{ type: 'C', x1: 580, y1: 700, x2: 580, y2: 0, x: 300, y: 0 },
		],
	],
});
```

#### Example: Glyph with a counter (hole)

Letters like "O", "B", "D" have interior cutouts (counters). These are separate contours with opposite winding direction:

```js
font.addGlyph({
	name: 'O',
	unicode: 79,
	advanceWidth: 700,
	contours: [
		// Outer contour (clockwise)
		[
			{ type: 'M', x: 50, y: 350 },
			{ type: 'C', x1: 50, y1: 700, x2: 650, y2: 700, x: 650, y: 350 },
			{ type: 'C', x1: 650, y1: 0, x2: 50, y2: 0, x: 50, y: 350 },
		],
		// Inner contour (counter-clockwise)
		[
			{ type: 'M', x: 150, y: 350 },
			{ type: 'C', x1: 150, y1: 100, x2: 550, y2: 100, x: 550, y: 350 },
			{ type: 'C', x1: 550, y1: 600, x2: 150, y2: 600, x: 150, y: 350 },
		],
	],
});
```

#### Charstring auto-compilation

When you provide CFF contours, Font Flux automatically compiles them into the Type 2 charstring byte array needed for OTF export. You don't need to understand or produce charstring bytecode.

#### When to use CFF contours

- You're building an OTF and want direct control over the cubic Bézier data.
- Your source data is already in a cubic path format.
- You want to round-trip edit CFF outlines from an imported OTF.

### 3. TrueType contours (quadratic Bézier)

TrueType contours use the same point-based format that `FontFlux.open()` produces for TTF files. Each contour is an array of points with `x`, `y`, and `onCurve` properties.

#### Point types

| `onCurve` | Meaning                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| `true`    | **On-curve point** — a line endpoint or curve anchor. Two consecutive on-curve points form a straight line segment. |
| `false`   | **Off-curve point** — a quadratic Bézier control point. Must appear between on-curve points.                        |

**Implied on-curve points**: When two off-curve points appear consecutively, there's an implied on-curve point at their midpoint. This is a standard TrueType optimization that reduces point count.

#### Example: Rectangle (all straight lines)

```js
font.addGlyph({
	name: 'square',
	unicode: 0x25a0,
	advanceWidth: 800,
	contours: [
		[
			{ x: 100, y: 0, onCurve: true },
			{ x: 100, y: 700, onCurve: true },
			{ x: 700, y: 700, onCurve: true },
			{ x: 700, y: 0, onCurve: true },
		],
	],
});
```

#### Example: Circle (quadratic curves)

```js
font.addGlyph({
	name: 'circle',
	unicode: 0x25cb,
	advanceWidth: 800,
	format: 'truetype',
	contours: [
		[
			{ x: 400, y: 700, onCurve: true },
			{ x: 700, y: 700, onCurve: false },
			{ x: 700, y: 0, onCurve: false },
			{ x: 400, y: 0, onCurve: true },
			{ x: 100, y: 0, onCurve: false },
			{ x: 100, y: 700, onCurve: false },
		],
	],
});
```

In the circle example, consecutive off-curve points (like `{700,700}` → `{700,0}`) have an implied on-curve midpoint at `{700,350}`.

#### When to use TrueType contours

- You're building a TTF.
- Your source data is already in quadratic Bézier format.
- You need hinting control (TrueType instructions reference points by index within these contours).

### 4. Raw charstring bytes (`charString`)

For advanced use: you can provide raw Type 2 charstring bytecode directly. This is the actual binary data stored in the CFF table.

```js
font.addGlyph({
	name: 'A',
	unicode: 65,
	advanceWidth: 600,
	charString: [139, 234, 117, 21, 182, 1, 5, 14],
});
```

Most users will never need this. It's primarily useful for:

- Lossless round-tripping of imported OTF glyphs that you don't want to re-encode.
- Testing or debugging charstring behavior.
- Preserving hinting data in the charstring that would be lost during contour conversion.

If `charString` is provided, it takes priority over `path` and `contours`.

You can also use `FontFlux.assembleCharString()` to convert human-readable charstring text into bytes:

```js
import { FontFlux } from 'font-flux-js';

const bytes = FontFlux.assembleCharString(
	'100 700 rmoveto 300 0 rlineto 0 -700 rlineto endchar',
);
```

And `FontFlux.disassembleCharString()` to convert bytes back to text:

```js
const text = FontFlux.disassembleCharString(bytes);
// "100 700 rmoveto\n300 0 rlineto\n0 -700 rlineto\nendchar"
```

### 5. Composite glyphs (`components`)

Composite glyphs reference other glyphs instead of having their own outlines. This is common for accented characters (é = e + combining acute accent).

```js
font.addGlyph({
	name: 'eacute',
	unicode: 233,
	advanceWidth: 550,
	components: [
		{ glyphIndex: 72, dx: 0, dy: 0 },
		{ glyphIndex: 180, dx: 100, dy: 0 },
	],
});
```

Component properties:

| Field          | Type                 | Description                                                          |
| -------------- | -------------------- | -------------------------------------------------------------------- |
| `glyphIndex`   | `number`             | Index into the `glyphs` array for the referenced glyph.              |
| `dx`           | `number`             | Horizontal translation offset.                                       |
| `dy`           | `number`             | Vertical translation offset.                                         |
| `scale`        | `number`             | Uniform scale factor (optional).                                     |
| `scaleXY`      | `{ x, y }`           | Non-uniform scale (optional).                                        |
| `transform`    | `{ xx, xy, yx, yy }` | Full 2×2 transformation matrix (optional).                           |
| `useMyMetrics` | `boolean`            | If `true`, use this composite's metrics instead of the base glyph's. |

## Common glyph patterns

### The `.notdef` glyph

Every font must have a `.notdef` glyph as the first entry in the glyphs array. This is the "missing glyph" shown when a character isn't found. It typically looks like an empty rectangle.

Note: `FontFlux.create()` generates `.notdef` and `space` glyphs automatically, but you can also add custom ones:

```js
font.addGlyph({
	name: '.notdef',
	advanceWidth: 500,
	path: 'M 50 0 L 50 700 L 450 700 L 450 0 Z M 100 50 L 400 50 L 400 650 L 100 650 Z',
});
```

No `unicode` — `.notdef` is never mapped to a character.

### The space glyph

A space character has a width but no outline:

```js
font.addGlyph({
	name: 'space',
	unicode: 32,
	advanceWidth: 250,
});
```

### Minimal complete font

Here's a minimal font with `.notdef`, a space, and one letter:

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.create({
	family: 'My Font',
	unitsPerEm: 1000,
	ascender: 800,
	descender: -200,
});

// .notdef and space are created automatically by FontFlux.create()

font.addGlyph({
	name: 'A',
	unicode: 65,
	advanceWidth: 600,
	path: 'M 0 0 L 250 700 L 300 700 L 550 0 Z M 125 250 L 425 250 L 425 300 L 125 300 Z',
});

const buffer = font.export();
```

## Coordinate system

Font coordinates use the standard OpenType coordinate system:

- **Origin**: bottom-left of the glyph at `(0, 0)`
- **X-axis**: increases to the right
- **Y-axis**: increases upward
- **Units**: font design units (typically 1000 per em for CFF, 1000 or 2048 for TrueType)

The baseline sits at `y = 0`. Characters like "A" have outlines from `y = 0` up to the cap height. Descenders (like "g" or "p") extend below the baseline into negative y values.

**Important**: SVG uses a y-down coordinate system, but SVG path strings provided to `.addGlyph()` or `FontFlux.svgToContours()` are used directly — Font Flux does **not** flip the y-axis. If you're copying path data from an SVG file rendered in a browser, you may need to flip the y coordinates (`y = ascender - svgY`).

## Choosing an outline format

| Scenario                             | Recommended format                            |
| ------------------------------------ | --------------------------------------------- |
| Exporting paths from a design tool   | SVG path (`path`)                             |
| Hand-authoring simple shapes         | SVG path (`path`)                             |
| Building an OTF with precise curves  | CFF contours (`contours` with `type`)         |
| Building a TTF with hinting          | TrueType contours (`contours` with `onCurve`) |
| Preserving imported OTF data exactly | Raw charstring (`charString`)                 |
| Programmatic glyph generation        | SVG path (`path`) or CFF contours             |
| Accented / composed characters       | Composite (`components`)                      |

## Validation

Run `.validate()` on your font to catch structural issues before export:

```js
const report = font.validate();
if (report.valid) {
	const buffer = font.export();
}
```

See the [Validation guide](./validation.md) for details on what's checked and auto-fixed.
