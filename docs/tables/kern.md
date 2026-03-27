# `kern` table

Contains legacy kerning pair adjustments for horizontal glyph positioning (superseded by GPOS).

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `kern`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "kern": {
      "formatVariant": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `formatVariant` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `version`
- `formatVariant`
- `nPairs`
- `searchRange`
- `entrySelector`
- `rangeShift`
- `pairs`
- `left`
- `right`
- `value`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
