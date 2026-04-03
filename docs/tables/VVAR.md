# `VVAR` table

Provides variation deltas for vertical metrics (advance heights and side bearings) in variable fonts.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `VVAR`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/vvar
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "VVAR": {
      "majorVersion": 0,
      "minorVersion": 0,
      "itemVariationStore": null,
      "advanceHeightMapping": null,
      "tsbMapping": null,
      "bsbMapping": null,
      "vOrgMapping": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)
- `itemVariationStore` - implementation-defined
- `advanceHeightMapping` - implementation-defined
- `tsbMapping` - implementation-defined
- `bsbMapping` - implementation-defined
- `vOrgMapping` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `itemVariationStore`
- `advanceHeightMapping`
- `tsbMapping`
- `bsbMapping`
- `vOrgMapping`
- `outerIndex`
- `innerIndex`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
