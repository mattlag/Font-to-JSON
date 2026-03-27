# `STAT` table

Describes design attributes (axis values and names) for presenting variable and non-variable font families.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `STAT`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/stat
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "STAT": {
      "majorVersion": 0,
      "minorVersion": 0,
      "designAxes": null,
      "axisValues": null,
      "designAxisSize": 0,
      "elidedFallbackNameID": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)
- `designAxes` - implementation-defined
- `axisValues` - implementation-defined
- `designAxisSize` - number (0..65535)
- `elidedFallbackNameID` - implementation-defined




## Validation Constraints

- `majorVersion` is typically `1`; `minorVersion` commonly 0, 1, or 2.
- `designAxisSize` must be large enough for axis records (base size 8 plus any `_extra` bytes).
- Axis value records must use supported formats 1, 2, 3, or 4; unknown formats should be preserved via `_raw` bytes.
- `minorVersion >= 1` supports `elidedFallbackNameID`.

## Authoring Example

```json
{
	"tables": {
		"STAT": {
			"majorVersion": 1,
			"minorVersion": 2,
			"designAxisSize": 8,
			"designAxes": [
				{ "axisTag": "wght", "axisNameID": 256, "axisOrdering": 0 }
			],
			"axisValues": [
				{ "format": 1, "axisIndex": 0, "flags": 0, "valueNameID": 257, "value": 400 }
			],
			"elidedFallbackNameID": 2,
			"_checksum": 0
		}
	}
}
```



## Additional Nested Keys Seen In Implementation

- `axisTag`
- `axisNameID`
- `axisOrdering`
- `axisIndex`
- `flags`
- `valueNameID`
- `value`
- `nominalValue`
- `rangeMinValue`
- `rangeMaxValue`
- `linkedValue`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
