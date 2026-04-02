# Two-Scenario Architecture: Analysis & Plan

> Brainstorming analysis from April 2026. Identifies the two core use cases of Font Flux JS,
> a critical reconciliation gap, missing convenience functions, and a plan to address both.

---

## The Two Scenarios

### Scenario 1 — Load, Edit, Save

A user loads an existing font, makes small targeted changes to the JSON (rename the family,
adjust a glyph outline, tweak kerning), and saves out a new font file.

**Key requirement**: Minimal changes to parts of the font not explicitly edited. The exported
binary should preserve ALL tables the user didn't touch — including complex structures like
GSUB substitution rules, COLR color layers, variable font deltas, bitmap data, etc.

### Scenario 2 — Author from Scratch

A font editor or person constructs JSON by hand using convenience functions and exports
it as a real font file.

**Key requirement**: Ease of use. The user should only need to specify what matters (family name,
glyphs, metrics, kerning) and the library generates all required binary tables automatically.

### The Bridge (Scenario 1 → 2)

A user starts in Scenario 1 making small edits, discovers the power of the convenience API,
and gradually takes over more authorship. The library should support this seamlessly — edits
via simplified fields and edits via convenience functions should both be honored.

---

## Critical Finding: Scenario 1 Editing is Silently Broken

### The Problem

`resolveExportSource()` in `src/export.js` has this logic:

```javascript
// Imported simplified: has _header and original tables for lossless round-trip
if (fontData._header && fontData.tables) {
	return { header: fontData._header, tables: fontData.tables };
}

// Hand-authored simplified — has font + glyphs but no _header
if (fontData.font && fontData.glyphs) {
	return buildRawFromSimplified(fontData);
}
```

When a user imports a font (which always has `_header`), **the stored `tables` are returned
unchanged regardless of any edits to simplified fields.** Changing `font.familyName`,
editing `glyphs[5].contours`, or adding kerning pairs — all silently discarded on export.

### Why This Matters

The unified simplified object returned by `importFont()` looks editable:

```javascript
const font = importFont(buffer);
font.font.familyName = 'New Name'; // ← silently ignored on export
font.glyphs[5].contours = newContours; // ← silently ignored on export
font.kerning.push({ left: 'A', right: 'V', value: -80 }); // ← silently ignored
```

No error, no warning. The user thinks they changed the font but the export is identical
to the original.

### Current Workarounds (Both Inadequate)

1. **Delete `_header`** to force `buildRawFromSimplified()` — but this **loses all non-decomposed
   tables**: COLR, CPAL, CBDT, CBLC, SVG, sbix, gvar, avar, STAT, MVAR, HVAR, VVAR, cvar,
   BASE, JSTF, MATH, GSUB (structure), GDEF, hdmx, LTSH, VDMX, PCLT, DSIG, MERG, etc.

2. **Edit `tables.*` directly** at the parsed-table level — defeats the purpose of simplified
   fields and requires deep knowledge of binary table structures.

---

## Proposed Fix: Hybrid Reconciliation in resolveExportSource()

When `_header`/`tables` AND `font`/`glyphs` are both present:

1. **Rebuild decomposed tables** (head, hhea, hmtx, vmtx, name, OS/2, post, maxp, cmap,
   glyf/CFF, loca, kern/GPOS, fvar, gasp, cvt, fpgm, prep) **from simplified fields** —
   honoring user edits.

2. **Preserve all non-decomposed tables** from stored `tables` (COLR, CPAL, CBDT, SVG, gvar,
   avar, STAT, etc.) — the user didn't touch these, they round-trip losslessly.

3. **Pass through** `features.GSUB` and `features.GDEF` from simplified (no builders exist yet).

Conceptual implementation:

