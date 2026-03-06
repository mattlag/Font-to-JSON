# `STAT` table

## Scope

- Format family: Shared SFNT
- Related tables: `fvar`, `name`

## JSON fragment patterns

### Parsed form (recommended when this table is supported)

```json
{
  "tables": {
    "STAT": {
      "_checksum": 0
    }
  }
}
```

### Raw fallback form (safe for unknown or WIP content)

```json
{
  "tables": {
    "STAT": {
      "_raw": [0, 1, 2, 3],
      "_checksum": 0
    }
  }
}
```

## Authoring notes

- Keep table tag exactly as `STAT` (4 chars, including spaces where applicable).
- Use parsed fields only when you understand the table structure and dependencies.
- If you are unsure, preserve or author this table via `_raw` bytes.
- Re-run `validateJSON` after every edit to catch cross-table issues early.

## Common mistakes to avoid

- Using the wrong tag case (for example `name` vs `NAME`).
- Removing a dependency table without updating this table.
- Supplying out-of-range byte values in `_raw`.
- Mixing parsed and raw assumptions without re-validating and round-tripping.
