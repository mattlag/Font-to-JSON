# `DSIG` table

Contains a digital signature for verifying the integrity and origin of the font file.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `DSIG`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "DSIG": {
      "version": 0,
      "flags": 0,
      "signatures": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number
- `flags` - number (0..65535)
- `signatures` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `format`
- `length`
- `offset`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
