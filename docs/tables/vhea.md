# `vhea` table

Provides vertical layout metrics — ascender, descender, and line gap for vertical text.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `vhea`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/vhea
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "vhea": {
      "version": 0,
      "vertTypoAscender": 0,
      "vertTypoDescender": 0,
      "vertTypoLineGap": 0,
      "advanceHeightMax": 0,
      "minTopSideBearing": 0,
      "minBottomSideBearing": 0,
      "yMaxExtent": 0,
      "caretSlopeRise": 0,
      "caretSlopeRun": 0,
      "caretOffset": 0,
      "reserved1": 0,
      "reserved2": 0,
      "reserved3": 0,
      "reserved4": 0,
      "metricDataFormat": 0,
      "numOfLongVerMetrics": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number [spec type: `Version16Dot16`] (0x00010000 (1.0) or 0x00011000 (1.1))
- `vertTypoAscender` - number [spec type: `FWORD`] ((v1.0: "ascent"))
- `vertTypoDescender` - number [spec type: `FWORD`] ((v1.0: "descent"))
- `vertTypoLineGap` - number [spec type: `FWORD`] ((v1.0: "lineGap"))
- `advanceHeightMax` - number [spec type: `UFWORD`]
- `minTopSideBearing` - number [spec type: `FWORD`]
- `minBottomSideBearing` - number [spec type: `FWORD`]
- `yMaxExtent` - number [spec type: `FWORD`]
- `caretSlopeRise` - number (-32768..32767) [spec type: `int16`]
- `caretSlopeRun` - number (-32768..32767) [spec type: `int16`]
- `caretOffset` - number (-32768..32767) [spec type: `int16`]
- `reserved1` - number (-32768..32767)
- `reserved2` - number (-32768..32767)
- `reserved3` - number (-32768..32767)
- `reserved4` - number (-32768..32767)
- `metricDataFormat` - number (-32768..32767) [spec type: `int16`] (0 for current format)
- `numOfLongVerMetrics` - number (0..65535) [spec type: `uint16`]





## Additional Nested Keys Seen In Implementation

- `version`
- `vertTypoAscender`
- `vertTypoDescender`
- `vertTypoLineGap`
- `advanceHeightMax`
- `minTopSideBearing`
- `minBottomSideBearing`
- `yMaxExtent`
- `caretSlopeRise`
- `caretSlopeRun`
- `caretOffset`
- `reserved1`
- `reserved2`
- `reserved3`
- `reserved4`
- `metricDataFormat`
- `numOfLongVerMetrics`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
