# `CBDT` table

Stores color bitmap glyph image data, commonly used for color emoji.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `CBDT`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "CBDT": {
      "version": 0,
      "data": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number
- `data` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `glyphID`
- `xOffset`
- `yOffset`
- `sbitOffset`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
