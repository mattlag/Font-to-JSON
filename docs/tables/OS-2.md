# `OS/2` table

Stores OS/2 and Windows-specific metrics — weight class, width class, Unicode ranges, and embedding flags.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `OS/2`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/os2
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "OS/2": {
      "version": 0,
      "sTypoAscender": 0,
      "xAvgCharWidth": 0,
      "usWeightClass": 0,
      "usWidthClass": 0,
      "fsType": 0,
      "ySubscriptXSize": 0,
      "ySubscriptYSize": 0,
      "ySubscriptXOffset": 0,
      "ySubscriptYOffset": 0,
      "ySuperscriptXSize": 0,
      "ySuperscriptYSize": 0,
      "ySuperscriptXOffset": 0,
      "ySuperscriptYOffset": 0,
      "yStrikeoutSize": 0,
      "yStrikeoutPosition": 0,
      "sFamilyClass": 0,
      "panose": [],
      "ulUnicodeRange1": 0,
      "ulUnicodeRange2": 0,
      "ulUnicodeRange3": 0,
      "ulUnicodeRange4": 0,
      "achVendID": "ABCD",
      "fsSelection": 0,
      "usFirstCharIndex": 0,
      "usLastCharIndex": 0,
      "sTypoDescender": 0,
      "sTypoLineGap": 0,
      "usWinAscent": 0,
      "usWinDescent": 0,
      "ulCodePageRange1": 0,
      "ulCodePageRange2": 0,
      "sxHeight": 0,
      "sCapHeight": 0,
      "usDefaultChar": 0,
      "usBreakChar": 0,
      "usMaxContext": 0,
      "usLowerOpticalPointSize": 0,
      "usUpperOpticalPointSize": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number (0..65535) [spec type: `uint16`]
- `sTypoAscender` - number [spec type: `FWORD`]
- `xAvgCharWidth` - number [spec type: `FWORD`]
- `usWeightClass` - number (0..65535) [spec type: `uint16`]
- `usWidthClass` - number (0..65535) [spec type: `uint16`]
- `fsType` - number (0..65535) [spec type: `uint16`]
- `ySubscriptXSize` - number [spec type: `FWORD`]
- `ySubscriptYSize` - number [spec type: `FWORD`]
- `ySubscriptXOffset` - number [spec type: `FWORD`]
- `ySubscriptYOffset` - number [spec type: `FWORD`]
- `ySuperscriptXSize` - number [spec type: `FWORD`]
- `ySuperscriptYSize` - number [spec type: `FWORD`]
- `ySuperscriptXOffset` - number [spec type: `FWORD`]
- `ySuperscriptYOffset` - number [spec type: `FWORD`]
- `yStrikeoutSize` - number [spec type: `FWORD`]
- `yStrikeoutPosition` - number [spec type: `FWORD`]
- `sFamilyClass` - number (-32768..32767) [spec type: `int16`]
- `panose` - number[] [spec type: `uint8`]
- `ulUnicodeRange1` - number [spec type: `uint32`]
- `ulUnicodeRange2` - number [spec type: `uint32`]
- `ulUnicodeRange3` - number [spec type: `uint32`]
- `ulUnicodeRange4` - number [spec type: `uint32`]
- `achVendID` - string (4-char tag) [spec type: `Tag`]
- `fsSelection` - number (0..65535) [spec type: `uint16`]
- `usFirstCharIndex` - number (0..65535) [spec type: `uint16`]
- `usLastCharIndex` - number (0..65535) [spec type: `uint16`]
- `sTypoDescender` - number [spec type: `FWORD`]
- `sTypoLineGap` - number [spec type: `FWORD`]
- `usWinAscent` - number [spec type: `UFWORD`]
- `usWinDescent` - number [spec type: `UFWORD`]
- `ulCodePageRange1` - number [spec type: `uint32`]
- `ulCodePageRange2` - number [spec type: `uint32`]
- `sxHeight` - number [spec type: `FWORD`]
- `sCapHeight` - number [spec type: `FWORD`]
- `usDefaultChar` - number (0..65535) [spec type: `uint16`]
- `usBreakChar` - number (0..65535) [spec type: `uint16`]
- `usMaxContext` - number (0..65535) [spec type: `uint16`]
- `usLowerOpticalPointSize` - number (0..65535) [spec type: `uint16`]
- `usUpperOpticalPointSize` - number (0..65535) [spec type: `uint16`]




## Validation Constraints

- `version` controls field presence and binary size (0 through 5 supported).
- Legacy short v0 form (68-byte stop at `usLastCharIndex`) is supported when typo/win fields are omitted.
- `panose` must be a 10-byte array.
- For `version >= 1`, include code page range fields; for `version >= 2`, include x-height/cap-height/default/break/max-context fields; for `version >= 5`, include optical point size fields.

## Authoring Example

```json
{
	"tables": {
		"OS/2": {
			"version": 4,
			"xAvgCharWidth": 500,
			"usWeightClass": 400,
			"usWidthClass": 5,
			"fsType": 0,
			"panose": [2, 11, 6, 4, 2, 2, 2, 2, 2, 4],
			"achVendID": "NONE",
			"usFirstCharIndex": 32,
			"usLastCharIndex": 65535,
			"sTypoAscender": 800,
			"sTypoDescender": -200,
			"sTypoLineGap": 0,
			"usWinAscent": 1000,
			"usWinDescent": 250,
			"ulCodePageRange1": 1,
			"ulCodePageRange2": 0,
			"sxHeight": 500,
			"sCapHeight": 700,
			"usDefaultChar": 0,
			"usBreakChar": 32,
			"usMaxContext": 2,
			"_checksum": 0
		}
	}
}
```



## Additional Nested Keys Seen In Implementation

- `version`
- `xAvgCharWidth`
- `usWeightClass`
- `usWidthClass`
- `fsType`
- `ySubscriptXSize`
- `ySubscriptYSize`
- `ySubscriptXOffset`
- `ySubscriptYOffset`
- `ySuperscriptXSize`
- `ySuperscriptYSize`
- `ySuperscriptXOffset`
- `ySuperscriptYOffset`
- `yStrikeoutSize`
- `yStrikeoutPosition`
- `sFamilyClass`
- `panose`
- `ulUnicodeRange1`
- `ulUnicodeRange2`
- `ulUnicodeRange3`
- `ulUnicodeRange4`
- `achVendID`
- `fsSelection`
- `usFirstCharIndex`
- `usLastCharIndex`
- `sTypoAscender`
- `sTypoDescender`
- `sTypoLineGap`
- `usWinAscent`
- `usWinDescent`
- `ulCodePageRange1`
- `ulCodePageRange2`
- `sxHeight`
- `sCapHeight`
- `usDefaultChar`
- `usBreakChar`
- `usMaxContext`
- `usLowerOpticalPointSize`
- `usUpperOpticalPointSize`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
