# Agent Working Notes — Font Flux JS

> These notes are written BY agents FOR future agents. Optimized for fast onboarding.

## Quick Start

- **Runtime**: Node.js, ES modules (`"type": "module"` in package.json)
- **Bundler**: Vite ^7.3.1 — library build, entry `src/main.js`, output `dist/font-flux-js.es.js`
- **Testing**: Vitest ^4.0.18 — run with `npx vitest run`, watch with `npx vitest`
- **Test glob**: `test/**/*.test.js`
- **All data is big-endian** (OpenType spec). DataReader/DataWriter default to big-endian.
- **Table docs generator**: `npm run docs:tables` rebuilds `docs/tables/*.md` from `src/**/table_*.js` parse/write shapes and embedded spec links.

## Architecture

### Data Flow

```
Binary font (ArrayBuffer)
  → importFont(buffer)          [src/import.js]
    → detects `ttcf` and parses TTC collections
    → internally: readFontHeader → readTableDirectory → extractTableData
    → builds { header, tables }
    → buildSimplified({ header, tables })   [src/simplify.js]
  → unified simplified object:
      { font, glyphs, tables, _header, features?, kerning?, axes?, ... }

  → importFontTables(buffer)    [src/import.js]  (internal/testing only)
  → { header, tables }

Simplified / JSON object
  → exportFont(fontData)        [src/export.js]
    → resolveExportSource() detects 3 shapes:
      1. Legacy { header, tables } — use as-is
      2. Imported simplified (_header + tables) — use stored tables directly
      3. Hand-authored (font + glyphs, no _header) — buildRawFromSimplified()
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
  main.js           — entry point, re-exports importFont, importFontTables, exportFont, fontToJSON, fontFromJSON, buildSimplified, buildRawFromSimplified, validateJSON, interpretCharString, disassembleCharString, contoursToSVGPath, svgPathToContours
  import.js         — importFont() returns simplified; importFontTables() returns { header, tables }; tableParsers registry, tableParseOrder
  export.js         — exportFont(), resolveExportSource() (3 input shapes), tableWriters registry, SFNT + TTC (`ttcf`) export paths
  json.js           — fontToJSON(), fontFromJSON() — JSON serialization with BigInt, TypedArray, and transient key handling
  simplify.js       — buildSimplified() converts { header, tables } → unified simplified object with stored tables + _header; CFF glyphs get contours + charString + charStringDisassembly
  expand.js         — buildRawFromSimplified() expands hand-authored simplified → { header, tables }
  reader.js         — DataReader class
  writer.js         — DataWriter class
  svg_path.js       — contoursToSVGPath(), svgPathToContours() — SVG path d-string ↔ font contour conversion (both TTF and CFF)
  otf/
    cff_common.js   — shared CFF/CFF2 utilities: DICT, INDEX, number encoding, charset, FDSelect
    table_CFF.js    — parseCFF(), writeCFF() — CFF v1 parser/writer
    table_CFF2.js   — parseCFF2(), writeCFF2() — CFF2 parser/writer
    charstring_interpreter.js — interpretCharString(), disassembleCharString(), interpretAllCharStrings() — CFF Type 2 charstring bytecode → cubic Bézier contours
    table_VORG.js   — parseVORG(), writeVORG() — Vertical Origin table
  ttf/
    table_loca.js   — parseLoca(), writeLoca() — glyph offset index (cross-table: head, maxp)
    table_glyf.js   — parseGlyf(), writeGlyf(), writeGlyfComputeOffsets() — TrueType outlines (cross-table: loca, maxp)
    table_cvt.js    — parseCvt(), writeCvt() — Control Value Table (FWORD array)
    table_fpgm.js   — parseFpgm(), writeFpgm() — Font Program (uint8 instruction array)
    table_prep.js   — parsePrep(), writePrep() — Control Value Program (uint8 instruction array)
    table_gasp.js   — parseGasp(), writeGasp() — Grid-fitting/Scan-conversion (version + GaspRange records)
  sfnt/
    opentype_layout_common.js — shared parse/write utilities for OpenType Layout tables (GDEF/GPOS/GSUB)
    table_cmap.js   — parseCmap(), writeCmap() — fully refactored to use DataReader/DataWriter
    table_GDEF.js   — parseGDEF(), writeGDEF() — Glyph Definition table (v1.0/1.2/1.3)
    table_GPOS.js   — parseGPOS(), writeGPOS() — Glyph Positioning (9 lookup types)
    table_GSUB.js   — parseGSUB(), writeGSUB() — Glyph Substitution (8 lookup types)
    table_head.js   — parseHead(), writeHead() — fixed-size 54-byte table
    table_hhea.js   — parseHhea(), writeHhea() — fixed-size 36-byte table
    table_hmtx.js   — parseHmtx(), writeHmtx() — variable-size, cross-table deps
    table_maxp.js   — parseMaxp(), writeMaxp() — v0.5 (6 bytes) or v1.0 (32 bytes)
    table_name.js   — parseName(), writeName() — variable-size, string encoding/decoding
    table_OS-2.js   — parseOS2(), writeOS2() — version-dependent (v0–v5, 68–100 bytes)
    table_post.js   — parsePost(), writePost() — version-dependent (v1/v2/v2.5/v3, 32+ bytes)
    table_vhea.js   — parseVhea(), writeVhea() — Vertical header (36 bytes, v1.0/1.1)
    table_vmtx.js   — parseVmtx(), writeVmtx() — Vertical metrics (cross-table: vhea, maxp)
    table_COLR.js   — parseCOLR(), writeCOLR() — Color table (v0 + v1 fully parsed via colr_paint.js)
    colr_paint.js   — COLR v1 Paint DAG: parseV1Data(), writeV1Data() — all 32 Paint formats
    table_CPAL.js   — parseCPAL(), writeCPAL() — Color palette (v0/v1 full)
    table_SVG.js    — parseSVG(), writeSVG() — SVG glyph descriptions (plain text + gzip)

test/
  json.test.js            — fontToJSON/fontFromJSON: BigInt handling, underscore stripping, indent control, real-font round-trips (OTF+TTF), export from deserialized JSON (11 tests)
  roundtrip.test.js       — import→export→reimport for OTF, TTF, and TTC samples
  sample fonts/            — binary font files for testing
    oblegg.otf, oblegg.ttf — primary test fonts (small, simple)
    (others: BungeeTint, EmojiOneColor, fira, mtextra, noto, Multicoloure, Reinebow, oblegg.woff/woff2)
  otf/
    table_CFF.test.js      — CFF v1 parsing, common utilities, round-trip (23 tests)
    table_CFF2.test.js     — CFF2 INDEX v2, synthetic round-trip (10 tests)
    charstring_interpreter.test.js — CFF charstring interpreter: synthetic charstrings, hint masking, real font integration (10 tests)
  ttf/
    table_loca.test.js     — loca parsing, writing, round-trip (9 tests)
    table_cvt.test.js      — cvt parsing, round-trip, synthetic FWORD values (8 tests)
    table_fpgm.test.js     — fpgm parsing, round-trip, uint8 validation (9 tests)
    table_prep.test.js     — prep parsing, round-trip, uint8 validation (9 tests)
    table_gasp.test.js     — gasp parsing, v0/v1, round-trip, multi-range synthetic (8 tests)
    table_glyf.test.js     — glyf parsing, simple/composite glyphs, writing, round-trip (14 tests)
  sfnt/
    sfnt.test.js               — header parsing, table directory, required tables
    table_cmap.test.js     — cmap parsing, round-trip, format 4 specifics
    table_GDEF.test.js     — GDEF parsing, round-trip (oblegg, fira, noto) (8 tests)
    table_GPOS.test.js     — GPOS parsing, round-trip (oblegg, fira, noto) (9 tests)
    table_GSUB.test.js     — GSUB parsing, round-trip (oblegg, fira, noto) (9 tests)
    table_head.test.js     — head parsing, field validation, round-trip, size check
    table_hhea.test.js     — hhea parsing, metrics, reserved fields, round-trip, size check
    table_hmtx.test.js     — hmtx parsing, cross-table validation, round-trip
    table_maxp.test.js     — maxp parsing, v0.5/v1.0 variants, round-trip, size check
    table_name.test.js     — name parsing, field validation, round-trip, synthetic v0/v1/MacRoman
    table_OS-2.test.js     — OS/2 parsing, version-dependent fields, round-trip, synthetic v0/v4
    table_post.test.js     — post parsing, version checking, round-trip, synthetic v1/v2/v3
    table_vhea.test.js     — vhea parsing, v1.0/v1.1, round-trip, size check (8 tests)
    table_vmtx.test.js     — vmtx parsing, cross-table validation, round-trip (7 tests)
    table_COLR.test.js     — COLR parsing, v0 structure, v1 Paint DAG (32 formats), round-trip, synthetic (19 tests)
    table_CPAL.test.js     — CPAL parsing, BGRA colors, round-trip, synthetic v0/v1 (8 tests)
    table_SVG.test.js      — SVG parsing, plain text/gzip, round-trip 3 fonts, synthetic (10 tests)
    svg_path.test.js       — SVG path d-string ↔ contour conversion: CFF cubic, TTF quadratic, round-trips, real font integration (19 tests)

  ### TTC Collections (`ttcf`) support

  - `importFont()` now detects `ttcf` signature and parses TTC header + face offsets + optional DSIG fields for v2+
  - TTC/OTC JSON shape: `{ collection: { tag, majorVersion, minorVersion, numFonts, ... }, fonts: [simplifiedFont, ...] }`
  - Each font in the collection is a unified simplified object (same shape as single-font import)
  - `exportFont()` accepts the TTC shape; each font is resolved via `resolveExportSource()` and emits a collection file with per-face SFNTs
  - Added TTC round-trip coverage in `test/roundtrip.test.js` (full round-trip on `msgothic-test.ttc`)

## Test policy (do not sidestep behavior gaps)

- `test/roundtrip-all-samples-double.test.js` should run against all `.ttf/.otf/.ttc` fixtures by default.
- Avoid `KNOWN_*_EXCLUSIONS` patterns as a way to keep CI green; exclusions hide missing import/export behavior.
- If a fixture fails, fix parser/writer logic first and keep the fixture in the suite so failures remain visible.
- Only temporary exclusions are acceptable when a fix is actively in progress in the same change set; remove them before completion.
```

