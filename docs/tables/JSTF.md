# `JSTF` table

Defines justification rules — glyph and language-level adjustments for justified text layout.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `JSTF`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "JSTF": {
      "majorVersion": 0,
      "minorVersion": 0,
      "scripts": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)
- `scripts` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `tag`
- `offset`
- `table`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
