# `kern` table

Contains legacy kerning pair adjustments for horizontal glyph positioning. For most modern fonts, kerning is handled via the [GPOS](./GPOS.md) table instead. Font Flux supports reading and writing all kern formats and can convert between them — see [Creating Kerning](../creating-kerning.md).

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `kern`

## Specs

- OpenType kern: https://learn.microsoft.com/en-us/typography/opentype/spec/kern
- Apple kern: https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6kern.html

## Supported formats

Font Flux fully parses and writes all common kern subtable formats:

| Variant  | Format | Description                      | Notes                           |
| -------- | ------ | -------------------------------- | ------------------------------- |
| OpenType | 0      | Ordered pair list                | Most common legacy format       |
| OpenType | 2      | Class-based n×m array            | Compact for many pairs          |
| Apple    | 0      | Ordered pair list                | Same structure as OT format 0   |
| Apple    | 1      | State table (contextual kerning) | Best-effort extraction to pairs |
| Apple    | 2      | Class-based n×m array            | Same structure as OT format 2   |
| Apple    | 3      | Compact class-based (uint8)      | Compact; max 256 classes        |

Unknown subtable formats are preserved as `_raw` bytes for lossless round-tripping.

## JSON Skeleton

### OpenType variant

```json
{
	"tables": {
		"kern": {
			"formatVariant": "opentype",
			"version": 0,
			"subtables": [
				{
					"version": 0,
					"format": 0,
					"coverage": 1,
					"nPairs": 2,
					"searchRange": 6,
					"entrySelector": 1,
					"rangeShift": 6,
					"pairs": [
						{ "left": 1, "right": 3, "value": -80 },
						{ "left": 2, "right": 4, "value": -50 }
					]
				}
			]
		}
	}
}
```

### Apple variant

```json
{
	"tables": {
		"kern": {
			"formatVariant": "apple",
			"version": 65536,
			"subtables": [
				{
					"coverage": 0,
					"format": 3,
					"tupleIndex": 0,
					"glyphCount": 5,
					"kernValueCount": 2,
					"leftClassCount": 2,
					"rightClassCount": 2,
					"flags": 0,
					"kernValues": [0, -50],
					"leftClasses": [0, 1, 0, 0, 0],
					"rightClasses": [0, 0, 1, 0, 0],
					"kernIndices": [0, 0, 0, 1]
				}
			]
		}
	}
}
```

## Top-level Fields

- `formatVariant` — `"opentype"` or `"apple"`, determined by table version
- `version` — `0` for OpenType, `0x00010000` (65536) for Apple
- `subtables` — Array of subtable objects; each has a `format` field

## Simplified kerning

In the simplified representation, all kern formats are extracted into the top-level `kerning[]` array using glyph names. You don't normally need to work with the raw kern table directly.

```js
fontData.kerning = [
	{ left: 'A', right: 'V', value: -80 },
	{ left: 'T', right: 'o', value: -40 },
];
```

See [Creating Kerning](../creating-kerning.md) for the full guide on authoring and format conversion.

## Notes

- Preserve `_checksum` for stable round-tripping.
- Unknown subtable formats are preserved as `_raw` bytes.
- When both kern and GPOS contain kerning, the simplified representation merges both — GPOS values win on conflicts.
- Validate with `validateJSON` after edits.