## Completed Work

### OTF File Structure (header + table directory)

- `import.js`: Reads 12-byte Offset Table → table directory (16 bytes × numTables) → extracts table data
- `export.js`: Reconstructs the full binary from JSON (header + padded table data with 4-byte alignment)
- Tests: 6 in sfnt.test.js, 2 round-trip tests

### cmap Table (`src/sfnt/table_cmap.js`)

- **Parsed formats**: 0 (byte encoding), 2 (high-byte mapping), 4 (segment mapping), 6 (trimmed table), 8 (mixed 16/32-bit), 10 (trimmed array 32-bit), 12 (segmented coverage), 13 (many-to-one), 14 (Unicode variation sequences)
- **All formats fully parsed** — no `_raw` fallback for any known format
- **Format 2**: subHeaderKeys[256] + SubHeader records (firstCode, entryCount, idDelta, idRangeOffset) + glyphIdArray. Used for CJK double-byte encodings. Number of subHeaders derived from max(subHeaderKeys)/8+1.
- **Format 8**: 8192-byte is32 bitfield + SequentialMapGroup records. Mixed 16/32-bit coverage (effectively obsolete).
- **Format 10**: startCharCode + glyphIdArray[numChars]. 32-bit trimmed array (effectively obsolete).
- **Subtable dedup**: Multiple encoding records can reference the same subtable offset; parseCmap deduplicates via `subtableIndex`
- **Format 14 complexity**: Has nested sub-structures (DefaultUVS, NonDefaultUVS) at offsets relative to the format 14 subtable start. Uses reader.seek/save pattern for random-access parsing.
- **No sample fonts with formats 2/8/10**: Tests are synthetic (build binary, parse, verify, round-trip)
- Tests: 13 in table_cmap.test.js (7 existing + 6 new for formats 2, 8, 10)

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

### CFF Table (`src/otf/table_CFF.js` + `src/otf/cff_common.js`)

- **Full CFF v1 parse/write**: Header, Name INDEX, Top DICT INDEX, String INDEX, Global Subr INDEX, per-font data
- **Shared utilities** (`cff_common.js`): Encoded number decode/encode (1-5 byte integers, BCD reals), DICT decode/encode, INDEX v1/v2 parse/write, charset parse/write, encoding parse, FDSelect parse/write, operator name mappings
- **Top DICT**: All CFF1 operators mapped to human-readable names; offset-based entries (CharStrings, charset, Encoding, Private) are resolved and removed from topDict, stored as separate font fields
- **Private DICT**: All CFF1 Private DICT operators; Subrs offset resolved, localSubrs stored separately
- **CIDFont support**: FDArray INDEX parsing (each with its own Private DICT + Local Subrs), FDSelect
- **CharStrings/Subroutines**: Stored as raw byte arrays (no charstring operator decoding)
- **Writer offset strategy**: Uses forced 5-byte int32 encoding for all offset-bearing DICT operators, making Top DICT size deterministic and avoiding multi-pass offset resolution
- **Data layout** (write order): Header → Name INDEX → Top DICT INDEX → String INDEX → Global Subr INDEX → CharStrings INDEX → Charset → Encoding → Private DICT → Local Subrs → FDSelect → FDArray
- Tests: 23 in table_CFF.test.js (number encoding, INDEX round-trip, DICT round-trip, real-font parsing from oblegg.otf, CFF write/round-trip)

### CFF2 Table (`src/otf/table_CFF2.js`)

- **Full CFF2 parse/write**: 5-byte header (topDictLength field), inline Top DICT (not INDEX), Global Subr INDEX (v2), CharStrings INDEX (v2)
- **Key differences from CFF1**: No Name/String INDEX, no Encoding, INDEX uses uint32 count, Top DICT has only 5 operators
- **Font DICT INDEX**: Each Font DICT has Private entry → Private DICT → optional Local Subrs
- **VariationStore**: Stored as raw bytes (full ItemVariationStore parsing deferred)
- **FDSelect**: Formats 0, 3, and 4 (CFF2-specific uint32 format)
- **Same offset strategy as CFF1**: Forced int32 for offset operators
- Tests: 10 in table_CFF2.test.js (INDEX v2 round-trip, synthetic CFF2 table write/parse/round-trip, charstrings/globalsubrs/privatedict/localsubrs preservation)

### loca Table (`src/ttf/table_loca.js`)

### Variable Font Tables — Phase 1 (`fvar`, `avar`, `gvar`)

- Implemented and registered:
  - `src/sfnt/table_fvar.js` — `parseFvar()`, `writeFvar()`
  - `src/sfnt/table_avar.js` — `parseAvar()`, `writeAvar()`
  - `src/ttf/table_gvar.js` — `parseGvar()`, `writeGvar()`
- Registry wiring complete:
  - `src/import.js` tableParsers includes `fvar`, `avar`, `gvar`
  - `src/export.js` tableWriters includes `fvar`, `avar`, `gvar`
  - parse order updated in `src/import.js`: `fvar` then `avar` early; `gvar` after `glyf`
- `fvar` implementation notes:
  - Parses/writes axis records and instance records, including optional `postScriptNameID`
  - Writer auto-upgrades `instanceSize` to include `postScriptNameID` for all instances if any instance includes it (missing values become `0xFFFF`)
- `avar` implementation notes:
  - v1-style segment map parse/write (`F2DOT14` from/to coordinate pairs)
  - Stores per-axis maps as `segmentMaps[]` with `axisValueMaps[]`
- `gvar` implementation notes:
  - Container-level parse/write only (header, offset array, shared tuples, per-glyph variation blobs)
  - Per-glyph tuple variation internals are intentionally left raw for now (`glyphVariationData[]` as byte arrays)
  - Writer chooses short vs long offset encoding automatically and updates flag bit 0 accordingly
  - Important: `sharedTuplesOffset` and `glyphVariationDataArrayOffset` are distinct; glyph offsets are relative to glyph data array start
- New tests added:
  - `test/sfnt/table_fvar.test.js`
  - `test/sfnt/table_avar.test.js`
  - `test/ttf/table_gvar.test.js`
- Validation run:
  - New table suites pass (`8/8`)
  - `test/roundtrip.test.js` still passes (`2/2`)

### Variable Font Tables — Phase 2 (`STAT`)

- Implemented and registered:
  - `src/sfnt/table_STAT.js` — `parseSTAT()`, `writeSTAT()`
  - `src/import.js` tableParsers includes `STAT`
  - `src/export.js` tableWriters includes `STAT`
  - parse order in `src/import.js` includes `STAT` after `name`
- Header support:
  - Parses/writes STAT v1.0 (no `elidedFallbackNameID`) and v1.1/v1.2 (with `elidedFallbackNameID`)
  - Preserves `designAxisSize` and supports axis-record extension bytes via per-axis `_extra`
- Axis value table support:
  - Format 1, 2, 3, and 4 fully parsed/written
  - Unknown formats are preserved as `{ format, _raw }` for lossless round-trip
  - `axisValueOffsets` are handled as relative to the axis-value-offsets-array origin (per spec)
- New tests added:
  - `test/sfnt/table_STAT.test.js` (v1.0 + v1.2, formats 1/2/3/4, unknown format preservation, stability)
- Validation run:
  - Variable table suites (`fvar`, `avar`, `gvar`, `STAT`) pass (`12/12`)
  - `test/roundtrip.test.js` still passes (`2/2`)

### Variable Font Tables — Next Priority Block (`HVAR`, `MVAR`, `VVAR`, `cvar`)

