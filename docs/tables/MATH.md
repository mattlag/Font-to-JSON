# `MATH` table

Provides metrics, glyph variants, and assembly rules for mathematical typesetting layout.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `MATH`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "MATH": {
      "version": 0,
      "mathConstants": null,
      "mathGlyphInfo": null,
      "mathVariants": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number
- `mathConstants` - implementation-defined
- `mathGlyphInfo` - implementation-defined
- `mathVariants` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `mathConstants`
- `mathGlyphInfo`
- `mathVariants`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
