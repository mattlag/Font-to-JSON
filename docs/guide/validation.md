# Validation Guide

Use `validateJSON` to catch structural and cross-table issues before export.

## API

```js
import { validateJSON, exportFont } from './dist/font-flux-js.js';

const report = validateJSON(fontJson);
if (!report.valid) {
	console.error(report.errors);
	throw new Error('Font JSON failed validation');
}

const buffer = exportFont(fontJson);
```

## What `validateJSON` checks

- Root shape (`header`, `tables`) for single fonts, or `collection` + `fonts[]` for TTC/OTC.
- Header field sanity (`sfVersion`, `numTables`, directory fields).
- Table tags are exactly 4 characters.
- Raw table bytes (`_raw`) are valid byte arrays.
- Parsed table support (unknown parsed tables must use `_raw`).
- Core table presence (`cmap`, `head`, `hhea`, `hmtx`, `maxp`, `name`, `post`).
- Outline requirements:
  - TrueType outline requires both `glyf` and `loca`.
  - CFF outline uses `CFF ` or `CFF2`.
- Common cross-table dependencies (for parsed tables), such as:
  - `hmtx` -> `hhea`, `maxp`
  - `loca` -> `head`, `maxp`
  - `glyf` -> `loca`, `head`, `maxp`
  - `vmtx` -> `vhea`, `maxp`

## Report format

```js
{
  valid: false,
  errors: [{ code, message, path, severity: 'error' }],
  warnings: [{ code, message, path, severity: 'warning' }],
  issues: [...],
  summary: { errorCount, warningCount, issueCount }
}
```

## Best practices

- Treat warnings as "likely bugs" when hand-authoring JSON.
- Keep `_raw` for unknown tables to preserve round-trip behavior.
- Prefer small iterative edits and validate after each edit.
