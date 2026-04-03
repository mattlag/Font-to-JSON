# `BASE` table

Defines baseline positions for scripts and languages used in horizontal and vertical text layout.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `BASE`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/base
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "BASE": {
      "majorVersion": 0,
      "minorVersion": 0,
      "horizAxis": null,
      "vertAxis": null,
      "itemVariationStore": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)
- `horizAxis` - implementation-defined
- `vertAxis` - implementation-defined
- `itemVariationStore` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `horizAxis`
- `vertAxis`
- `itemVariationStore`
- `tag`
- `baseValues`
- `defaultMinMax`
- `langSystems`
- `minMax`
- `baseCoords`
- `minOff`
- `maxOff`
- `minCoord`
- `maxCoord`
- `featMinMax`
- `referenceGlyph`
- `baseCoordPoint`
- `device`
- `min`
- `max`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
