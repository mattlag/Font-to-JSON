# `PCLT` table

Contains PCL 5 printer compatibility data — typeface number, pitch, symbol set, and style.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `PCLT`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "PCLT": {
      "version": 0,
      "fontNumber": 0,
      "pitch": 0,
      "xHeight": 0,
      "style": 0,
      "typeFamily": 0,
      "capHeight": 0,
      "symbolSet": 0,
      "typeface": null,
      "characterComplement": null,
      "fileName": null,
      "strokeWeight": 0,
      "widthType": 0,
      "serifStyle": 0,
      "reserved": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number
- `fontNumber` - number
- `pitch` - number (0..65535)
- `xHeight` - number (0..65535)
- `style` - number (0..65535)
- `typeFamily` - number (0..65535)
- `capHeight` - number (0..65535)
- `symbolSet` - number (0..65535)
- `typeface` - implementation-defined
- `characterComplement` - implementation-defined
- `fileName` - implementation-defined
- `strokeWeight` - number (-128..127)
- `widthType` - number (-128..127)
- `serifStyle` - number (0..255)
- `reserved` - number (0..255)





## Additional Nested Keys Seen In Implementation

- `version`
- `fontNumber`
- `pitch`
- `xHeight`
- `style`
- `typeFamily`
- `capHeight`
- `symbolSet`
- `typeface`
- `characterComplement`
- `fileName`
- `strokeWeight`
- `widthType`
- `serifStyle`
- `reserved`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