- Implemented and registered:
  - `src/sfnt/table_HVAR.js` — `parseHVAR()`, `writeHVAR()`
  - `src/sfnt/table_MVAR.js` — `parseMVAR()`, `writeMVAR()`
  - `src/sfnt/table_VVAR.js` — `parseVVAR()`, `writeVVAR()`
  - `src/ttf/table_cvar.js` — `parseCvar()`, `writeCvar()`
  - `src/import.js` parser registry updated for `HVAR`, `MVAR`, `VVAR`, `cvar`
  - `src/export.js` writer registry updated for `HVAR`, `MVAR`, `VVAR`, `cvar`
- Parse-order updates in `src/import.js`:
  - `cvt ` before `cvar` (so CVT table exists before cvar parse if needed)
  - `HVAR` after `hmtx`, `MVAR` after `STAT`, `VVAR` after `vmtx`
- Implementation scope notes:
  - `HVAR` / `VVAR`: parse/write table headers + optional DeltaSetIndexMap subtables
  - DeltaSetIndexMap format 0/1 decode+encode implemented (packed outer/inner index fields)
  - ItemVariationStore content is preserved as raw bytes (`_raw`) for now
  - `MVAR`: parse/write header + ValueRecords (including variable `valueRecordSize` and per-record `_extra` bytes); ItemVariationStore preserved raw
  - `cvar`: container-level parse/write with version, packed tupleVariationCount field, headers-raw block, serialized-data block; tuple headers are also minimally decoded when axis count is available from `fvar`
- New tests added:
  - `test/sfnt/table_HVAR.test.js`
  - `test/sfnt/table_MVAR.test.js`
  - `test/sfnt/table_VVAR.test.js`
  - `test/ttf/table_cvar.test.js`
- Validation run:
  - New block suites pass (`12/12`)
  - `test/roundtrip.test.js` still passes (`2/2`)

### Block 3 — `kern` and `BASE`

- Implemented and registered:
  - `src/sfnt/table_kern.js` — `parseKern()`, `writeKern()`
  - `src/sfnt/table_BASE.js` — `parseBASE()`, `writeBASE()`
  - `src/import.js` parser registry + parse order includes `kern` and `BASE`
  - `src/export.js` writer registry includes `kern` and `BASE`
- `kern` behavior:
  - Supports OpenType `kern` v0 container, with structural parse/write for subtable format 0 (pair kerning)
  - Supports Apple `kern` v1.0 container at top level with raw-preserved subtables
  - Unknown subtable formats are preserved as raw bytes for round-trip safety
- `BASE` behavior:
  - Container-level parse/write for version 1.0 and 1.1 (including optional ItemVariationStore offset)
  - Referenced subtables (`horizAxis`, `vertAxis`, `itemVariationStore`) are preserved as raw bytes
- New tests added:
  - `test/sfnt/table_kern.test.js`
  - `test/sfnt/table_BASE.test.js`
- Validation run:
  - New `kern` + `BASE` suites pass (`7/7`)
  - `test/roundtrip.test.js` still passes (`2/2`)

- **Binary index table**: Maps glyph IDs to byte positions inside the glyf table. Purely a binary-layout artifact — offsets depend on the specific glyf encoding.
- **Two formats**: Short (head.indexToLocFormat=0): uint16 values × 2 = actual offset; Long (head.indexToLocFormat=1): uint32 actual offsets. Always numGlyphs+1 entries.
- **Cross-table deps (parse)**: `head.indexToLocFormat` (format selector), `maxp.numGlyphs` (entry count)
- **JSON representation**: loca.offsets are **stripped from the JSON output** by import.js after glyf parsing. They are a binary-layout artifact that changes whenever glyf is re-encoded. During export, offsets are recomputed from glyf bytes via `writeGlyfComputeOffsets()`.
- **writeLoca auto-detects format**: Chooses short format if all offsets are even and ≤ 0xFFFE×2; otherwise long.
- Tests: 9 in table_loca.test.js

### glyf Table (`src/ttf/table_glyf.js`)

- **TrueType outlines**: Contains glyph descriptions. Each glyph is either simple (Bézier control points) or composite (references to other glyphs).
- **Cross-table deps (parse)**: `loca.offsets` (byte positions), `maxp.numGlyphs` (glyph count)
- **Simple glyph JSON shape**: `{ type: 'simple', xMin, yMin, xMax, yMax, contours: [[{x, y, onCurve},...]], instructions: number[], overlapSimple: boolean }`
  - Coordinates stored as **absolute values** (converted from delta encoding during parse, converted back during write)
  - Flag packing with REPEAT_FLAG compression, coordinate short/same optimization
- **Composite glyph JSON shape**: `{ type: 'composite', xMin, yMin, xMax, yMax, components: [{glyphIndex, flags: {argsAreXYValues, ...}, argument1, argument2, transform?: {...}}], instructions: number[] }`
  - Flags stored as human-readable object (e.g., `{argsAreXYValues: true, useMyMetrics: true}`)
  - `rebuildComponentFlags()` reconstructs the binary uint16 from the flag object
  - Transform variants: single scale, x+y scale, or full 2×2 matrix
- **Empty glyphs**: null in the glyphs array (space characters, etc.)
- **writeGlyfComputeOffsets(glyf)**: Returns `{ bytes, offsets }` — bytes for glyf table, offsets for loca coordination
- **2-byte alignment**: Each glyph is padded to even byte boundary (required for loca short format)
- **glyf ↔ loca export coordination**: `coordinateTableWrites()` in export.js pre-computes glyf bytes, derives loca offsets, and optionally updates head.indexToLocFormat. No mutation of input data.
- Tests: 14 in table_glyf.test.js

### cvt Table (`src/ttf/table_cvt.js`)

- **Trivial structure**: Just an array of FWORD (int16) values. Count = table byte length / 2.
- **No header**: The entire table is the flat int16 array.
- **JSON shape**: `{ values: number[] }` — each value is a signed 16-bit integer (-32768..32767)
- **No cross-table deps**: Parser uses standard `(rawBytes)` signature
- **Tag has trailing space**: Binary tag is `'cvt '` (4 chars with trailing space), registry key must be `'cvt '`
- Tests: 8 in table_cvt.test.js

### fpgm Table (`src/ttf/table_fpgm.js`)

- **Trivial structure**: Just an array of uint8 TrueType instructions. Count = table byte length.
- **JSON shape**: `{ instructions: number[] }` — each value is 0..255
- **Purpose**: Contains FDEFs/IDEFs (function and instruction definitions), run once when font first used
- **No DataReader/DataWriter needed**: Direct byte copy via `Array.from()`
- Tests: 9 in table_fpgm.test.js

### prep Table (`src/ttf/table_prep.js`)

- **Trivial structure**: Just an array of uint8 TrueType instructions. Count = table byte length.
- **JSON shape**: `{ instructions: number[] }` — identical structure to fpgm
- **Purpose**: Control Value Program — runs whenever point size, font, or transformation changes
- **No DataReader/DataWriter needed**: Direct byte copy via `Array.from()`
- Tests: 9 in table_prep.test.js

### gasp Table (`src/ttf/table_gasp.js`)

- **Two versions**: v0 and v1 (same binary format, v1 adds two ClearType-specific behavior flags)
- **Structure**: Header (uint16 version, uint16 numRanges) + array of GaspRange records (uint16 rangeMaxPPEM, uint16 rangeGaspBehavior)
- **JSON shape**: `{ version: number, gaspRanges: Array<{ rangeMaxPPEM: number, rangeGaspBehavior: number }> }`
- **Behavior flags**: 0x0001 GASP_GRIDFIT, 0x0002 GASP_DOGRAY, 0x0004 GASP_SYMMETRIC_GRIDFIT (v1), 0x0008 GASP_SYMMETRIC_SMOOTHING (v1)
- **Sentinel**: Last range should use rangeMaxPPEM = 0xFFFF to cover all remaining sizes
- Tests: 8 in table_gasp.test.js

### vhea Table (`src/sfnt/table_vhea.js`)

- **Fixed-size**: Always 36 bytes — structurally identical to hhea but for vertical metrics
- **Two spec versions**: v1.0 (0x00010000) and v1.1 (0x00011000) — same binary layout, field names differ (v1.0: ascent/descent/lineGap → v1.1: vertTypoAscender/vertTypoDescender/vertTypoLineGap)
- **Version stored as raw uint32**: Unlike hhea which stores majorVersion/minorVersion as two uint16s, vhea uses Version16Dot16 (single uint32)
- **JSON field names**: Uses v1.1 names (vertTypoAscender, vertTypoDescender, vertTypoLineGap) regardless of version
- **Key field**: `numOfLongVerMetrics` — used by vmtx to determine how many full LongVerMetric records exist
- **No cross-table deps**: Parser uses standard `(rawBytes)` signature
- Tests: 8 in table_vhea.test.js

### vmtx Table (`src/sfnt/table_vmtx.js`)

- **Variable-size**: vMetrics array (4 bytes each) + topSideBearings array (2 bytes each) — mirrors hmtx exactly
- **Cross-table dependencies**: Requires `vhea.numOfLongVerMetrics` and `maxp.numGlyphs` (passed via `tables` argument)
- **JSON shape**: `{ vMetrics: [{advanceHeight, topSideBearing}], topSideBearings: number[] }`
- **topSideBearings**: Additional tsb values for glyphs beyond numOfLongVerMetrics; count = numGlyphs - numOfLongVerMetrics (often 0 for CJK fonts where all glyphs have unique heights)
- **Parse order**: Added to `tableParseOrder` in import.js — vhea before vmtx, both after glyf
- Tests: 7 in table_vmtx.test.js

