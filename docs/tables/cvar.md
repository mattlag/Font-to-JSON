# `cvar` table

Provides variation deltas for CVT values across the design space of a TrueType variable font.

## Scope

- Format family: TTF-specific
- Table tag in JSON: `cvar`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/cvar
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "cvar": {
      "tupleVariations": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `tupleVariations` - implementation-defined





## Additional Nested Keys Seen In Implementation

- None inferred from source.

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `.validate()` after edits.
