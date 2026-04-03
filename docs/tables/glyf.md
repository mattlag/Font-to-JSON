# `glyf` table

Stores TrueType glyph outlines as quadratic Bézier contours and composite glyph references.

## Scope

- Format family: TTF-specific
- Table tag in JSON: `glyf`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/glyf
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
	"tables": {
		"glyf": {
			"glyphs": null,
			"_checksum": 0
		}
	}
}
```

## Top-level Fields

- `glyphs` - implementation-defined

## TrueType contour format

Each simple glyph contains an array of contours. Each contour is an array of points:

```json
[
	{ "x": 200, "y": 0, "onCurve": true },
	{ "x": 450, "y": 700, "onCurve": false },
	{ "x": 700, "y": 0, "onCurve": true }
]
```

- `onCurve: true` — on-curve point (line endpoint or curve anchor).
- `onCurve: false` — quadratic Bézier off-curve control point.
- Two consecutive off-curve points have an **implied on-curve midpoint** between them.

### How curves work

TrueType uses **quadratic Bézier** curves. A curve segment goes from one on-curve point through an off-curve control point to the next on-curve point. When multiple off-curve points appear consecutively, the implied midpoint between each pair acts as an on-curve anchor.

Example with implied midpoint:

```json
[
	{ "x": 0, "y": 0, "onCurve": true },
	{ "x": 50, "y": 100, "onCurve": false },
	{ "x": 100, "y": 100, "onCurve": false },
	{ "x": 150, "y": 0, "onCurve": true }
]
```

This produces two quadratic segments: (0,0)→(50,100)→(**75,100**) and (**75,100**)→(100,100)→(150,0), where **(75,100)** is the implied midpoint.

### Converting to/from SVG paths

Use `FontFlux.contoursToSVG()` and `FontFlux.svgToContours()` to convert between TrueType contours and SVG path `d` strings:

```js
import { FontFlux } from 'font-flux-js';

// TrueType contours → SVG (produces Q commands for quadratic curves)
const d = FontFlux.contoursToSVG(glyph.contours);
// "M0 0 Q50 100 75 100 Q100 100 150 0 Z"

// SVG → TrueType contours
const contours = FontFlux.svgToContours(d, 'truetype');
// [[ { x: 0, y: 0, onCurve: true }, { x: 50, y: 100, onCurve: false }, ... ]]
```

SVG quadratic (`Q`) commands map directly to TrueType off-curve + on-curve point pairs. SVG cubic (`C`) commands are approximated as quadratic curves via subdivision (0.5-unit error threshold).

See the [main docs](../index.md#svg-path-conversion) for full SVG path conversion details.

## Additional Nested Keys Seen In Implementation

- `x`
- `y`
- `onCurve`
- `type`
- `flags`
- `xScale`
- `yScale`
- `scale01`
- `scale10`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
