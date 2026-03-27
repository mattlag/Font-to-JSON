# `gvar` table

Stores per-glyph variation deltas for interpolating TrueType outlines across the design space.

## Scope

- Format family: TTF-specific
- Table tag in JSON: `gvar`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/gvar
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "gvar": {
      "majorVersion": 0,
      "minorVersion": 0,
      "axisCount": 0,
      "glyphVariationData": null,
      "sharedTuples": null,
      "flags": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)
- `axisCount` - number (0..65535)
- `glyphVariationData` - implementation-defined
- `sharedTuples` - implementation-defined
- `flags` - number (0..65535)


## Nested JSON Structure

Parsed gvar container shape:

```json
{
	"majorVersion": 1,
	"minorVersion": 0,
	"axisCount": 2,
	"flags": 0,
	"sharedTuples": [
		[1.0, 0.0],
		[0.5, -0.25]
	],
	"glyphVariationData": [
		[0, 16, 32],
		[]
	]
}
```

Notes:

- This implementation parses/writes gvar container metadata and stores per-glyph variation tuple data as raw bytes.
- `glyphVariationData` length defines glyph count for write.
- Short vs long internal offsets are selected automatically on write based on payload size/alignment.




## Validation Constraints

- `gvar` is meaningful with variable-font axis definitions from `fvar` (validator warns when missing).
- `axisCount` should match the number of variation axes.
- `glyphVariationData.length` defines glyph count for writing offsets.
- Per-glyph tuple payloads are raw bytes in this implementation; preserve exact bytes when editing.

## Authoring Example

```json
{
	"tables": {
		"gvar": {
			"majorVersion": 1,
			"minorVersion": 0,
			"axisCount": 2,
			"flags": 0,
			"sharedTuples": [[1.0, 0.0]],
			"glyphVariationData": [[], []],
			"_checksum": 0
		}
	}
}
```



## Additional Nested Keys Seen In Implementation

- None inferred from source.

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
