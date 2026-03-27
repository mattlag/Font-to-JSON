# `fpgm` table

Contains the TrueType font program — global hinting instructions executed once when the font is loaded.

## Scope

- Format family: TTF-specific
- Table tag in JSON: `fpgm`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/fpgm
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "fpgm": {
      "instructions": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `instructions` - implementation-defined





## Additional Nested Keys Seen In Implementation

- None inferred from source.

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