```javascript
if (fontData._header && fontData.tables && fontData.font && fontData.glyphs) {
	// Hybrid: rebuild decomposed tables from simplified, preserve everything else
	const rebuilt = buildRawFromSimplified(fontData);
	for (const [tag, data] of Object.entries(fontData.tables)) {
		if (!DECOMPOSED_TABLES.has(tag) && !rebuilt.tables[tag]) {
			rebuilt.tables[tag] = data;
		}
	}
	return rebuilt;
}
// Pure lossless passthrough (no simplified fields, or API-level raw usage)
if (fontData._header && fontData.tables) {
	return { header: fontData._header, tables: fontData.tables };
}
```

This gives **"edit what you can see, preserve what you can't"**.

### Edge Cases to Handle

- **GSUB/GDEF**: In `DECOMPOSED_TABLES` but only passed through in `features{}`, not rebuilt.
  Should carry forward from stored tables when `features.GSUB`/`features.GDEF` exist.

- **gvar invalidation**: If a user edits glyph contours on a variable font, the stored `gvar`
  deltas become invalid (they refer to the original point positions). Options:
  - Warn the user
  - Strip gvar when glyph edits are detected
  - Leave it (advanced users might know what they're doing)

- **Backward compatibility**: The pure lossless path (`_header` + `tables`, no simplified edits)
  should still work for callers who use `importFontTables()` or construct raw objects manually.

---

## Convenience Function Inventory

### Currently Available

| Function                             | Module                    | Purpose                                                                 |
| ------------------------------------ | ------------------------- | ----------------------------------------------------------------------- |
| `createGlyph(options)`               | glyph.js                  | Multi-format glyph builder (SVG path, contours, charstring, components) |
| `getGlyph(font, id)`                 | glyph.js                  | Lookup by name, unicode, or hex string                                  |
| `createKerning(input)`               | kerning.js                | 5 input formats including class-based                                   |
| `getKerningValue(font, left, right)` | kerning.js                | Lookup by name or code point                                            |
| `svgPathToContours(d, format)`       | svg_path.js               | SVG path → font contours (CFF or TrueType)                              |
| `contoursToSVGPath(contours)`        | svg_path.js               | Font contours → SVG path string                                         |
| `compileCharString(contours)`        | charstring_compiler.js    | CFF contours → Type 2 bytecode                                          |
| `assembleCharString(text)`           | charstring_compiler.js    | Assembly text → Type 2 bytecode                                         |
| `interpretCharString(...)`           | charstring_interpreter.js | Type 2 bytecode → CFF contours                                          |
| `disassembleCharString(bytes)`       | charstring_interpreter.js | Type 2 bytecode → assembly text                                         |
| `buildSimplified(raw)`               | simplify.js               | Raw tables → simplified object                                          |
| `buildRawFromSimplified(simplified)` | expand.js                 | Simplified → raw tables                                                 |
| `validateJSON(fontData)`             | validate/                 | Validation + auto-fix                                                   |
| `fontToJSON(data, indent)`           | json.js                   | Serialize with BigInt/TypedArray handling                               |
| `fontFromJSON(jsonString)`           | json.js                   | Deserialize JSON → font object                                          |
| `initWoff2()`                        | woff/woff2.js             | Async Brotli initialization                                             |

### Missing — Proposed New Functions (Priority Order)

#### 1. `createFont(options)` — Font Starter Template

**Why**: Currently users must construct the entire `{ font: {...}, glyphs: [...] }` structure
by hand, getting all required fields right. A convenience function reduces this to the essentials.

```javascript
const font = createFont({
	family: 'My Font',
	style: 'Regular', // default: 'Regular'
	unitsPerEm: 1000, // default: 1000
	ascender: 800, // default: 800
	descender: -200, // default: -200
});
// Returns: { font: {...}, glyphs: [.notdef, space] }
// Ready for addGlyph() calls and immediate export
```

#### 2. `addGlyph(font, glyphOrOptions)` / `removeGlyph(font, id)`

**Why**: Manual `font.glyphs.push(...)` doesn't handle ordering, deduplication, or cleanup.
These mutators would insert at the correct position and handle edge cases.

```javascript
addGlyph(
	font,
	createGlyph({ name: 'A', unicode: 65, advanceWidth: 600, path: '...' }),
);
addGlyph(font, { name: 'B', unicode: 66, advanceWidth: 650, path: '...' }); // auto-wraps in createGlyph
removeGlyph(font, 'A'); // by name
removeGlyph(font, 65); // by unicode
removeGlyph(font, 'U+0041'); // by hex string
```

#### 3. `addKerning(font, pairs)` / `removeKerning(font, left, right)`

**Why**: Manual `font.kerning.push(...)` doesn't handle deduplication (last-write-wins).

```javascript
addKerning(font, { left: 'A', right: 'V', value: -80 });
addKerning(font, createKerning({ groups: { A: { V: -80, W: -60 } } }));
removeKerning(font, 'A', 'V');
```

#### 4. `detachFromOriginal(font)` — Explicit Scenario Transition

**Why**: Sometimes a user wants to fully take over a font's data, stripping stored tables
and working purely from simplified fields. This makes it explicit and intentional.

```javascript
const clean = detachFromOriginal(font);
// Returns: { font, glyphs, kerning, axes, instances, features, gasp, cvt, fpgm, prep }
// No _header, no tables — purely hand-authored shape
// Warning: non-decomposed tables (COLR, gvar, GSUB structure, etc.) are lost
```

#### 5. `subsetFont(font, options)` — Glyph Subsetting

**Why**: Common operation for web fonts, icon fonts, etc. The demo already has subset UI logic.

```javascript
subsetFont(font, { unicodes: [0x20, 0x41, 0x42, ...] });
subsetFont(font, { glyphs: ['A', 'B', 'space', '.notdef'] });
subsetFont(font, { unicodeRanges: [[0x0020, 0x007F]] });  // Basic Latin
// Adjusts: glyphs array, cmap, kerning, GSUB/GPOS glyph references, etc.
```

#### 6. GSUB Convenience Helpers (Future)

```javascript
createLigature(font, ['f', 'i'], 'fi');
createAlternate(font, 'A', ['A.swash', 'A.small']);
```

These would require a GSUB builder that doesn't exist yet.

---

## Table Decomposition Coverage

### Fully Decomposed (simplified ↔ raw round-trip via builders)

These tables are extracted into simplified fields on import AND rebuilt from simplified
fields on export via `buildRawFromSimplified()`:

| Simplified Field                        | Tables Consumed                  | Builder in expand.js                                                          |
| --------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------- |
| `font.*`                                | head, hhea, name, OS/2, post     | buildHeadTable, buildHheaTable, buildNameTable, buildOS2Table, buildPostTable |
| `glyphs[]`                              | glyf/CFF, hmtx, cmap, post, loca | buildGlyfTable/buildCFFShell, buildHmtxTable, buildCmapTable                  |
| `glyphs[].advanceHeight/topSideBearing` | vmtx                             | _(vmtx in DECOMPOSED_TABLES but no builder — gap?)_                           |
| `kerning[]`                             | kern, GPOS (kerning only)        | buildKernTableForFormat, buildGPOSFromKerning, mergeKerningIntoGPOS           |
| `features.GPOS/GSUB/GDEF`               | GPOS, GSUB, GDEF                 | Passthrough only (no rebuild)                                                 |
| `axes[]`, `instances[]`                 | fvar                             | buildFvarTable                                                                |
| `gasp[]`                                | gasp                             | Direct gasp range rebuild                                                     |
| `cvt[]`, `fpgm[]`, `prep[]`             | cvt, fpgm, prep                  | Direct value/instruction rebuild                                              |
| —                                       | maxp                             | buildMaxpTable (computed from glyphs)                                         |

### Not Decomposed (passthrough only — preserved in Scenario 1, lost in Scenario 2)

These tables have parsers and writers but no simplified representation. They survive in
Scenario 1 (stored in `tables`) but are lost if the user deletes `_header`/`tables`:

| Category              | Tables                                              |
| --------------------- | --------------------------------------------------- |
| Variable font deltas  | avar, gvar, STAT, MVAR, HVAR, VVAR, cvar            |
| Color / bitmap glyphs | COLR, CPAL, CBDT, CBLC, EBDT, EBLC, EBSC, sbix, SVG |
| Advanced typography   | BASE, JSTF, MATH                                    |
| Hinting optimization  | hdmx, LTSH, VDMX                                    |
| Vertical header       | vhea                                                |
| Other                 | DSIG, MERG, meta, PCLT, VORG, ltag, CFF2            |

Note: Many of these are acceptable as passthrough. The ones most likely to need simplified
decomposition in the future are **COLR/CPAL** (color font editing) and **variable font
tables** (editing axes/instances/deltas).

### Specific Gaps Found

1. **vmtx**: Listed in `DECOMPOSED_TABLES` and vertical metrics ARE extracted to
   `glyphs[].advanceHeight`/`topSideBearing` during simplify. But there's no `buildVmtxTable`
   or `buildVheaTable` in expand.js — vertical metrics are not rebuilt. If a user edits
   vertical metrics on simplified glyphs and exports without `_header`, vmtx/vhea are lost.

2. **GSUB/GDEF**: Listed in `DECOMPOSED_TABLES` but only passed through in `features{}`.
   On export via `buildRawFromSimplified()`, they come from `simplified.features.GSUB` /
   `simplified.features.GDEF` — which is the original parsed object, not a rebuilt table.
   This works but is semantically passthrough, not decomposition.

3. **CFF2**: Listed nowhere in expand.js. Hand-authored CFF2 fonts cannot be created from
   simplified fields. Only CFF v1 has a builder (`buildCFFShell`).

---

## Decision Points for Brainstorming

### 1. Reconciliation: Automatic vs. Explicit?

**Option A — Automatic** (recommended): `resolveExportSource()` always rebuilds decomposed
tables from simplified fields when both `_header` and `font`/`glyphs` are present. Pure
lossless passthrough only when no simplified fields exist.

- Pro: Best UX, no silent data loss
- Con: Might surprise users who relied on old lossless behavior for imported fonts
- Mitigation: The old behavior only activated on the `_header` path; the new behavior is strictly more correct

**Option B — Explicit**: Require `applyChanges(font)` call before export to sync simplified
fields back to stored tables.

- Pro: No surprise behavior changes
- Con: Easy to forget, leads to silent data loss (the exact problem we're trying to fix)

### 2. Variable Font Glyph Editing

If a user edits glyph contours on a variable font, stored gvar deltas become invalid.

- **Option A**: Warn but preserve (user might know what they're doing)
- **Option B**: Strip gvar/cvar when glyph edits detected (safe but lossy)
- **Option C**: Ignore for now, document the caveat

### 3. GSUB Builder Priority

Ligatures and alternates are the most commonly hand-authored GSUB features. A simplified
representation (e.g., `ligatures: [{ sequence: ['f', 'i'], replacement: 'fi' }]`) would
be valuable for Scenario 2 but is a significant implementation effort.

### 4. Convenience Function Scope

What's the minimum set that makes Scenario 2 feel complete?

- `createFont` + `addGlyph` + `addKerning` covers basic font creation
- `subsetFont` covers the most common post-import operation
- `detachFromOriginal` bridges the two scenarios explicitly

---

## Verification Plan

Once the reconciliation layer is implemented:

1. **Test**: import → edit `font.familyName` → export → reimport → verify name changed
2. **Test**: import → add glyph via `createGlyph()` → export → reimport → verify glyph present
3. **Test**: import → edit kerning → export → reimport → verify kerning updated
4. **Test**: import → export with no edits → binary identical to original (lossless fast path)
5. **Test**: `detachFromOriginal()` → export → reimport → verify required tables present
6. **Test**: import variable font → edit glyph → export → verify non-decomposed tables preserved
7. All existing double-roundtrip tests must continue passing
