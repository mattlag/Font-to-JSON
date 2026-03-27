# `HVAR` table

Provides variation deltas for horizontal metrics (advance widths and side bearings) in variable fonts.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `HVAR`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/hvar
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "HVAR": {
      "majorVersion": 0,
      "minorVersion": 0,
      "itemVariationStore": null,
      "advanceWidthMapping": null,
      "lsbMapping": null,
      "rsbMapping": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)
- `itemVariationStore` - implementation-defined
- `advanceWidthMapping` - implementation-defined
- `lsbMapping` - implementation-defined
- `rsbMapping` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `itemVariationStore`
- `advanceWidthMapping`
- `lsbMapping`
- `rsbMapping`
- `outerIndex`
- `innerIndex`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
