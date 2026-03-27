# `VDMX` table

Stores pre-computed vertical device metrics to prevent clipping at specific pixel sizes on Windows.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `VDMX`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "VDMX": {
      "version": 0,
      "ratios": null,
      "groups": null,
      "numRecs": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number (0..65535)
- `ratios` - implementation-defined
- `groups` - implementation-defined
- `numRecs` - number (0..65535)





## Additional Nested Keys Seen In Implementation

- `bCharSet`
- `xRatio`
- `yStartRatio`
- `yEndRatio`
- `groupIndex`
- `ratios`
- `yPelHeight`
- `yMax`
- `yMin`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