### OpenType Layout Common Module (`src/sfnt/opentype_layout_common.js`)

- **Shared by GDEF, GPOS, GSUB** — ~1473 lines of shared parse/write utilities
- **Coverage tables**: `parseCoverage/writeCoverage` — format 1 (glyph array) and format 2 (range records)
- **ClassDef tables**: `parseClassDef/writeClassDef` — format 1 (start glyph + class array) and format 2 (range records)
- **Device/VariationIndex tables**: `parseDevice/writeDevice` — formats 1-3 (Device: delta bit packing at 2/4/8 bits) and format 0x8000 (VariationIndex)
- **ScriptList**: `parseScriptList/writeScriptList` — Script records → Script tables → LangSys tables (with DefaultLangSys)
- **FeatureList**: `parseFeatureList/writeFeatureList` — Feature records → Feature tables (with optional FeatureParams offset, stored raw)
- **LookupList**: `parseLookupList/writeLookupList` — Lookup array → individual Lookups with subtable dispatch via callback
  - **Extension transparency**: Parser auto-unwraps Extension Lookups (type 7 for GSUB, type 9 for GPOS). JSON stores inner lookup type, not the Extension wrapper. `extensionLookupType` param controls this.
  - **Auto-wrapping on overflow**: Writer detects when LookupList exceeds Offset16 (64KB) limit. If so, ALL Lookups are wrapped in Extension headers with deferred inner data (Offset32). Two code paths: simple (self-contained Lookups) and overflow (packed Extension headers + deferred data pool).
- **SequenceContext**: `parseSequenceContext/writeSequenceContext` — formats 1-3 (glyphs, classes, coverage)
- **ChainedSequenceContext**: `parseChainedSequenceContext/writeChainedSequenceContext` — formats 1-3
- **FeatureVariations**: `parseFeatureVariations/writeFeatureVariations` — ConditionSet → FeatureTableSubstitution
- **Write pattern**: All writers use bottom-up serialization — serialize children to byte arrays, compute offsets from sizes, then write parent header + offsets + child data

### GDEF Table (`src/sfnt/table_GDEF.js`)

- **Versions**: 1.0 (glyphClassDef, attachList, ligCaretList, markAttachClassDef), 1.2 (adds markGlyphSets), 1.3 (adds itemVarStore)
- **GlyphClassDef/MarkAttachClassDef**: Stored as ClassDef objects via `parseClassDef`
- **AttachList**: Coverage + array of attach point arrays per glyph
- **LigCaretList**: Coverage + LigGlyph array, each with CaretValue records (format 1: coordinate, format 2: contour point, format 3: coordinate + Device table)
- **MarkGlyphSets**: Array of Coverage tables for mark filtering
- **ItemVariationStore**: Stored as raw bytes (`itemVarStoreRaw`) — full parsing deferred
- Tests: 8 in table_GDEF.test.js

### GSUB Table (`src/sfnt/table_GSUB.js`)

- **Versions**: 1.0 (scriptList, featureList, lookupList), 1.1 (adds featureVariations)
- **8 lookup types**:
  1. SingleSubst (fmt 1: delta, fmt 2: explicit mapping)
  2. MultipleSubst (1→many replacement sequences)
  3. AlternateSubst (1→alternate glyph sets)
  4. LigatureSubst (many→1 ligature formation)
  5. ContextualSubst (delegates to shared `parseSequenceContext`)
  6. ChainedContextSubst (delegates to shared `parseChainedSequenceContext`)
  7. ExtensionSubst — **transparent** (auto-unwrapped by parser, auto-wrapped by writer)
  8. ReverseChainSingleSubst (reverse chaining single substitution)
- **Extension type 7**: Passed as `extensionLookupType` to `parseLookupList`/`writeLookupList`
- Tests: 9 in table_GSUB.test.js

### GPOS Table (`src/sfnt/table_GPOS.js`)

- **Versions**: 1.0 (scriptList, featureList, lookupList), 1.1 (adds featureVariations)
- **GPOS-specific helpers**:
  - `valueFormatSize(vf)`: Popcount-based — counts set bits × 2 bytes
  - `parseValueRecord/writeValueRecord`: Variable-size based on valueFormat bitfield (bits 0x0001–0x0080 for xPlacement, yPlacement, xAdvance, yAdvance, plus 4 Device table offsets)
  - `parseAnchor/writeAnchor`: Format 1 (x,y), format 2 (x,y,anchorPoint), format 3 (x,y + Device tables)
  - `parseMarkArray/writeMarkArray`, `writeBaseArray`, `writeLigatureArray`
- **9 lookup types**:
  1. SinglePos (fmt 1: one ValueRecord for all, fmt 2: per-glyph ValueRecords)
  2. PairPos (fmt 1: explicit pair sets, fmt 2: class-based with ClassDef)
  3. CursivePos (entry/exit Anchors)
  4. MarkBasePos (Mark + Base coverage/array with Anchors)
  5. MarkLigPos (Mark + Ligature coverage/array with component Anchors)
  6. MarkMarkPos (Mark1 + Mark2 coverage/array with Anchors)
  7. ContextPos (delegates to shared `parseSequenceContext`)
  8. ChainedContextPos (delegates to shared `parseChainedSequenceContext`)
  9. ExtensionPos — **transparent** (auto-unwrapped/auto-wrapped)
- **Extension type 9**: Passed as `extensionLookupType` to `parseLookupList`/`writeLookupList`
- **Known limitation**: ValueRecord Device table offsets (bits 0x0010–0x0080) are parsed as Device objects but written as offset 0 during serialization. Device data is collected but not re-embedded in the subtable. This does NOT affect round-trip because the parsed Device objects match when re-parsed from the same binary.
- Tests: 9 in table_GPOS.test.js

### CPAL Table (`src/sfnt/table_CPAL.js`)

- **Color palette table**: Defines named color palettes used by COLR and SVG tables
- **Two versions**: v0 (header + palettes), v1 (adds paletteTypes, paletteLabels, paletteEntryLabels)
- **ColorRecord format**: BGRA order — blue, green, red, alpha (each uint8), NOT RGBA
- **JSON shape**: `{ version, numPaletteEntries, palettes: Array<Array<{blue, green, red, alpha}>>, paletteTypes?: number[], paletteLabels?: number[], paletteEntryLabels?: number[] }`
- **v1 optional arrays**: paletteTypes (uint32 flags per palette), paletteLabels/paletteEntryLabels (uint16 name IDs, 0xFFFF = no label)
- **No cross-table deps**: Parser uses standard `(rawBytes)` signature
- Tests: 8 in table_CPAL.test.js

### SVG Table (`src/sfnt/table_SVG.js`)

- **SVG glyph descriptions**: Contains SVG documents for color glyph rendering
- **Tag has trailing space**: Binary tag is `'SVG '` (4 bytes), registry key must be `'SVG '`
- **Document storage**: Plain-text SVG stored as `{ compressed: false, text: "..." }`, gzip-compressed (magic 0x1F 0x8B) stored as `{ compressed: true, data: number[] }`
- **Document deduplication**: Multiple entries can share the same document (tracked by documentIndex)
- **JSON shape**: `{ version, documents: Array<{compressed, text?, data?}>, entries: Array<{startGlyphID, endGlyphID, documentIndex}> }`
- **Binary layout**: 10-byte header (version u16, svgDocumentListOffset u32, reserved u32) → SVGDocumentList (numEntries u16 + SVGDocumentRecord array) → document data blocks
- **No cross-table deps**: Parser uses standard `(rawBytes)` signature
- Tests: 10 in table_SVG.test.js

### COLR Table (`src/sfnt/table_COLR.js` + `src/sfnt/colr_paint.js`)

- **Color glyph definitions**: Maps base glyphs to layered color glyph compositions
- **v0 fully parsed**: BaseGlyphRecord (glyphID, firstLayerIndex, numLayers) + LayerRecord (glyphID, paletteIndex)
- **v1 fully parsed**: All 32 Paint formats via `colr_paint.js` module
  - `parseV1Data(reader, v1Header)` — entry point; returns `{ baseGlyphPaintRecords, layerPaints, clipList, varIndexMap, itemVariationStore }`
  - `writeV1Data(v1)` — returns `{ bodyBytes, offsets }` for assembly by table_COLR writer
  - **Parse cache**: Map<absoluteOffset, paintNode> ensures DAG sharing (multiple parents → same child object)
  - **Topological sort**: Kahn's algorithm with index-based queue for O(n) writer layout (parents before children for forward offsets)
  - **32 Paint formats**: PaintColrLayers(1), PaintSolid(2/3), PaintLinearGradient(4/5), PaintRadialGradient(6/7), PaintSweepGradient(8/9), PaintGlyph(10), PaintColrGlyph(11), PaintTransform(12/13), PaintTranslate(14/15), PaintScale(16-23), PaintRotate(24-27), PaintSkew(28-31), PaintComposite(32)
  - **Inline subtables**: ColorLine/VarColorLine written immediately after gradient headers; Affine2x3/VarAffine2x3 written immediately after transform headers
  - **ClipList**: Parsed in two passes (read all clip records first, then resolve clip box data) to avoid seek-away-mid-iteration bug
  - **DeltaSetIndexMap**: Local implementation (same format as HVAR/VVAR)
  - **ItemVariationStore**: Delegates to `src/sfnt/item_variation_store.js`
