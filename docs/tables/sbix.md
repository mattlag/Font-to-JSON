# `sbix` table

Stores resolution-dependent bitmap or vector (PNG, JPEG, TIFF) glyph images, commonly used by Apple.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `sbix`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "sbix": {
      "version": 0,
      "flags": 0,
      "strikes": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number (0..65535)
- `flags` - number (0..65535)
- `strikes` - implementation-defined





## Additional Nested Keys Seen In Implementation

- None inferred from source.

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
