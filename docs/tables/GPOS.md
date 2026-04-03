# `GPOS` table

Defines glyph positioning rules — kerning, mark placement, cursive attachment, and other adjustments.

GPOS PairPos (lookupType 2) is the modern standard for kerning. Font Flux extracts PairPos kerning into the simplified `kerning[]` array and can build GPOS PairPos from kerning data on export. See [Creating Kerning](../creating-kerning.md) for the full authoring guide.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `GPOS`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/gpos
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
	"tables": {
		"GPOS": {
			"majorVersion": 0,
			"minorVersion": 0,
			"_checksum": 0
		}
	}
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)

## Nested JSON Structure

Top-level layout (shared OpenType Layout container):

```json
{
	"majorVersion": 1,
	"minorVersion": 1,
	"scriptList": { "scriptRecords": [] },
	"featureList": { "featureRecords": [] },
	"lookupList": {
		"lookups": [
			{
				"lookupType": 1,
				"lookupFlag": 0,
				"subtables": [
					{
						"format": 1,
						"coverage": { "format": 1, "glyphArray": [10, 11] },
						"valueFormat": 5,
						"valueRecord": { "xPlacement": 20, "xAdvance": 30 }
					}
				]
			}
		]
	},
	"featureVariations": { "featureVariationRecords": [] }
}
```

Lookup subtable families by `lookupType`:

- `1` SinglePos: `valueFormat` + `valueRecord` or `valueRecords[]`.
- `2` PairPos: either `pairSets[]` (format 1) or class-based `class1Records` (format 2).
- `3` CursivePos: `entryExitRecords[]` with `entryAnchor`/`exitAnchor`.
- `4` MarkBasePos: `markArray` + `baseArray`.
- `5` MarkLigPos: `markArray` + `ligatureArray`.
- `6` MarkMarkPos: `mark1Array` + `mark2Array`.
- `7` ContextPos and `8` ChainedContextPos: shared Sequence/ChainedSequence context structures.
- `9` ExtensionPos: wraps another positioning subtable in `subtable` with `extensionLookupType`.

## Validation Constraints

- `majorVersion` is typically `1`.
- `minorVersion >= 1` may include `featureVariations`.
- Each lookup's `lookupType` must match the subtable shapes it contains.
- ValueRecord fields must match `valueFormat` bits (for Single/Pair positioning subtables).
- Practical dependency: keep `GDEF` present when using mark attachment lookups (types 4, 5, 6).

## Authoring Example

```json
{
	"tables": {
		"GPOS": {
			"majorVersion": 1,
			"minorVersion": 0,
			"scriptList": { "scriptRecords": [] },
			"featureList": { "featureRecords": [] },
			"lookupList": { "lookups": [] },
			"_checksum": 0
		}
	}
}
```

## Additional Nested Keys Seen In Implementation

- `markClass`
- `markAnchor`
- `scriptList`
- `featureList`
- `lookupList`
- `featureVariations`
- `entryAnchor`
- `exitAnchor`
- `subtables`
- `coverage`
- `format`
- `glyphs`
- `pairSets`
- `entry`
- `exit`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