- **v0 header**: 14 bytes (version u16, numBaseGlyphRecords u16, baseGlyphRecordsOffset u32, layerRecordsOffset u32, numLayerRecords u16)
- **v1 header**: 5 Offset32 fields after v0 header (baseGlyphListOffset, layerListOffset, clipListOffset, varIndexMapOffset, itemVariationStoreOffset)
- **No cross-table deps**: Parser uses standard `(rawBytes)` signature
- **PERF NOTE**: Original topological sort used `queue.shift()` O(n²) + `sorted.includes()` O(n²). Fixed with index-based queue + Set for O(n).
- Tests: 19 in table_COLR.test.js (8 v0 + 11 v1)

### Cross-Table Dependency System

- `extractTableData()` in import.js now processes tables in a **dependency-safe order** defined by `tableParseOrder`
- `tableParseOrder = ['head', 'maxp', 'hhea', 'cmap', 'hmtx', 'name', 'OS/2', 'post', 'CFF ', 'CFF2', 'loca', 'glyf']`
- Tables in the order list are parsed first, remaining tables after
- Each parser receives `(rawBytes, tables)` — the `tables` object contains all previously-parsed tables
- Existing parsers (cmap, head, hhea) simply ignore the second argument
- Writers do NOT need cross-table deps — they only serialize their own data
- **Exception**: glyf ↔ loca coordination. Writing glyf may change glyph byte positions, so loca offsets must be recomputed. `coordinateTableWrites()` in export.js handles this: writes glyf first (via `writeGlyfComputeOffsets`), rebuilds loca from new offsets, and updates head.indexToLocFormat if needed. Pre-computed bytes are cached and used directly by the export loop.

### Unified Simplified Output (Architecture Refactor)

- **Previous architecture**: `importFont()` returned `{ raw: { header, tables }, simplified: { font, glyphs, ... } }` — dual-layer with sync concerns
- **New architecture**: `importFont()` returns a **unified simplified object** directly:
  - Top-level: `{ font, glyphs, tables, _header, features?, kerning?, axes?, instances?, gasp?, cvt?, fpgm?, prep? }`
  - `tables` contains ALL original parsed tables (not just non-decomposed) for lossless round-trip export
  - `_header` stores the original SFNT header
- **`importFontTables(buffer)`**: New internal/testing export returning `{ header, tables }` — used by table-level unit tests
- **Export resolution**: `resolveExportSource()` in export.js handles 3 input shapes:
  1. Legacy `{ header, tables }` (from `importFontTables()`)
  2. Imported simplified (has `_header` + `tables`) — uses stored tables directly
  3. Hand-authored (`font` + `glyphs`, no `_header`) — calls `buildRawFromSimplified()`
- **Test migration**: 25+ table test files changed from `importFont(buffer).raw` → `importFontTables(buffer)`
- **Roundtrip tests updated**: `font.raw.tables.GPOS` → `font.features.GPOS`, `f.raw.header.sfVersion` → `f._header.sfVersion`, CFF detection via `f.glyphs.some(g => g.charString)`
- **Key insight**: `buildRawFromSimplified` is designed for NEW hand-authored fonts, not for reconstructing imported font data. Imported fonts preserve their original tables for lossless export.

### DataReader / DataWriter Refactor

- `import.js` fully uses DataReader
- `table_cmap.js` fully uses DataReader (parse) and DataWriter (write)
- `export.js` still uses raw ArrayBuffer/DataView (not yet refactored, not urgent)

## Pending Work (from agent-context.md project plan)

All planned shared SFNT tables are now complete: **cmap**, **head**, **hhea**, **maxp**, **hmtx**, **name**, **OS/2**, **post**.
OTF CFF-specific tables complete: **CFF** (v1), **CFF2**, **VORG**.
TTF outline tables complete: **loca**, **glyf**.
Advanced Typographic tables complete: **GDEF**, **GPOS**, **GSUB** (with shared OpenType Layout common module).
Additional advanced typographic tables complete: **BASE**, **JSTF**, **MATH**.
TTF Hinting tables complete: **cvt**, **fpgm**, **prep**, **gasp**.
Vertical Metrics tables complete: **vhea**, **vmtx**.
Color Font tables complete: **COLR**, **CPAL**, **SVG**.
Variation tables complete: **fvar**, **avar**, **STAT**, **gvar**, **HVAR**, **MVAR**, **VVAR**, **cvar**.
Additional OpenType tables complete: **kern**, **BASE**.
Bitmap glyph tables fully structured: **EBLC**, **EBDT**, **EBSC**, **CBLC**, **CBDT**, **sbix** — with shared **bitmap_common.js** metrics helpers.
Additional shared tables complete: **DSIG**, **hdmx**, **LTSH**.
Additional shared tables complete: **MERG**, **meta**.
Additional shared tables complete: **PCLT**, **VDMX**.
Container format support complete: **WOFF** (v1.0), **WOFF2** (v2.0).

Possible future work:

- Additional tables (feat/morx, etc.)
- Full JSON serialization (BigInt replacer/reviver)
- export.js refactor to use DataWriter for header/directory
- WOFF2 forward transforms (glyf/loca/hmtx) for better compression ratios (currently uses null transforms)

### WOFF 2.0 Container Support (`src/woff/woff2.js`)

- **Full WOFF2 import (unwrap) and export (wrap)**: ~1300 LOC in `src/woff/woff2.js`
- **Brotli compression**: Uses Node.js built-in `zlib.brotliCompressSync/brotliDecompressSync` in Node.js environments; falls back to `brotli-wasm` (WASM) in browsers. Lazy async init via `initWoff2()` / `initBrotli()`.
- **Dependencies**: `brotli-wasm` added to package.json (browser fallback only; Node.js uses built-in zlib)
- **Async init pattern**: `initWoff2()` must be awaited once before WOFF2 operations. Keeps `importFont`/`exportFont` synchronous.
- **Unwrap (WOFF2 → SFNT)**:
  - Parses 48-byte WOFF2 header + variable-length table directory (with known tag indices 0–62 and UIntBase128 lengths)
  - Parses optional collection directory for TTC-in-WOFF2
  - Brotli-decompresses the concatenated table data stream
  - Applies reverse transforms per WOFF2 spec:
    - **glyf transform (§5.1)**: Parses 7 substreams (nContour, nPoints, flag, glyph, composite, bbox, instruction), decodes triplet-encoded coordinates via 128-entry lookup table, reconstructs standard TrueType glyf records with flag compression
    - **loca transform (§5.3)**: Rebuilds loca table from reconstructed glyph offsets
    - **hmtx transform (§5.4)**: Reconstructs lsb/leftSideBearing values from glyf xMin
  - Reassembles valid SFNT (or TTC) with correct table directory, offsets, checksums, and head.checksumAdjustment
- **Wrap (SFNT → WOFF2)**:
  - Uses **null transforms** (glyf/loca version 3, hmtx version 0) for simplicity — produces valid but less optimally compressed WOFF2
  - Removes DSIG table per spec requirement
  - Encodes known table tags as indices, unknown tags as 4-byte literals
  - Brotli-compresses concatenated table data, optional metadata
  - Supports optional metadata and private data blocks
- **Integration**:
  - `import.js`: `'wOF2'` signature detection → `unwrapWOFF2()` → recurse with `importFont()` on resulting SFNT, sets `_woff.version = 2`
  - `export.js`: `wrapWOFF2()` calls in single-font, collection, and collection-split export paths; `SUPPORTED_FORMATS` includes `'woff2'`; smart default detects `_woff.version === 2`
  - `main.js`: exports `initWoff2()` async init function
- **Variable-length types**: `readUIntBase128()` / `writeUIntBase128()`, `read255UInt16()` / `write255UInt16()`
- **Known design tradeoffs**:
  - Null transforms for encoding: Simpler implementation, slightly larger files. Full forward transforms (triplet encoding, glyf stream splitting) would improve compression but add significant complexity.
  - WOFF2 reassembly recomputes correct SFNT directory checksums; the export pipeline has a pre-existing issue where some table directory checksums are stale. This means WOFF2 roundtrip "corrects" checksums. Tests strip `_checksum` and `checksumAdjustment` for comparisons.
- **Tests**: 16 in `test/woff/woff2.test.js` (unwrap, wrap, importFont integration, exportFont integration, cross-format WOFF1↔WOFF2). `test/woff/cross-format.test.js` updated to test WOFF2 export success (was previously testing error throw).

### CFF CharString Interpreter (`src/otf/charstring_interpreter.js`)

