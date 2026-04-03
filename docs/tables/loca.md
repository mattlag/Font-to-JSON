# `loca` table

Maps glyph indices to byte offsets within the glyf table for TrueType fonts.

## Scope

- Format family: TTF-specific
- Table tag in JSON: `loca`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/loca
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "loca": {
      "offsets": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `offsets` - implementation-defined [spec type: `Offset16`] (actual offset ÷ 2)





## Additional Nested Keys Seen In Implementation

- None inferred from source.

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
