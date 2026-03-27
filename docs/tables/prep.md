# `prep` table

Contains the TrueType control value program — hinting instructions executed before each glyph is rendered.

## Scope

- Format family: TTF-specific
- Table tag in JSON: `prep`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/prep
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "prep": {
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
