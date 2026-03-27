# `CBLC` table

Indexes the location and format of color bitmap glyphs within the CBDT table.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `CBLC`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "CBLC": {
      "firstGlyphIndex": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `firstGlyphIndex` - number (0..65535)





## Additional Nested Keys Seen In Implementation

- `indexSubTables`
- `firstGlyphIndex`
- `lastGlyphIndex`
- `indexSubtableOffset`
- `glyphID`
- `sbitOffset`
- `ascender`
- `descender`
- `widthMax`
- `caretSlopeNumerator`
- `caretSlopeDenominator`
- `caretOffset`
- `minOriginSB`
- `minAdvanceSB`
- `maxBeforeBL`
- `minAfterBL`
- `pad1`
- `pad2`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
