# `maxp` table

Declares maximum resource limits — glyph count, point/contour maximums, and stack depths.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `maxp`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/maxp
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "maxp": {
      "version": 0,
      "numGlyphs": 0,
      "maxPoints": 0,
      "maxContours": 0,
      "maxCompositePoints": 0,
      "maxCompositeContours": 0,
      "maxZones": 0,
      "maxTwilightPoints": 0,
      "maxStorage": 0,
      "maxFunctionDefs": 0,
      "maxInstructionDefs": 0,
      "maxStackElements": 0,
      "maxSizeOfInstructions": 0,
      "maxComponentElements": 0,
      "maxComponentDepth": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number [spec type: `Version16Dot16`] (0x00005000)
- `numGlyphs` - number (0..65535) [spec type: `uint16`]
- `maxPoints` - number (0..65535) [spec type: `uint16`]
- `maxContours` - number (0..65535) [spec type: `uint16`]
- `maxCompositePoints` - number (0..65535) [spec type: `uint16`]
- `maxCompositeContours` - number (0..65535) [spec type: `uint16`]
- `maxZones` - number (0..65535) [spec type: `uint16`]
- `maxTwilightPoints` - number (0..65535) [spec type: `uint16`]
- `maxStorage` - number (0..65535) [spec type: `uint16`]
- `maxFunctionDefs` - number (0..65535) [spec type: `uint16`]
- `maxInstructionDefs` - number (0..65535) [spec type: `uint16`]
- `maxStackElements` - number (0..65535) [spec type: `uint16`]
- `maxSizeOfInstructions` - number (0..65535) [spec type: `uint16`]
- `maxComponentElements` - number (0..65535) [spec type: `uint16`]
- `maxComponentDepth` - number (0..65535) [spec type: `uint16`]





## Additional Nested Keys Seen In Implementation

- `maxPoints`
- `maxContours`
- `maxCompositePoints`
- `maxCompositeContours`
- `maxZones`
- `maxTwilightPoints`
- `maxStorage`
- `maxFunctionDefs`
- `maxInstructionDefs`
- `maxStackElements`
- `maxSizeOfInstructions`
- `maxComponentElements`
- `maxComponentDepth`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
