# `LTSH` table

Records the pixel size at which each glyph transitions from needing hinting to rendering well without it.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `LTSH`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "LTSH": {
      "version": 0,
      "yPels": [],
      "numGlyphs": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number (0..65535)
- `yPels` - number[]
- `numGlyphs` - number (0..65535)





## Additional Nested Keys Seen In Implementation

- None inferred from source.

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
