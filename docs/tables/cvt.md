# `cvt ` table

Stores TrueType control values used by glyph hinting instructions to ensure consistent rendering.

## Scope

- Format family: TTF-specific
- Table tag in JSON: `cvt `

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/cvt
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "cvt ": {
      "values": [],
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `values` - array





## Additional Nested Keys Seen In Implementation

- None inferred from source.

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
