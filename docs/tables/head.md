# `head` table

Contains global font metadata — units per em, bounding box, creation dates, and format flags.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `head`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/head
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "head": {
      "majorVersion": 0,
      "minorVersion": 0,
      "fontRevision": 0,
      "checksumAdjustment": 0,
      "magicNumber": 0,
      "flags": 0,
      "unitsPerEm": 0,
      "created": 0,
      "modified": 0,
      "xMin": 0,
      "yMin": 0,
      "xMax": 0,
      "yMax": 0,
      "macStyle": 0,
      "lowestRecPPEM": 0,
      "fontDirectionHint": 0,
      "indexToLocFormat": 0,
      "glyphDataFormat": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535) [spec type: `uint16`] (must be 1)
- `minorVersion` - number (0..65535) [spec type: `uint16`] (must be 0)
- `fontRevision` - number (16.16 fixed) [spec type: `Fixed`] (16.16 fixed-point)
- `checksumAdjustment` - number [spec type: `uint32`] (global font checksum adjustment)
- `magicNumber` - number [spec type: `uint32`] (must be 0x5F0F3CF5)
- `flags` - number (0..65535) [spec type: `uint16`]
- `unitsPerEm` - number (0..65535) [spec type: `uint16`] (16–16384)
- `created` - number (seconds since 1904-01-01 UTC) [spec type: `LONGDATETIME`] (seconds since 1904-01-01 00:00 UTC)
- `modified` - number (seconds since 1904-01-01 UTC) [spec type: `LONGDATETIME`] (seconds since 1904-01-01 00:00 UTC)
- `xMin` - number (-32768..32767) [spec type: `int16`]
- `yMin` - number (-32768..32767) [spec type: `int16`]
- `xMax` - number (-32768..32767) [spec type: `int16`]
- `yMax` - number (-32768..32767) [spec type: `int16`]
- `macStyle` - number (0..65535) [spec type: `uint16`]
- `lowestRecPPEM` - number (0..65535) [spec type: `uint16`]
- `fontDirectionHint` - number (-32768..32767) [spec type: `int16`] (deprecated, set to 2)
- `indexToLocFormat` - number (-32768..32767) [spec type: `int16`] (0 = short offsets, 1 = long)
- `glyphDataFormat` - number (-32768..32767) [spec type: `int16`] (0 for current format)





## Additional Nested Keys Seen In Implementation

- `majorVersion`
- `minorVersion`
- `fontRevision`
- `checksumAdjustment`
- `magicNumber`
- `flags`
- `unitsPerEm`
- `created`
- `modified`
- `xMin`
- `yMin`
- `xMax`
- `yMax`
- `macStyle`
- `lowestRecPPEM`
- `fontDirectionHint`
- `indexToLocFormat`
- `glyphDataFormat`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
