# `cmap` table

Maps character codes (Unicode codepoints) to glyph indices.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `cmap`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/cmap
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "cmap": {
      "version": 0,
      "encodingRecords": null,
      "subtables": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number (0..65535) [spec type: `uint16`] (must be 0)
- `encodingRecords` - implementation-defined
- `subtables` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `platformID`
- `encodingID`
- `subtableIndex`
- `firstCode`
- `entryCount`
- `idDelta`
- `idRangeOffset`
- `endCode`
- `startCode`
- `startCharCode`
- `endCharCode`
- `startGlyphID`
- `glyphID`
- `startUnicodeValue`
- `additionalCount`
- `unicodeValue`
- `defaultUVSBytes`
- `nonDefaultUVSBytes`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