- **Purpose**: Decode opaque CFF Type 2 charstring byte arrays into renderable cubic Bézier contour commands
- **`interpretCharString(bytes, localSubrs, globalSubrs)`**: Main entry point. Takes charstring byte array + subroutines → returns `contour[][]` where each contour is array of `{type: 'M'|'L'|'C', x, y, x1?, y1?, x2?, y2?}` commands
- **`disassembleCharString(bytes)`**: Returns human-readable text (e.g., `"100 700 rmoveto 300 0 rlineto endchar"`)
- **`interpretAllCharStrings(charStrings, localSubrs, globalSubrs)`**: Batch convenience — interprets all charstrings in an array
- **Operators handled**: rmoveto, hmoveto, vmoveto, rlineto, hlineto, vlineto, rrcurveto, hhcurveto, vvcurveto, hvcurveto, vhcurveto, rcurveline, rlinecurve, flex, hflex, hflex1, flex1, endchar
- **Hint operators**: hstem, vstem, hstemhm, vstemhm handled (increment stem count). hintmask/cntrmask skip `ceil(stemCount/8)` mask bytes.
- **Subroutine calls**: callsubr/callgsubr with CFF bias calculation (`bias = len<1240 ? 107 : len<33900 ? 1131 : 32768`), return operator support
- **Width detection**: Handles optional width operand on first drawing/hint operator
- **Integration**: `simplify.js` calls `interpretAllCharStrings` during `buildSimplified()`, so CFF glyphs in simplified output automatically include:
  - `contours` — decoded cubic Bézier commands
  - `charString` — raw byte array (for lossless round-trip)
  - `charStringDisassembly` — human-readable text
- **Bug fixes during development**:
  - hintmask byte count: Was double-incrementing `i` in the mask byte loop. Fixed to use `i + m` offset without also incrementing `i`.
  - hmoveto/vmoveto width detection: Fixed to use `stack.length > 1` (not odd-count check) for single-argument move operators.
- Tests: 10 in charstring_interpreter.test.js (synthetic charstrings + real oblegg.otf integration)

### SVG Path Conversion (`src/svg_path.js`)

- **Purpose**: Bidirectional conversion between font glyph contour data and SVG path `d` attribute strings
- **`contoursToSVGPath(contours)`**: Auto-detects TrueType vs CFF format (checks for `type` property on first point). Returns SVG `d` string.
  - TrueType → SVG with `Q` (quadratic) commands, handles implied midpoints between consecutive off-curve points
  - CFF → SVG with `C` (cubic) commands
  - Coordinates in font-space (Y-up), not flipped to SVG Y-down
- **`svgPathToContours(pathData, format='cff')`**: Parses SVG path `d` string → contours in target format
  - `'cff'` → cubic command objects `{type, x, y, ...}`. Q commands promoted to C via degree elevation (lossless).
  - `'truetype'` → point arrays `{x, y, onCurve}`. C commands approximated as quadratic via recursive de Casteljau subdivision (0.5-unit error threshold, max depth 8).
- **SVG path parser (`parseSVGPath`)**: Full SVG path spec — M, L, H, V, C, S, Q, T, Z + all lowercase relative variants. Handles smooth curve reflection (S reflects previous CP2, T reflects previous QCP).
- **Degree elevation (Q→C)**: `CP1 = P0 + 2/3*(QCP-P0)`, `CP2 = P2 + 2/3*(QCP-P2)` — mathematically lossless
- **Cubic→quadratic approximation**: Tries single-quadratic midpoint approximation first. If error > 0.5 units, subdivides at t=0.5 via de Casteljau and recurses (max depth 8).
- **Number formatting**: `n(val)` rounds to 2 decimal places, strips trailing zeros for clean SVG output
- Tests: 19 in svg_path.test.js (unit conversion, round-trips CFF+TTF, relative commands, smooth curves, H/V, real font integration with oblegg.otf and oblegg.ttf)

### Documentation Site

- **VitePress docs**: `docs/` folder, built with `npm run docs:build` (VitePress v1.6.4)
- **Demo app**: `demo/` folder, vanilla JS + Vite, built with `npm run demo:build`
- **Combined build**: `npm run site:build` = demo:build + docs:build
- **NPM published**: v1.0.0 on npm as `font-flux`
- **Doc coverage for new features**:
  - `docs/index.md` — API table includes all 10 exported functions; "Working with glyph outlines" section covers TTF format, CFF contour interpretation, and SVG path conversion with code examples
  - `docs/tables/CFF.md` — "Interpreting charStrings" section with `interpretCharString` and `disassembleCharString` usage; "Converting to/from SVG paths" section
  - `docs/tables/CFF2.md` — Same CFF2-specific treatment
  - `docs/tables/glyf.md` — "TrueType contour format" section documenting `{x, y, onCurve}` points, implied midpoints, quadratic curve mechanics, SVG conversion
  - `docs/creating-otf.md` — "Working with CFF outlines" section: reading contours, charstring disassembly, editing via SVG round-trip
  - `docs/creating-ttf.md` — "Working with TrueType outlines" section: reading quadratic contours, editing via SVG round-trip

### Important Notes for Future Tables

- **OS/2 table**: DONE. Referred to as "OS-2" in filenames (`table_OS-2.js`) but the actual table tag in the font binary is `OS/2` — the registry key must be `'OS/2'`
- **Table name case**: Always honor the original case from the spec (e.g., `cmap` lowercase, `OS/2` mixed)
- **head table**: Contains `checkSumAdjustment` field (global font checksum); during write, this may need special handling
- **hmtx table**: DONE. Uses cross-table deps (hhea.numberOfHMetrics, maxp.numGlyphs). Parser receives `tables` as second argument.
- **name table**: DONE. Has platform-specific string encodings (UTF-16BE for platforms 0/3, MacRoman for platform 1 encoding 0). Hex-escape fallback for unknown encodings.
- **export.js refactor**: Still uses raw ArrayBuffer/DataView for the font header and table directory writing. Could be converted to DataWriter but works fine as-is.

## Testing Strategy

