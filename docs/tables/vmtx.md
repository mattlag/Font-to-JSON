# `vmtx` table

Stores per-glyph vertical metrics — advance height and top side bearing for each glyph.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `vmtx`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/vmtx
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "vmtx": {
      "vMetrics": null,
      "topSideBearings": [],
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `vMetrics` - implementation-defined [spec type: `LongVerMetric`]
- `topSideBearings` - array [spec type: `FWORD`]





## Additional Nested Keys Seen In Implementation

- `advanceHeight`
- `topSideBearing`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
