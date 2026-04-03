# `hhea` table

Provides horizontal layout metrics — ascender, descender, line gap, and caret slope for horizontal text.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `hhea`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/hhea
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "hhea": {
      "majorVersion": 0,
      "minorVersion": 0,
      "ascender": 0,
      "descender": 0,
      "lineGap": 0,
      "advanceWidthMax": 0,
      "minLeftSideBearing": 0,
      "minRightSideBearing": 0,
      "xMaxExtent": 0,
      "caretSlopeRise": 0,
      "caretSlopeRun": 0,
      "caretOffset": 0,
      "reserved1": 0,
      "reserved2": 0,
      "reserved3": 0,
      "reserved4": 0,
      "metricDataFormat": 0,
      "numberOfHMetrics": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535) [spec type: `uint16`] (must be 1)
- `minorVersion` - number (0..65535) [spec type: `uint16`] (must be 0)
- `ascender` - number [spec type: `FWORD`]
- `descender` - number [spec type: `FWORD`]
- `lineGap` - number [spec type: `FWORD`]
- `advanceWidthMax` - number [spec type: `UFWORD`]
- `minLeftSideBearing` - number [spec type: `FWORD`]
- `minRightSideBearing` - number [spec type: `FWORD`]
- `xMaxExtent` - number [spec type: `FWORD`]
- `caretSlopeRise` - number (-32768..32767) [spec type: `int16`]
- `caretSlopeRun` - number (-32768..32767) [spec type: `int16`]
- `caretOffset` - number (-32768..32767) [spec type: `int16`]
- `reserved1` - number (-32768..32767)
- `reserved2` - number (-32768..32767)
- `reserved3` - number (-32768..32767)
- `reserved4` - number (-32768..32767)
- `metricDataFormat` - number (-32768..32767) [spec type: `int16`] (0 for current format)
- `numberOfHMetrics` - number (0..65535) [spec type: `uint16`]





## Additional Nested Keys Seen In Implementation

- `majorVersion`
- `minorVersion`
- `ascender`
- `descender`
- `lineGap`
- `advanceWidthMax`
- `minLeftSideBearing`
- `minRightSideBearing`
- `xMaxExtent`
- `caretSlopeRise`
- `caretSlopeRun`
- `caretOffset`
- `reserved1`
- `reserved2`
- `reserved3`
- `reserved4`
- `metricDataFormat`
- `numberOfHMetrics`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
