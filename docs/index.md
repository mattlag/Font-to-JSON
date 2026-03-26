# Font Flux JS Documentation

This site is for humans writing or editing font JSON by hand.

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

| Function                             | Description                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `importFont(buffer)`                 | Parse an `ArrayBuffer` into a simplified font object.                       |
| `exportFont(fontData)`               | Convert a font object back to binary. Returns an `ArrayBuffer`.             |
| `validateJSON(fontData)`             | Check a font object for structural issues. Returns `{ valid, issues[] }`.   |
| `buildSimplified(raw)`               | Convert raw `{ header, tables }` into the simplified structure.             |
| `buildRawFromSimplified(simplified)` | Convert simplified back to `{ header, tables }`.                            |
| `importFontTables(buffer)`           | Low-level import returning raw `{ header, tables }` without simplification. |

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

## Workflow recommendation

1. Start from `importFont` output when possible.
2. Edit the simplified fields (`font`, `glyphs`, `kerning`) for common changes.
3. Edit `tables` directly for low-level or table-specific changes.
4. Run `validateJSON` to check for structural issues.
5. Only call `exportFont` when `report.valid === true`.
