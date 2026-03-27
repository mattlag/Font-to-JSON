# `hdmx` table

Caches pre-computed horizontal device metrics (advance widths) at specific pixel sizes for faster rendering.

## Scope

- Format family: Shared SFNT
- Table tag in JSON: `hdmx`

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "hdmx": {
      "version": 0,
      "records": null,
      "sizeDeviceRecord": 0,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `version` - number (0..65535)
- `records` - implementation-defined
- `sizeDeviceRecord` - number





## Additional Nested Keys Seen In Implementation

- None inferred from source.

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
