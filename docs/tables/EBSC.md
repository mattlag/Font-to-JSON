# `EBSC` table

Defines scaling rules that map bitmap strikes to other sizes when exact-size bitmaps are unavailable.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `EBSC`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "EBSC": {
      "version": 0,
      "scales": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number
- `scales` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `hori`
- `vert`
- `substitutePpemX`
- `substitutePpemY`
- `originalPpemX`
- `originalPpemY`
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
