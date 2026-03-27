# `VORG` table

Defines vertical origin positions for CFF/CFF2 glyphs used in vertical text layout.

## Scope

- Format family: OTF-specific
- Table tag in JSON: `VORG`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/vorg
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "VORG": {
      "majorVersion": 0,
      "minorVersion": 0,
      "defaultVertOriginY": 0,
      "vertOriginYMetrics": null,
      "numVertOriginYMetrics": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)
- `defaultVertOriginY` - number (-32768..32767)
- `vertOriginYMetrics` - implementation-defined
- `numVertOriginYMetrics` - number (0..65535)





## Additional Nested Keys Seen In Implementation

- `glyphIndex`
- `vertOriginY`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