- **Round-trip tests** (`test/roundtrip.test.js`) are the primary correctness check: import → export → reimport must produce identical JSON
- **Table-specific tests** use `importFontTables()` (not `importFont()`) to access the internal `{ header, tables }` shape directly
- Primary test fonts: `oblegg.otf` (CFF-based, sfVersion=OTTO) and `oblegg.ttf` (TrueType outlines, sfVersion=0x00010000)
- Currently 414 tests total, all passing

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
11. **CFF table tag has trailing space**: The binary tag is `'CFF '` (4 bytes, with trailing space). The registry key in import.js/export.js must be `'CFF '`. CFF2 tag is `'CFF2'` (no space).
12. **CFF DICT offset encoding**: Writers use forced 5-byte int32 encoding for all offset-bearing operators (charset, Encoding, CharStrings, Private, FDArray, FDSelect, Subrs). This makes Top DICT byte size deterministic and avoids needing multi-pass offset resolution.
13. **CFF Private DICT Subrs offset is relative**: The Subrs offset in Private DICT is relative to the start of the Private DICT, not to the start of the CFF data. Local Subr INDEX must be positioned accordingly.
14. **CFF INDEX v1 vs v2**: CFF v1 INDEX uses uint16 count (empty = 2 bytes). CFF2 INDEX uses uint32 count (empty = 4 bytes). Offsets are 1-based in both.
15. **CFF does not use DataReader/DataWriter**: CFF has its own number encoding scheme that doesn't map to OpenType's standard data types. The CFF parser works directly on byte arrays using the utilities in `cff_common.js`.
16. **loca offsets stripped from JSON**: `import.js` deletes `tables.loca.offsets` after glyf parsing. loca offsets are binary-layout artifacts that change when glyf is re-encoded (e.g., more compact flag packing). During export, `coordinateTableWrites()` regenerates them from `writeGlyfComputeOffsets()`.
17. **glyf ↔ loca export coordination**: `export.js` has a `coordinateTableWrites()` function that pre-computes glyf bytes and derived loca bytes before the main write loop. It uses a `Map<tag, number[]>` of pre-computed bytes, checked first in the table processing loop. Does NOT mutate input data.
18. **glyf flag packing may differ from original**: Our writer uses optimal REPEAT_FLAG compression and short/same coordinate encoding. Original fonts may not be optimally packed, so the re-encoded glyf may be slightly smaller. This is why loca offsets can't be preserved as-is.
19. **Composite glyph argument sizing**: Writer re-evaluates `ARG_1_AND_2_ARE_WORDS` based on actual argument values via `needsWordArgs()`. If the original font used word-size args unnecessarily, the writer may switch to byte-size, changing the binary layout.
20. **OpenType Layout data shapes are wrapped objects**: `parseLookupList` returns `{ lookups: [...] }`, `parseScriptList` returns `{ scriptRecords: [...] }`, `parseFeatureList` returns `{ featureRecords: [...] }`. Access via `.lookups`, `.scriptRecords`, `.featureRecords` — NOT as bare arrays.
21. **Extension Lookup transparency**: The parser auto-unwraps Extension Lookups (GSUB type 7, GPOS type 9). The JSON data stores the inner lookup type directly, not the Extension wrapper. The writer auto-wraps in Extension headers when the LookupList exceeds 64KB (Offset16 limit). This means the JSON never contains Extension metadata (`format`, `extensionLookupType`, `extensionOffset`) — those are pure binary-level concerns.
22. **LookupList Offset16 overflow**: Large fonts (e.g., fira.ttf GPOS with 12 lookups including 17–45KB MarkBasePos subtables) can exceed the 64KB Offset16 limit. The writer detects this and falls back to Extension wrapping: compact 8-byte Extension headers for each subtable, with the actual subtable data placed in a deferred pool accessed via Offset32. ALL Lookups are wrapped when overflow occurs (not just the large ones).
23. **markFilteringSet flag**: The `useMarkFilteringSet` flag in Lookup tables is bit 0x0010 (not a separate field). When set, a `markFilteringSet` uint16 follows the subtable offset array. The writer checks `markFilteringSet !== undefined` to decide whether to emit it.
24. **GPOS ValueRecord variable size**: A GPOS ValueRecord's byte count depends on the `valueFormat` bitfield (up to 8 fields × 2 bytes). The parser reads only the fields indicated by set bits. `valueFormatSize(vf)` uses bit-counting (popcount) to compute byte size without branching.
25. **GDEF ItemVariationStore as raw bytes**: Stored as `itemVarStoreRaw` (byte array) rather than a fully parsed structure. This is consistent with CFF2's treatment of VariationStore. Full parsing can be added later.
26. **OpenType Layout write pattern**: All layout writers use bottom-up serialization. Example: to write a ScriptList, first serialize each LangSys → then each Script (with offsets to LangSys) → then the ScriptList header (with offsets to Scripts). Child sizes must be known before parent offsets can be computed.
27. **cvt tag has trailing space**: The binary tag is `'cvt '` (4 bytes, with trailing space). The registry key in import.js/export.js must be `'cvt '`. Same pattern as `'CFF '`.
28. **fpgm and prep are identical in structure**: Both are just `{ instructions: uint8[] }`. They differ only in when the rasterizer executes them (fpgm: once at font load; prep: on every size/transform change).
29. **gasp is technically not TTF-only**: The spec says gasp can appear in any font, but in practice it only occurs in TTF fonts (TrueType outlines). We place it in `src/ttf/` since it's part of the TTF hinting ecosystem.
30. **vhea version field differs from hhea**: hhea stores version as two separate uint16 fields (`majorVersion`, `minorVersion`), but vhea uses a single Version16Dot16 uint32 field. v1.0 = `0x00010000`, v1.1 = `0x00011000`.
31. **vmtx mirrors hmtx exactly**: Same structure — array of {advanceHeight, topSideBearing} records followed by extra topSideBearing array. Uses `vhea.numOfLongVerMetrics` instead of `hhea.numberOfHMetrics`. Both live in `src/sfnt/` (shared tables).
32. **SVG tag has trailing space**: The binary tag is `'SVG '` (4 bytes, with trailing space). Same pattern as `'CFF '` and `'cvt '`.
33. **CPAL ColorRecord is BGRA, not RGBA**: The spec defines color records as blue, green, red, alpha (uint8 each). Don't confuse with the more common RGBA order.
34. **COLR v1 fully parsed**: v1 has 32 Paint formats forming a complex DAG. Parsed via `src/sfnt/colr_paint.js` using parse cache (Map<offset, node>) for DAG sharing and topological sort writer for forward offsets. v0 is also fully parsed.
35. **SVG documents can be gzip-compressed**: Check for gzip magic bytes (0x1F, 0x8B, 0x08) at start of document data. Compressed docs stored as byte arrays; plain text as strings via TextDecoder/TextEncoder.
36. **DataWriter method is `toArray()`, not `finish()`**: Easy to confuse. Always use `w.toArray()` to get the final byte array.
37. **Bitmap table scope (block 4)**: `CBLC/CBDT/EBLC/EBDT/EBSC/sbix` fully parse structured internals. CBLC/EBLC parse IndexSubTable formats 1-5; CBDT/EBDT parse glyph bitmap record formats 1/2/5/6/7/8/9/17/18/19; sbix parses per-glyph records (originOffsetX/Y, graphicType, imageData). Coordinated writes via `writeCBDTComputeOffsets` → offset info → `writeCBLC`. Shared metrics helpers in `src/sfnt/bitmap_common.js`.
38. **Bitmap table performance**: DataReader constructor converts number[] → Uint8Array. For large tables (megabytes), creating DataReader per-glyph or per-subtable causes massive allocations. ALWAYS create ONE DataReader per table and reuse via seek(). Also use rawBytes.slice() instead of reader.bytes() for bulk image data.
39. **Bitmap fixtures in sample fonts**: `NotoColorEmoji-online-test.ttf` (10.2MB CBLC/CBDT, 3985 glyphs), `noto-sbix-online-test.ttf` (8.9MB sbix), `msgothic-test.ttc` (8.6MB EBLC/EBDT, 146K glyph records across 3125 subtables), `cour-test.ttf` (bloc/bdat — Apple bitmap tables, 18 sizes), `cambria-test.ttc` (EBLC/EBDT).
40. **JSTF implementation scope**: `JSTF` is implemented at container level (version + JstfScript records with preserved raw script subtables). This keeps offsets stable and enables lossless round-trip without full Justification structure decoding yet.
41. **MATH implementation scope**: `MATH` is implemented at container level (version + offsets to MathConstants/MathGlyphInfo/MathVariants, each preserved as raw bytes). This provides safe round-trip while deferring deep parsing of math constants and glyph assemblies.
42. **DSIG implementation scope**: `DSIG` parses header/signature records (`format`, `length`, `offset`) and preserves each signature block as `_raw` bytes. Writer rebuilds offsets from serialized block lengths.
43. **hdmx implementation scope**: `hdmx` parses per-device records (`pixelSize`, `maxWidth`, width array) and preserves record padding. If `maxp.numGlyphs` is available it is used to split widths vs padding; otherwise payload bytes are treated as widths.
44. **LTSH implementation scope**: `LTSH` is fully parsed (`version`, `numGlyphs`, `yPels[]`) and written directly with truncation/padding safeguards when explicit `numGlyphs` and `yPels.length` differ.
45. **MERG implementation scope**: `MERG` currently exposes a leading `version` field plus raw payload bytes (`data`) to keep round-trip fidelity while deferring deeper format semantics.
46. **meta implementation scope**: `meta` parses header fields and `DataMap` records (`tag`, `dataOffset`, `dataLength`) and preserves each metadata payload as byte arrays in `dataMaps[].data`; writer recomputes offsets from serialized payload order.
47. **PCLT implementation scope**: `PCLT` is implemented as a fixed-size structured table (54 bytes) with explicit numeric fields and fixed-length ASCII strings (`typeface`, `characterComplement`, `fileName`). Non-ASCII characters are replaced with `?` during write.
48. **VDMX implementation scope**: `VDMX` parses ratio records and deduplicated VDMX groups, mapping each ratio to a `groupIndex`. Writer serializes group blocks, computes offsets, and emits ratio-to-group mapping through the offset array.
49. **VORG implementation scope**: `VORG` is fully parsed/written as structured data (`majorVersion`, `minorVersion`, `defaultVertOriginY`, and per-glyph `vertOriginYMetrics`). Writer supports explicit `numVertOriginYMetrics` with safe truncation/padding behavior.
50. **GPOS PairPos fmt1 Device offset base nuance**: Some real fonts (e.g., `SegUIVar`) encode ValueRecord Device/VariationIndex offsets in PairPos format 1 relative to the **PairSet** start, not the parent PairPos subtable. Parsing uses the PairSet base for `parseValueRecord` in this path, and restores reader position after offset-jump parses to avoid corrupting sequential reads.
51. **Apple bloc/bdat tables**: Binary-identical to EBLC/EBDT (same as CBLC/CBDT). Delegate parsing/writing to CBLC/CBDT — same pattern as EBLC/EBDT delegation. In import.js, bdat maps `tables.bloc → CBLC` so parseCBDT can find index info. Coordinated writes and post-parse cleanup mirror the EBLC/EBDT pattern exactly.
52. **ltag table**: Apple language tag table — maps numeric codes to IETF BCP 47 tags. Simple structure: version(UInt32) + flags(UInt32) + numTags(UInt32) + tagRange[numTags]{offset(UInt16), length(UInt16)} + UTF-8 strings. Standalone parser/writer in `src/sfnt/table_ltag.js`.
53. **JSON serialization** (`src/json.js`): `fontToJSON(fontData, indent?)` serializes font data to a JSON string, converting BigInt LONGDATETIME values to numbers, converting TypedArrays (e.g. `_raw` Uint8Array) to plain arrays, and stripping known transient top-level keys (`_dirty`, `_fileName`, `_originalBuffer`, `_collection`, `_collectionFonts`, `_woff`). `_header` is preserved because `exportFont` needs it for lossless re-export (without it, the export falls through to `buildRawFromSimplified` which has limitations). Table-level `_raw` and `_checksum` are also preserved. `fontFromJSON(jsonString)` deserializes back. The writer's `longDateTime()` method already accepts both BigInt and number via `BigInt(value)`, so deserialized numbers work without conversion. Both functions are exported from `src/main.js`.
54. **Validator three-level severity** (`src/validate/validateJSON.js`): The validator now uses three severity levels — `error`, `warning`, and `info`. Auto-fixable issues (missing/wrong header, directory field mismatches, numTables mismatches, collection numFonts mismatches) are corrected in-place on the input object and reported as `info`. The report object includes `infos` array and `summary.infoCount` in addition to errors/warnings. `validateHeader` now receives the full `fontData` (not just `header`) so it can synthesize a header from `_header` or from table data. Unknown tables with `_raw` are reported as `TABLE_UNRECOGNIZED_RAW` (info) rather than being silently ignored. Complete issue reference in `docs/guide/validation.md`.

