# `CFF2` table

Contains variable PostScript glyph outlines with blend operators for CFF2-based variable fonts.

## Scope

- Format family: OTF-specific
- Table tag in JSON: `CFF2`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/cff2
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
	"tables": {
		"CFF2": {
			"majorVersion": null,
			"minorVersion": null,
			"topDict": null,
			"globalSubrs": null,
			"charStrings": null,
			"fontDicts": null,
			"fdSelect": null,
			"variationStore": null,
			"_checksum": 0
		}
	}
}
```

## Top-level Fields

- `majorVersion` - implementation-defined
- `minorVersion` - implementation-defined
- `topDict` - implementation-defined
- `globalSubrs` - implementation-defined
- `charStrings` - implementation-defined
- `fontDicts` - implementation-defined
- `fdSelect` - implementation-defined
- `variationStore` - implementation-defined

## Nested JSON Structure

Parsed CFF2 table:

```json
{
	"majorVersion": 2,
	"minorVersion": 0,
	"topDict": { "FontMatrix": [0.001, 0, 0, 0.001, 0, 0] },
	"globalSubrs": [[0, 1]],
	"charStrings": [[139, 14]],
	"fontDicts": [
		{
			"fontDict": { "FontName": 391 },
			"privateDict": { "BlueScale": 0.039625 },
			"localSubrs": [[11]]
		}
	],
	"fdSelect": {
		"format": 3,
		"ranges": [{ "first": 0, "fd": 0 }],
		"sentinel": 500
	},
	"variationStore": [0, 20, 0, 1]
}
```

Notes:

- CFF2 has no Name INDEX, no String INDEX, and no Encoding table.
- `variationStore` is currently stored as raw bytes.
- Private DICT and local subroutines are represented per entry in `fontDicts[]`.

## Interpreting charStrings

Like CFF v1, CFF2 stores glyph outlines as Type 2 charstring byte arrays. Font Flux interprets these into cubic Bézier contour commands:

```js
import { interpretCharString } from 'font-flux';

const contours = interpretCharString(
	cff2.charStrings[glyphIndex],
	fontDict.localSubrs,
	cff2.globalSubrs,
);
// Returns: [[{ type: 'M', x, y }, { type: 'C', x1, y1, x2, y2, x, y }, ...], ...]
```

Use `disassembleCharString(bytes)` for a human-readable text representation of the charstring program.

When using `importFont`, CFF2 glyphs in the simplified `glyphs` array automatically include `contours`, `charString`, and `charStringDisassembly`.

## Converting to/from SVG paths

CFF2 contours work identically with the SVG path conversion functions:

```js
import { contoursToSVGPath, svgPathToContours } from 'font-flux';

const d = contoursToSVGPath(glyph.contours); // CFF2 cubic → SVG
const contours = svgPathToContours(d, 'cff'); // SVG → CFF cubic
```

See the [main docs](../index.md#svg-path-conversion) for full SVG path conversion details.

## Validation Constraints

- CFF2 outlines are an alternative to TrueType `glyf`/`loca`.
- `majorVersion` should be `2` for standard CFF2 data.
- Keep `charStrings` glyph count aligned with `fdSelect` ranges when `fdSelect` is present.
- `variationStore` is currently treated as raw bytes; preserve byte integrity if editing manually.

## Authoring Example

```json
{
	"tables": {
		"CFF2": {
			"majorVersion": 2,
			"minorVersion": 0,
			"topDict": {},
			"globalSubrs": [],
			"charStrings": [[14]],
			"fontDicts": [],
			"fdSelect": null,
			"variationStore": null,
			"_checksum": 0
		}
	}
}
```

## Additional Nested Keys Seen In Implementation

- `fontDict`
- `charStrings`
- `fdArray`
- `fdSelect`
- `variationStore`
- `operator`
- `operands`
- `totalSize`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
