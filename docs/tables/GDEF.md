# `GDEF` table

Classifies glyphs (base, ligature, mark, component) and provides attachment and ligature caret data for layout.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `GDEF`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/gdef
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "GDEF": {
      "majorVersion": 0,
      "minorVersion": 0,
      "glyphClassDef": null,
      "attachList": null,
      "ligCaretList": null,
      "markAttachClassDef": null,
      "markGlyphSetsDef": null,
      "itemVarStoreRaw": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)
- `glyphClassDef` - implementation-defined
- `attachList` - implementation-defined
- `ligCaretList` - implementation-defined
- `markAttachClassDef` - implementation-defined
- `markGlyphSetsDef` - implementation-defined
- `itemVarStoreRaw` - implementation-defined


## Nested JSON Structure

Common parsed shape (optional blocks appear only when present in source data):

```json
{
	"majorVersion": 1,
	"minorVersion": 3,
	"glyphClassDef": { "format": 1, "startGlyphID": 0, "classValueArray": [1, 2] },
	"attachList": {
		"coverage": { "format": 1, "glyphArray": [10, 11] },
		"attachPoints": [[12, 45], [20]]
	},
	"ligCaretList": {
		"coverage": { "format": 1, "glyphArray": [50] },
		"ligGlyphs": [[
			{ "format": 1, "coordinate": 320 },
			{ "format": 2, "caretValuePointIndex": 7 },
			{ "format": 3, "coordinate": 400, "device": { "format": 1, "deltaFormat": 2, "deltaValues": [0] } }
		]]
	},
	"markAttachClassDef": { "format": 2, "classRangeRecords": [{ "start": 100, "end": 120, "class": 1 }] },
	"markGlyphSetsDef": {
		"format": 1,
		"coverages": [
			{ "format": 1, "glyphArray": [200, 201] }
		]
	},
	"itemVarStoreOffset": 1234,
	"itemVarStoreRaw": [0, 1, 2]
}
```

Notes:

- `itemVarStoreRaw` preserves binary bytes (not fully parsed yet).
- ClassDef/Coverage/Device object formats are shared OpenType Layout structures.




## Validation Constraints

- Requires OpenType Layout context: usually authored together with `GPOS` and/or `GSUB`.
- `minorVersion >= 2` enables `markGlyphSetsDef`.
- `minorVersion >= 3` enables `itemVarStoreOffset` / `itemVarStoreRaw`.
- For attachment/caret/glyph-set blocks, coverage sizes should align with corresponding arrays.

## Authoring Example

```json
{
	"tables": {
		"GDEF": {
			"majorVersion": 1,
			"minorVersion": 2,
			"glyphClassDef": { "format": 1, "startGlyphID": 0, "classValues": [1, 2, 3] },
			"_checksum": 0
		}
	}
}
```



## Additional Nested Keys Seen In Implementation

- `glyphClassDef`
- `attachList`
- `ligCaretList`
- `markAttachClassDef`
- `markGlyphSetsDef`
- `itemVarStoreOffset`
- `itemVarStoreRaw`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
