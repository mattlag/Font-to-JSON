# `GSUB` table

Defines glyph substitution rules — ligatures, alternates, contextual forms, and other replacements.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `GSUB`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/gsub
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "GSUB": {
      "majorVersion": 0,
      "minorVersion": 0,
      "scriptList": null,
      "featureList": null,
      "lookupList": null,
      "featureVariations": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)
- `scriptList` - implementation-defined
- `featureList` - implementation-defined
- `lookupList` - implementation-defined
- `featureVariations` - implementation-defined


## Nested JSON Structure

Top-level layout matches OpenType Layout GSUB container:

```json
{
	"majorVersion": 1,
	"minorVersion": 1,
	"scriptList": { "scriptRecords": [] },
	"featureList": { "featureRecords": [] },
	"lookupList": {
		"lookups": [
			{
				"lookupType": 4,
				"lookupFlag": 0,
				"subtables": [
					{
						"format": 1,
						"coverage": { "format": 1, "glyphArray": [30] },
						"ligatureSets": [
							[
								{ "ligatureGlyph": 400, "componentCount": 3, "componentGlyphIDs": [31, 32] }
							]
						]
					}
				]
			}
		]
	},
	"featureVariations": { "featureVariationRecords": [] }
}
```

Lookup subtable families by `lookupType`:

- `1` SingleSubst: `deltaGlyphID` (format 1) or `substituteGlyphIDs[]` (format 2).
- `2` MultipleSubst: `sequences[][]`.
- `3` AlternateSubst: `alternateSets[][]`.
- `4` LigatureSubst: `ligatureSets[][]` with `ligatureGlyph` and component list.
- `5` ContextSubst and `6` ChainedContextSubst: shared Sequence/ChainedSequence context structures.
- `7` ExtensionSubst: wraps another substitution subtable in `subtable` with `extensionLookupType`.
- `8` ReverseChainSingleSubst: `backtrackCoverages[]`, `lookaheadCoverages[]`, `substituteGlyphIDs[]`.




## Validation Constraints

- `majorVersion` is typically `1`.
- `minorVersion >= 1` may include `featureVariations`.
- Each lookup's `lookupType` must match the subtable shapes it contains.
- Coverage arrays should align with replacement/substitution arrays by index.
- Extension lookups (type 7) must point to a valid wrapped subtable type.

## Authoring Example

```json
{
	"tables": {
		"GSUB": {
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

- `scriptList`
- `featureList`
- `lookupList`
- `featureVariations`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
