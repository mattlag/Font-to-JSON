# `meta` table

Stores font-level metadata as tagged key-value pairs (e.g. design languages, supported scripts).

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `meta`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "meta": {
      "version": 0,
      "flags": 0,
      "reserved": 0,
      "dataMaps": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number
- `flags` - number
- `reserved` - number
- `dataMaps` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `tag`
- `data`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
