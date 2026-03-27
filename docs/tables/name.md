# `name` table

Contains human-readable strings — font name, designer, license, description, and other identifiers.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `name`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/name
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "name": {
      "version": 0,
      "names": null,
      "langTagRecords": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number (0..65535) [spec type: `uint16`] (0)
- `names` - implementation-defined
- `langTagRecords` - implementation-defined




## Validation Constraints

- `version` supports 0 or 1 in this implementation.
- Each entry in `names[]` should include `platformID`, `encodingID`, `languageID`, `nameID`, and `value`.
- For `version = 1`, optional `langTagRecords[]` entries provide BCP 47 tags.
- String encoding is platform-sensitive; unsupported data can be preserved with `"0x:..."` value form.

## Authoring Example

```json
{
	"tables": {
		"name": {
			"version": 0,
			"names": [
				{ "platformID": 3, "encodingID": 1, "languageID": 1033, "nameID": 1, "value": "Example Family" },
				{ "platformID": 3, "encodingID": 1, "languageID": 1033, "nameID": 2, "value": "Regular" }
			],
			"_checksum": 0
		}
	}
}
```



## Additional Nested Keys Seen In Implementation

- `platformID`
- `encodingID`
- `languageID`
- `nameID`
- `length`
- `stringOffset`
- `tag`
- `value`
- `langTagRecords`
- `bytes`
- `stringLength`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
