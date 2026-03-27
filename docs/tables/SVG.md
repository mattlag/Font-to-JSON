# `SVG ` table

Contains SVG documents that define glyph appearances as scalable vector graphics.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `SVG `

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/svg
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "SVG ": {
      "version": 0,
      "documents": null,
      "entries": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number (0..65535) [spec type: `uint16`] (Set to 0)
- `documents` - implementation-defined
- `entries` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `startGlyphID`
- `endGlyphID`
- `svgDocOffset`
- `svgDocLength`
- `documentIndex`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
