# Agent Working Notes — Font-to-JSON

> These notes are written BY agents FOR future agents. Optimized for fast onboarding.

## Quick Start

- **Runtime**: Node.js, ES modules (`"type": "module"` in package.json)
- **Bundler**: Vite ^7.3.1 — library build, entry `src/main.js`, output `dist/font-to-json.es.js`
- **Testing**: Vitest ^4.0.18 — run with `npx vitest run`, watch with `npx vitest`
- **Test glob**: `test/**/*.test.js`
- **All data is big-endian** (OpenType spec). DataReader/DataWriter default to big-endian.

## Architecture

### Data Flow

```
Binary font (ArrayBuffer)
  → importFont(buffer)          [src/import.js]
    → readFontHeader(reader)    — 12-byte Offset Table
    → readTableDirectory(reader, n) — 16 bytes × numTables
    → extractTableData(buffer, dir) — dispatches to tableParsers or stores _raw
  → JSON object { header, tables }

JSON object
  → exportFont(fontData)        [src/export.js]
    → for each table: tableWriters[tag](data) or use _raw
    → reconstruct header + directory + table data
  → ArrayBuffer
```

### Registry Pattern (CRITICAL for adding new tables)

Adding a new table requires touching exactly 4 files:

1. **`src/otf/table_XYZ.js`** — Create parse and write functions
2. **`src/import.js`** — Add to `tableParsers` registry: `import { parseXyz } from './otf/table_XYZ.js'; const tableParsers = { ..., XYZ: parseXyz };`
3. **`src/export.js`** — Add to `tableWriters` registry: `import { writeXyz } from './otf/table_XYZ.js'; const tableWriters = { ..., XYZ: writeXyz };`
4. **`test/otf/table_XYZ.test.js`** — Create tests

Parser signature: `(rawBytes: number[]) → object` (receives raw byte array, returns structured JSON)
Writer signature: `(data: object) → number[]` (receives structured JSON, returns byte array)

The returned object from a parser should NOT include `_checksum` or `_raw` — those are managed by import.js/export.js.

### Table Data Shapes

**Unparsed tables** (no parser registered):

```json
{ "_raw": [byte, byte, ...], "_checksum": 0x12345678 }
```

**Parsed tables** (parser registered):

```json
{ "version": 0, "field1": ..., "field2": ..., "_checksum": 0x12345678 }
```

`_checksum` is always added by `extractTableData` in import.js — the parser itself never returns it.

### Shared Modules

**`src/reader.js` — DataReader** (cursor-based binary reader)

- Constructor: `new DataReader(bytes, startOffset?)` — bytes is `number[]` or `Uint8Array`
- Auto-advancing cursor at `reader.position`
- Methods: `uint8`, `uint16`, `uint24`, `uint32`, `int8`, `int16`, `int32`, `tag`, `offset16`, `offset32`, `fixed`, `fword`, `ufword`, `f2dot14`, `longDateTime`
- Bulk: `array(methodName, count)`, `bytes(count)`
- Navigation: `seek(offset)`, `skip(n)`
- Random access: `reader.view` exposes raw DataView

**`src/writer.js` — DataWriter** (cursor-based binary writer)

- Constructor: `new DataWriter(size)` — pre-allocated buffer of `size` bytes (zeroed)
- Matching write methods to DataReader (same names, take value param)
- Bulk: `array(methodName, values)`, `rawBytes(data)`
- Navigation: `seek(offset)`, `skip(n)`
- Output: `toArray()` → `number[]`
- All write methods return `this` (chainable)
- Random access: `writer.view`, `writer.bytes` expose raw DataView/Uint8Array

### File Map

```
src/
  main.js           — entry point, re-exports importFont + exportFont
  import.js         — importFont(), readFontHeader(), readTableDirectory(), extractTableData(), tableParsers registry
  export.js         — exportFont(), tableWriters registry (NOTE: not yet refactored to use DataWriter)
  reader.js         — DataReader class
  writer.js         — DataWriter class
  otf/
    table_cmap.js   — parseCmap(), writeCmap() — fully refactored to use DataReader/DataWriter

test/
  roundtrip.test.js       — import→export→reimport for OTF and TTF (oblegg.otf, oblegg.ttf)
  sample fonts/            — binary font files for testing
    oblegg.otf, oblegg.ttf — primary test fonts (small, simple)
    (others: BungeeTint, EmojiOneColor, fira, mtextra, noto, Multicoloure, Reinebow, oblegg.woff/woff2)
  otf/
    otf.test.js            — header parsing, table directory, required tables
    table_cmap.test.js     — cmap parsing, round-trip, format 4 specifics
```

