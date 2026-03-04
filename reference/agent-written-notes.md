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

1. **`src/sfnt/table_XYZ.js`** — Create parse and write functions
2. **`src/import.js`** — Add to `tableParsers` registry: `import { parseXyz } from './sfnt/table_XYZ.js'; const tableParsers = { ..., XYZ: parseXyz };`
3. **`src/export.js`** — Add to `tableWriters` registry: `import { writeXyz } from './sfnt/table_XYZ.js'; const tableWriters = { ..., XYZ: writeXyz };`
4. **`test/sfnt/table_XYZ.test.js`** — Create tests

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
  import.js         — importFont(), tableParsers registry, tableParseOrder, dependency-aware extractTableData()
  export.js         — exportFont(), tableWriters registry (NOTE: not yet refactored to use DataWriter)
  reader.js         — DataReader class
  writer.js         — DataWriter class
  otf/               — future: CFF/CFF2-specific table parsers
  ttf/               — future: TrueType-specific table parsers (glyf, loca)
  sfnt/
    table_cmap.js   — parseCmap(), writeCmap() — fully refactored to use DataReader/DataWriter
    table_head.js   — parseHead(), writeHead() — fixed-size 54-byte table
    table_hhea.js   — parseHhea(), writeHhea() — fixed-size 36-byte table
    table_hmtx.js   — parseHmtx(), writeHmtx() — variable-size, cross-table deps
    table_maxp.js   — parseMaxp(), writeMaxp() — v0.5 (6 bytes) or v1.0 (32 bytes)
    table_name.js   — parseName(), writeName() — variable-size, string encoding/decoding
    table_OS-2.js   — parseOS2(), writeOS2() — version-dependent (v0–v5, 68–100 bytes)
    table_post.js   — parsePost(), writePost() — version-dependent (v1/v2/v2.5/v3, 32+ bytes)

test/
  roundtrip.test.js       — import→export→reimport for OTF and TTF (oblegg.otf, oblegg.ttf)
  sample fonts/            — binary font files for testing
    oblegg.otf, oblegg.ttf — primary test fonts (small, simple)
    (others: BungeeTint, EmojiOneColor, fira, mtextra, noto, Multicoloure, Reinebow, oblegg.woff/woff2)
  otf/                         — future: CFF-specific tests
  ttf/                         — future: TrueType-specific tests
  sfnt/
    sfnt.test.js               — header parsing, table directory, required tables
    table_cmap.test.js     — cmap parsing, round-trip, format 4 specifics
    table_head.test.js     — head parsing, field validation, round-trip, size check
    table_hhea.test.js     — hhea parsing, metrics, reserved fields, round-trip, size check
    table_hmtx.test.js     — hmtx parsing, cross-table validation, round-trip
    table_maxp.test.js     — maxp parsing, v0.5/v1.0 variants, round-trip, size check
    table_name.test.js     — name parsing, field validation, round-trip, synthetic v0/v1/MacRoman
    table_OS-2.test.js     — OS/2 parsing, version-dependent fields, round-trip, synthetic v0/v4
    table_post.test.js     — post parsing, version checking, round-trip, synthetic v1/v2/v3
