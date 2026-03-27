# `CPAL` table

Provides named color palettes used by the COLR table for multi-colored glyphs.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `CPAL`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/cpal
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "CPAL": {
      "version": 0,
      "numPaletteEntries": 0,
      "palettes": null,
      "paletteTypes": null,
      "paletteLabels": null,
      "paletteEntryLabels": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number (0..65535) [spec type: `uint16`]
- `numPaletteEntries` - number (0..65535) [spec type: `uint16`] (entries per palette)
- `palettes` - implementation-defined
- `paletteTypes` - implementation-defined
- `paletteLabels` - implementation-defined
- `paletteEntryLabels` - implementation-defined




## Validation Constraints

- `numPaletteEntries` should match the length of each palette in `palettes[]`.
- `version = 0` supports basic palette arrays only.
- `version >= 1` may include `paletteTypes`, `paletteLabels`, and `paletteEntryLabels`.
- All color channels are uint8 BGRA values (`blue`, `green`, `red`, `alpha`).

## Authoring Example

```json
{
	"tables": {
		"CPAL": {
			"version": 0,
			"numPaletteEntries": 2,
			"palettes": [
				[
					{ "blue": 0, "green": 0, "red": 0, "alpha": 255 },
					{ "blue": 255, "green": 255, "red": 255, "alpha": 255 }
				]
			],
			"_checksum": 0
		}
	}
}
```



## Additional Nested Keys Seen In Implementation

- `blue`
- `green`
- `red`
- `alpha`
- `paletteTypes`
- `paletteLabels`
- `paletteEntryLabels`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