## Completed Work

### OTF File Structure (header + table directory)

- `import.js`: Reads 12-byte Offset Table → table directory (16 bytes × numTables) → extracts table data
- `export.js`: Reconstructs the full binary from JSON (header + padded table data with 4-byte alignment)
- Tests: 6 in otf.test.js, 2 round-trip tests

### cmap Table (`src/otf/table_cmap.js`)

- **Parsed formats**: 0 (byte encoding), 4 (segment mapping), 6 (trimmed table), 12 (segmented coverage), 13 (many-to-one), 14 (Unicode variation sequences)
- **Raw fallback formats**: 2, 8, 10 — stored as `{ format, _raw }` and passed through on write
- **Subtable dedup**: Multiple encoding records can reference the same subtable offset; parseCmap deduplicates via `subtableIndex`
- **Format 14 complexity**: Has nested sub-structures (DefaultUVS, NonDefaultUVS) at offsets relative to the format 14 subtable start. Uses reader.seek/save pattern for random-access parsing.
- Tests: 7 in table_cmap.test.js

### DataReader / DataWriter Refactor

- `import.js` fully uses DataReader
- `table_cmap.js` fully uses DataReader (parse) and DataWriter (write)
- `export.js` still uses raw ArrayBuffer/DataView (not yet refactored, not urgent)

## Pending Work (from agent-context.md project plan)

Next tables for OTF, in order: **head**, **hhea**, **hmtx**, **maxp**, **name**, **OS-2**, **post**

Each follows the same workflow:

1. Read the spec for the table
2. Create `src/otf/table_<name>.js` with parse + write functions
3. Register in `tableParsers` (import.js) and `tableWriters` (export.js)
4. Create `test/otf/table_<name>.test.js`
5. Verify all tests still pass (round-trip tests are the safety net)

### Important Notes for Future Tables

- **OS/2 table**: Referred to as "OS-2" in filenames (`table_OS-2.js`) but the actual table tag in the font binary is `OS/2` — the registry key must be `'OS/2'`
- **Table name case**: Always honor the original case from the spec (e.g., `cmap` lowercase, `OS/2` mixed)
- **head table**: Contains `checkSumAdjustment` field (global font checksum); during write, this may need special handling
- **hmtx table**: Depends on values from `hhea` (numOfLongHorMetrics) and `maxp` (numGlyphs) — parser will need access to those values. Consider how to pass cross-table dependencies (currently parsers only receive their own raw bytes).
- **name table**: Has platform-specific string encodings — will need encoding/decoding logic
- **export.js refactor**: Still uses raw ArrayBuffer/DataView for the font header and table directory writing. Could be converted to DataWriter but works fine as-is.

## Testing Strategy

- **Round-trip tests** (`test/roundtrip.test.js`) are the primary correctness check: import → export → reimport must produce identical JSON
- **Table-specific tests** validate parsing details (field values, structure)
- Primary test fonts: `oblegg.otf` (CFF-based, sfVersion=OTTO) and `oblegg.ttf` (TrueType outlines, sfVersion=0x00010000)
- Currently 15 tests total, all passing

## Gotchas & Lessons Learned

1. **Parsed tables don't have `_raw`**: The test `otf.test.js` "should store data and a checksum for each table" was updated to check for `_raw` only when present — parsed tables have structured fields instead
2. **Format 4 glyphIdArray**: The count is derived from `(subtableLength - headerAndSegmentBytes) / 2`, not stored explicitly. The subtableOffset parameter is needed to compute this.
3. **Format 14 offsets**: DefaultUVS/NonDefaultUVS offsets are relative to the START of the format 14 subtable, not the start of the cmap table. In parsing, these offsets are added to `subtableOffset`.
4. **DataWriter.rawBytes()**: Accepts both `number[]` and `Uint8Array`. This is used when embedding serialized sub-structures (e.g., format 14 UVS data blocks).
5. **4-byte table padding**: export.js pads each table's data to 4-byte boundaries (padding bytes are zero). The `paddedLength` calculation: `length + ((4 - (length % 4)) % 4)`.
