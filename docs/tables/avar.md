# `avar` table

Maps axis coordinates to modified values, enabling non-linear interpolation for variable fonts.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `avar`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/avar
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "avar": {
      "majorVersion": 0,
      "minorVersion": 0,
      "reserved": 0,
      "segmentMaps": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)
- `reserved` - number (0..65535)
- `segmentMaps` - implementation-defined




## Validation Constraints

- `segmentMaps.length` should match axis count from `fvar`.
- Each segment map should include monotonic `axisValueMaps` pairs from normalized `fromCoordinate` to `toCoordinate` values.
- Coordinates are F2DOT14 values in normalized axis space.
- `reserved` is typically `0`.

## Authoring Example

```json
{
	"tables": {
		"avar": {
			"majorVersion": 1,
			"minorVersion": 0,
			"reserved": 0,
			"segmentMaps": [
				{
					"axisValueMaps": [
						{ "fromCoordinate": -1.0, "toCoordinate": -1.0 },
						{ "fromCoordinate": 0.0, "toCoordinate": 0.0 },
						{ "fromCoordinate": 1.0, "toCoordinate": 1.0 }
					]
				}
			],
			"_checksum": 0
		}
	}
}
```



## Additional Nested Keys Seen In Implementation

- `fromCoordinate`
- `toCoordinate`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
