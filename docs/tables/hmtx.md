# `hmtx` table

Stores per-glyph horizontal metrics — advance width and left side bearing for each glyph.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `hmtx`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/hmtx
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "hmtx": {
      "hMetrics": null,
      "leftSideBearings": [],
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `hMetrics` - implementation-defined [spec type: `LongHorMetric`]
- `leftSideBearings` - array [spec type: `FWORD`]





## Additional Nested Keys Seen In Implementation

- `advanceWidth`
- `lsb`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
