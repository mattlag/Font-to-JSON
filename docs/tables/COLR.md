# `COLR` table

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `COLR`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/colr
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "COLR": {
      "baseGlyphRecords": null,
      "layerRecords": null,
      "version": 0,
      "baseGlyphPaintRecords": null,
      "layerPaints": null,
      "clipList": null,
      "varIndexMap": null,
      "itemVariationStore": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `baseGlyphRecords` - implementation-defined
- `layerRecords` - implementation-defined
- `version` - number (0..65535) [spec type: `uint16`] (0)
- `baseGlyphPaintRecords` - implementation-defined
- `layerPaints` - implementation-defined
- `clipList` - implementation-defined
- `varIndexMap` - implementation-defined
- `itemVariationStore` - implementation-defined




## Validation Constraints

- `version = 0`: use parsed `baseGlyphRecords` and `layerRecords`.
- `version >= 1`: this implementation preserves v1 paint graph data as `_v1RawBytes` for round-trip safety.
- For v0 data, each BaseGlyphRecord's `firstLayerIndex`/`numLayers` should reference valid ranges inside `layerRecords`.
- `paletteIndex` entries in layers should be valid for the active CPAL palette entry count.

## Authoring Example

```json
{
	"tables": {
		"COLR": {
			"version": 0,
			"baseGlyphRecords": [
				{ "glyphID": 100, "firstLayerIndex": 0, "numLayers": 2 }
			],
			"layerRecords": [
				{ "glyphID": 101, "paletteIndex": 0 },
				{ "glyphID": 102, "paletteIndex": 1 }
			],
			"_checksum": 0
		}
	}
}
```



## Additional Nested Keys Seen In Implementation

- `glyphID`
- `firstLayerIndex`
- `numLayers`
- `paletteIndex`
- `baseGlyphPaintRecords`
- `layerPaints`
- `clipList`
- `varIndexMap`
- `itemVariationStore`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