### Demo App — UI Polish (March 2026)

**Info page card redesign** (`demo/src/tabs/info.js`, CSS lines ~267+):

- Replaced flat layout with card-based design: hero card (logo + tagline + description + version), three link cards in a responsive grid (Documentation/NPM/GitHub with inline SVG icons), and a family card (Glyphr Studio, GitHub issues, email).
- npm icon: uses the clean square-with-"n" single-path SVG (`M0 0v24h24V0H0zm19.2 19.2h-2.4V7.2h-4.8v12H4.8V4.8h14.4v14.4z`).
- Responsive: grid collapses to single column below 520px.

**Subset tab redesign** (`demo/src/tabs/subset.js`, CSS `.subset-*`):

- **Inverted selection model**: Nothing checked by default. Check ranges to mark for removal. Button says "Remove Checked Ranges" (was "Remove Unchecked Glyphs").
- **Filter bar**: Moved below the summary bar. Input is ~25% width (max 300px), not full-width.
- **Toggle button**: Single "Toggle Selection" text button (light gray, swap icon) replaces the two ugly "Check All" / "Uncheck All" buttons.
- **Count buttons**: Each range's glyph count is a clickable `<button>` that selects that range in the Range Preview dropdown and scrolls to preview. Styled in accent color with border reveal on hover.
- **Range Preview section**: Below the block list. `<select>` dropdown to pick a populated block → glyph grid showing characters rendered in the loaded font (`DemoLoadedFont` @font-face) + hex code point. Paged at 1000 glyphs/page with Prev/Next controls.

**Collection font chooser** (`demo/src/main.js`):

- On collection load (TTC/OTC), every font in `_collectionFonts` is tagged with `_collection`, `_collectionFonts`, `_collectionIndex`, `_fileName`, `_originalBuffer`, `_dirty`.
- A `<select class="font-chooser">` dropdown appears in the header only for multi-font collections.
- Changing the dropdown calls `showApp(collectionFonts[idx])` — full app re-render. All fonts live in memory by reference, so edits persist across switches.
- Export/JSON download currently operates on the single displayed font. Full collection re-export (TTC/OTC) not yet supported from the demo UI.

**Preview tab paging** (`demo/src/tabs/preview.js`):

- Glyph Outlines grid now pages at 100 glyphs per page (was all 1000 at once).
- Prev/Next paging controls below the grid (`.glyph-paging`, `.glyph-page-btn`, `.glyph-page-info`).
- Page change scrolls to grid top.

**Branding updates**:

- Favicon: `font-flux-js-favicon.svg` (112×112, rounded rect with teal 'f') added to `docs/public/` and `demo/src/assets/`. Referenced in VitePress config `head` and `demo/index.html`.
- Logo in README: centered at 400px width above the title.
- Tagline: "Convert fonts to JSON, make edits, then convert them back!" (updated in README, package.json, loading.js, info.js).

## Two-Scenario Architecture Analysis (April 2026)

> Full design document: `reference/two-scenario-architecture.md`

### CRITICAL BUG: resolveExportSource() Ignores Simplified Edits

**The problem**: When `_header` is present (i.e., font was imported), `resolveExportSource()` returns stored `tables` directly, **silently discarding any user edits** to `font.*`, `glyphs[]`, `kerning[]`, etc. This breaks Scenario 1 editing completely.

**Code path** (export.js):

```javascript
if (fontData._header && fontData.tables) {
	return { header: fontData._header, tables: fontData.tables };
	// ↑ simplified fields are completely ignored
}
```

**Proposed fix**: Hybrid reconciliation — when both `_header`/`tables` AND `font`/`glyphs` are present:

1. Rebuild DECOMPOSED_TABLES from simplified fields (honoring user edits)
2. Preserve non-decomposed tables from stored `tables` (COLR, gvar, GSUB internal structure, etc.)
3. Result: "edit what you can see, preserve what you can't"

### DECOMPOSED_TABLES Coverage Map

Tables in `DECOMPOSED_TABLES` (simplify.js line ~24) that get extracted into simplified fields:

```
head, hhea, hmtx, vmtx, name, OS/2, post, maxp, cmap, glyf, loca, CFF, kern, fvar,
GPOS, GSUB, GDEF, gasp, cvt, fpgm, prep
```

Builder coverage in expand.js:

| Simplified Field                           | Builder(s)                                                                               | Status                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `font.*` → head/hhea/name/OS-2/post        | buildHeadTable, buildHheaTable, buildNameTable, buildOS2Table, buildPostTable            | ✅ Complete                                              |
| `glyphs[]` → glyf/CFF/hmtx/cmap/post/loca  | buildGlyfTable/buildCFFShell, buildHmtxTable, buildCmapTable, buildPostTable, loca coord | ✅ Complete                                              |
| `glyphs[]` → vmtx/vhea                     | _(no builder)_                                                                           | ❌ **GAP**: vmtx is decomposed on import but not rebuilt |
| `kerning[]` → kern/GPOS                    | buildKernTableForFormat, buildGPOSFromKerning, mergeKerningIntoGPOS                      | ✅ Complete                                              |
| `features.GPOS/GSUB/GDEF` → GPOS/GSUB/GDEF | Passthrough from features object (no rebuild)                                            | ⚠️ Passthrough only                                      |
| `axes[]`/`instances[]` → fvar              | buildFvarTable                                                                           | ✅ Complete                                              |
| `gasp[]` → gasp                            | Direct rebuild                                                                           | ✅ Complete                                              |
| `cvt[]`/`fpgm[]`/`prep[]` → cvt/fpgm/prep  | Direct rebuild                                                                           | ✅ Complete                                              |
| — → maxp                                   | buildMaxpTable                                                                           | ✅ Complete                                              |

### Non-Decomposed Tables (passthrough only)

These have parsers/writers but no simplified representation. They survive in Scenario 1 (in `tables`) but are lost if `_header` is stripped:

- **Variable font deltas**: avar, gvar, STAT, MVAR, HVAR, VVAR, cvar
- **Color / bitmap**: COLR, CPAL, CBDT, CBLC, EBDT, EBLC, EBSC, sbix, SVG
- **Advanced typography**: BASE, JSTF, MATH
- **Hinting optimization**: hdmx, LTSH, VDMX
- **Vertical header**: vhea
- **Other**: DSIG, MERG, meta, PCLT, VORG, ltag, CFF2

### Convenience Function Inventory

Currently exported from main.js:

- `createGlyph(options)` — Multi-format glyph builder (SVG path, contours, charstring, components)
- `getGlyph(font, id)` — Lookup by name/unicode/hex
- `createKerning(input)` — 5 input formats including class-based
- `getKerningValue(font, left, right)` — Kerning pair lookup
- `svgPathToContours()` / `contoursToSVGPath()` — SVG path ↔ contour conversion
- `compileCharString()` / `assembleCharString()` — CFF contour/text → bytecode
- `interpretCharString()` / `disassembleCharString()` — CFF bytecode → contour/text
- `validateJSON()` — Validation + auto-fix
- `fontToJSON()` / `fontFromJSON()` — JSON serialization

Proposed new convenience functions (see full design in `reference/two-scenario-architecture.md`):

1. `createFont(options)` — Starter template with .notdef + space
2. `addGlyph(font, glyph)` / `removeGlyph(font, id)` — Array mutators with ordering
3. `addKerning(font, pairs)` / `removeKerning(font, left, right)` — Deduplicating mutators
4. `detachFromOriginal(font)` — Strip \_header/tables for Scenario 1→2 transition
5. `subsetFont(font, options)` — Glyph subsetting by unicode/name/range

### Edge Cases for Reconciliation

- **gvar invalidation**: Editing glyph contours on a variable font makes stored gvar deltas reference wrong point positions. Need to decide: warn, strip gvar, or ignore.
- **GSUB/GDEF passthrough**: These are in DECOMPOSED_TABLES but have no builder. During hybrid reconciliation, should carry forward from `features{}` or stored `tables`.
- **CFF2 authoring**: No builder exists. Only CFF v1 has `buildCFFShell()`. CFF2 fonts can only round-trip via passthrough.
