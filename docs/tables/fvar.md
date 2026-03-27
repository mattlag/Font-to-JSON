# `fvar` table

Defines the variation axes (e.g. weight, width) and their ranges for a variable font.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `fvar`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/fvar
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "fvar": {
      "majorVersion": 0,
      "minorVersion": 0,
      "reserved": 0,
      "axes": null,
      "instances": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535) [spec type: `uint16`]
- `minorVersion` - number (0..65535) [spec type: `uint16`]
- `reserved` - number (0..65535)
- `axes` - implementation-defined
- `instances` - implementation-defined




## Validation Constraints

- `axisSize` is 20 for the current format; each axis needs `axisTag`, min/default/max values, and name/flags metadata.
- Instance coordinate count should match the number of axes.
- `instanceSize` grows by 2 bytes when any instance uses `postScriptNameID`.
- `reserved` is typically `2`.

## Authoring Example

```json
{
	"tables": {
		"fvar": {
			"majorVersion": 1,
			"minorVersion": 0,
			"reserved": 2,
			"axes": [
				{ "axisTag": "wght", "minValue": 100, "defaultValue": 400, "maxValue": 900, "flags": 0, "axisNameID": 256 }
			],
			"instances": [
				{ "subfamilyNameID": 257, "flags": 0, "coordinates": [400], "postScriptNameID": 258 }
			],
			"_checksum": 0
		}
	}
}
```



## Additional Nested Keys Seen In Implementation

- `axisTag`
- `minValue`
- `defaultValue`
- `maxValue`
- `flags`
- `axisNameID`
- `subfamilyNameID`
- `coordinates`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
