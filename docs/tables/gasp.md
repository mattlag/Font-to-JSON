# `gasp` table

Controls grid-fitting (hinting) and anti-aliasing behavior at different pixel sizes.

## Scope

- Format family: TTF-specific
- Table tag in JSON: `gasp`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/gasp
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "gasp": {
      "version": 0,
      "gaspRanges": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number (0..65535)
- `gaspRanges` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `rangeMaxPPEM`
- `rangeGaspBehavior`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
