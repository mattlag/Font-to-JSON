# `MVAR` table

Provides variation deltas for global font metrics (ascender, descender, caret offset, etc.) in variable fonts.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `MVAR`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/mvar
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "MVAR": {
      "majorVersion": 0,
      "minorVersion": 0,
      "reserved": 0,
      "valueRecords": null,
      "valueRecordSize": 0,
      "itemVariationStore": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)
- `reserved` - number (0..65535)
- `valueRecords` - implementation-defined
- `valueRecordSize` - number (0..65535)
- `itemVariationStore` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `valueTag`
- `deltaSetOuterIndex`
- `deltaSetInnerIndex`
- `_extra`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
