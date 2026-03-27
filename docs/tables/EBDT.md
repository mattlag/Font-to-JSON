# `EBDT` table

Stores embedded bitmap glyph image data for screen-optimized rendering at specific sizes.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `EBDT`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "EBDT": {
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- No strongly inferred top-level parsed fields found (table may be raw/opaque or heavily nested).





## Additional Nested Keys Seen In Implementation

- None inferred from source.

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
