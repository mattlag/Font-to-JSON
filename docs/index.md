# Font Flux JS Documentation

This site is for humans writing or editing font JSON by hand.

## What this docs site covers

- How to validate JSON before export.
- What a valid top-level font JSON object looks like.
- Table-by-table reference pages with JSON fragment examples, practical notes, and pitfalls.

## Quick links

- [Validation guide](./guide/validation.md)
- [Table references](./tables/index.md)

## Top-level JSON shape

```json
{
	"header": {
		"sfVersion": 65536,
		"numTables": 9,
		"searchRange": 128,
		"entrySelector": 3,
		"rangeShift": 16
	},
	"tables": {
		"head": { "_raw": [0, 1, 2] },
		"cmap": { "_raw": [0, 1, 2] }
	}
}
```

## Workflow recommendation

1. Start from `importFont` output when possible.
2. Modify one table at a time.
3. Run `validateJSON`.
4. Only call `exportFont` when `report.valid === true`.