```

## Completed Work

### OTF File Structure (header + table directory)

- `import.js`: Reads 12-byte Offset Table → table directory (16 bytes × numTables) → extracts table data
- `export.js`: Reconstructs the full binary from JSON (header + padded table data with 4-byte alignment)
- Tests: 6 in sfnt.test.js, 2 round-trip tests

### cmap Table (`src/sfnt/table_cmap.js`)

- **Parsed formats**: 0 (byte encoding), 4 (segment mapping), 6 (trimmed table), 12 (segmented coverage), 13 (many-to-one), 14 (Unicode variation sequences)
- **Raw fallback formats**: 2, 8, 10 — stored as `{ format, _raw }` and passed through on write
- **Subtable dedup**: Multiple encoding records can reference the same subtable offset; parseCmap deduplicates via `subtableIndex`
- **Format 14 complexity**: Has nested sub-structures (DefaultUVS, NonDefaultUVS) at offsets relative to the format 14 subtable start. Uses reader.seek/save pattern for random-access parsing.
- Tests: 7 in table_cmap.test.js

### head Table (`src/sfnt/table_head.js`)

- **Fixed-size**: Always 54 bytes, no variable-length data
- **LONGDATETIME fields**: `created` and `modified` are BigInt values (seconds since 1904-01-01). Vitest `toEqual` handles BigInt comparison correctly.
- **fontRevision**: Stored as Fixed (16.16 signed fixed-point) — uses `reader.fixed()` / `writer.fixed()`
- **checksumAdjustment**: Global font checksum adjustment — we preserve the original value on round-trip (no recalculation)
- Tests: 9 in table_head.test.js

### hhea Table (`src/sfnt/table_hhea.js`)

- **Fixed-size**: Always 36 bytes
- **Key field**: `numberOfHMetrics` — used by hmtx table to determine how many full longHorMetric records exist
- **Reserved fields**: 4 reserved int16 fields (reserved1–reserved4), must be 0. We preserve them for round-trip fidelity.
- **FWORD/UFWORD types**: ascender, descender, lineGap use fword (signed int16); advanceWidthMax uses ufword (unsigned uint16)
- Tests: 9 in table_hhea.test.js

### maxp Table (`src/sfnt/table_maxp.js`)

- **Two versions**: v0.5 (0x00005000, CFF/OTF, 6 bytes) has only version+numGlyphs; v1.0 (0x00010000, TrueType/TTF, 32 bytes) has 13 additional uint16 fields
- **Key field**: `numGlyphs` — used by hmtx to know total glyph count
- Tests: 6 in table_maxp.test.js

### hmtx Table (`src/sfnt/table_hmtx.js`)

- **Variable-size**: hMetrics array (4 bytes each) + leftSideBearings array (2 bytes each)
- **Cross-table dependencies**: Requires `hhea.numberOfHMetrics` and `maxp.numGlyphs` (passed via `tables` argument)
- **First table to use cross-table deps**: Parser signature is `parseHmtx(rawBytes, tables)` — the `tables` param contains already-parsed tables
- **leftSideBearings**: Additional lsb values for glyphs beyond numberOfHMetrics; count = numGlyphs - numberOfHMetrics (often 0 for variable-width fonts)
- Tests: 7 in table_hmtx.test.js

### name Table (`src/sfnt/table_name.js`)

- **Variable-size**: Header (6 bytes) + name records (12 bytes each) + optional lang-tag records + string storage
- **Two versions**: v0 (platform-specific language IDs only) and v1 (adds LangTagRecord array for BCP 47 language tags)
- **String encoding**: Platform 0 (Unicode) and 3 (Windows) use UTF-16BE; Platform 1 (Macintosh) encodingID 0 uses MacRoman
- **MacRoman encoding**: Full 256-char mapping including high-range (0x80–0xFF) to Unicode. Reverse map for encoding.
- **String deduplication**: Writer deduplicates identical byte sequences in the string storage pool
- **Hex escape fallback**: Non-decodable strings stored as `"0x:AABB..."` prefix for lossless round-trip
- **LangTagRecords**: Version 1 only. Language IDs ≥ 0x8000 reference these records (0-indexed from 0x8000). Always UTF-16BE.
- **No cross-table deps**: Parser uses standard `(rawBytes)` signature
- Tests: 10 in table_name.test.js

### OS/2 Table (`src/sfnt/table_OS-2.js`)

- **Version-dependent size**: v0 (78 bytes), v1 (86 bytes), v2/v3/v4 (96 bytes), v5 (100 bytes)
- **Six versions (0–5)**: Each version adds fields. v2/v3/v4 share the same binary layout; v3 and v4 only revise spec text.
- **Legacy v0 handling**: Some legacy v0 tables may be shorter than 78 bytes (stopping at usLastCharIndex, 68 bytes). Parser checks raw byte length before reading typo/win fields.
- **panose**: 10-byte `uint8` array, read/written with `reader.bytes(10)` / `writer.rawBytes()`
- **achVendID**: 4-byte Tag field (4 ASCII chars)
- **Filename vs registry key**: File is `table_OS-2.js` (no `/` in filenames), but registry key in import.js/export.js must be `'OS/2'` (matching the binary table tag)
- **No cross-table deps**: Parser uses standard `(rawBytes)` signature
- Tests: 10 in table_OS-2.test.js

### post Table (`src/sfnt/table_post.js`)

- **Version-dependent layout**: v1.0 and v3.0 are header-only (32 bytes); v2.0 adds glyph name data; v2.5 (deprecated) uses offset array
- **Version stored as raw uint32**: 0x00010000 (1.0), 0x00020000 (2.0), 0x00025000 (2.5), 0x00030000 (3.0)
- **258 standard Macintosh glyph names**: Built-in array + reverse lookup map. v1.0 uses these implicitly; v2.0 references them by index (0–257)
- **Version 2.0 custom names**: Stored as Pascal strings (length byte + ASCII chars). Writer deduplicates custom name strings.
- **Version 2.0 glyphNameIndex**: If index < 258, use standard Mac name. If ≥ 258, subtract 258 to index into custom Pascal strings.
- **CFF v1 fonts**: Must use version 3.0 (no glyph names). OTF fonts (OTTO) are typically v3.0.
- **italicAngle**: Fixed 16.16 signed fixed-point. Negative = leans right (forward).
- **No cross-table deps**: Parser uses standard `(rawBytes)` signature
- Tests: 12 in table_post.test.js

### Cross-Table Dependency System

- `extractTableData()` in import.js now processes tables in a **dependency-safe order** defined by `tableParseOrder`
- `tableParseOrder = ['head', 'maxp', 'hhea', 'cmap', 'hmtx', 'name', 'OS/2', 'post']`
- Tables in the order list are parsed first, remaining tables after
- Each parser receives `(rawBytes, tables)` — the `tables` object contains all previously-parsed tables
- Existing parsers (cmap, head, hhea) simply ignore the second argument
- Writers do NOT need cross-table deps — they only serialize their own data

### DataReader / DataWriter Refactor

- `import.js` fully uses DataReader
- `table_cmap.js` fully uses DataReader (parse) and DataWriter (write)
- `export.js` still uses raw ArrayBuffer/DataView (not yet refactored, not urgent)

## Pending Work (from agent-context.md project plan)

All planned OTF tables are now complete: **cmap**, **head**, **hhea**, **maxp**, **hmtx**, **name**, **OS/2**, **post**.

Possible future work:

- Additional tables (loca, glyf, CFF, GPOS, GSUB, etc.)
- WOFF/WOFF2 container support
- Full JSON serialization (BigInt replacer/reviver)
- export.js refactor to use DataWriter for header/directory

### Important Notes for Future Tables

- **OS/2 table**: DONE. Referred to as "OS-2" in filenames (`table_OS-2.js`) but the actual table tag in the font binary is `OS/2` — the registry key must be `'OS/2'`
- **Table name case**: Always honor the original case from the spec (e.g., `cmap` lowercase, `OS/2` mixed)
- **head table**: Contains `checkSumAdjustment` field (global font checksum); during write, this may need special handling
- **hmtx table**: DONE. Uses cross-table deps (hhea.numberOfHMetrics, maxp.numGlyphs). Parser receives `tables` as second argument.
- **name table**: DONE. Has platform-specific string encodings (UTF-16BE for platforms 0/3, MacRoman for platform 1 encoding 0). Hex-escape fallback for unknown encodings.
- **export.js refactor**: Still uses raw ArrayBuffer/DataView for the font header and table directory writing. Could be converted to DataWriter but works fine as-is.

## Testing Strategy

- **Round-trip tests** (`test/roundtrip.test.js`) are the primary correctness check: import → export → reimport must produce identical JSON
- **Table-specific tests** validate parsing details (field values, structure)
- Primary test fonts: `oblegg.otf` (CFF-based, sfVersion=OTTO) and `oblegg.ttf` (TrueType outlines, sfVersion=0x00010000)
- Currently 78 tests total, all passing

## Gotchas & Lessons Learned

1. **Parsed tables don't have `_raw`**: The test `otf.test.js` "should store data and a checksum for each table" was updated to check for `_raw` only when present — parsed tables have structured fields instead
2. **Format 4 glyphIdArray**: The count is derived from `(subtableLength - headerAndSegmentBytes) / 2`, not stored explicitly. The subtableOffset parameter is needed to compute this.
3. **Format 14 offsets**: DefaultUVS/NonDefaultUVS offsets are relative to the START of the format 14 subtable, not the start of the cmap table. In parsing, these offsets are added to `subtableOffset`.
4. **DataWriter.rawBytes()**: Accepts both `number[]` and `Uint8Array`. This is used when embedding serialized sub-structures (e.g., format 14 UVS data blocks).
5. **4-byte table padding**: export.js pads each table's data to 4-byte boundaries (padding bytes are zero). The `paddedLength` calculation: `length + ((4 - (length % 4)) % 4)`.
6. **BigInt in JSON**: LONGDATETIME fields (head.created, head.modified) are BigInt. Standard `JSON.stringify` cannot serialize BigInt — if full JSON serialization is needed later, a replacer/reviver will be required.
7. **Cross-table parse order matters**: hmtx depends on hhea and maxp being parsed first. The `tableParseOrder` array in import.js ensures this. When adding new tables with dependencies, add them AFTER their dependencies in this array.
8. **maxp version detection**: Use `version === 0x00010000` (not `=== 1.0`) since it's stored as a raw uint32, not a Fixed 16.16.
9. **post version detection**: Same pattern as maxp — `version === 0x00020000` etc. The version is Version16Dot16 (raw uint32), not a floating-point value.
10. **post v2.0 custom name parsing**: Must count Pascal strings by scanning forward from the glyphNameIndex array, using the maximum index value to know how many to read. Don't assume the string count equals numGlyphs.
