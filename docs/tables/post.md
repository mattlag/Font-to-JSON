# `post` table

Provides PostScript name mappings for glyphs and global italic angle and underline metrics.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `post`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/post
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "post": {
      "version": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number [spec type: `Version16Dot16`] (raw uint32)





## Additional Nested Keys Seen In Implementation

- `glyphNames`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
