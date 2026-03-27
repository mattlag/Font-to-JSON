# `MERG` table

Contains merge rules that control how glyphs combine when fonts are merged together.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `MERG`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "MERG": {
      "version": null,
      "data": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - implementation-defined
- `data` - implementation-defined





## Additional Nested Keys Seen In Implementation

- None inferred from source.

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
