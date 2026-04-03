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

---

## Font Object API Vision (April 2 Brainstorm)

### The Core Question

The current API is a bag of standalone functions operating on plain objects:

```javascript
const data = importFont(buffer);
data.font.familyName = 'New Name';       // direct property mutation
const g = getGlyph(data, 'A');           // standalone function, pass font as arg
addGlyph(data, createGlyph({...}));      // standalone function, pass font as arg
const buf = exportFont(data);            // standalone function
```

This has problems:

- No encapsulation — nothing prevents invalid mutations
- No coordination — the reconciliation gap exists because nothing tracks what changed
- No discoverability — users must know which standalone functions exist
- Multi-font workflows are awkward — every call needs the font data passed explicitly

### The Proposal: A `FontFlux` Object

Wrap font data in an object that **owns** the data and provides methods:

```javascript
// Scenario 2: Create from scratch
const font = FontFlux.create({ family: 'My Font', style: 'Regular' });

// Scenario 1: Load existing
const font = FontFlux.open(buffer);

// Both scenarios: same API from here
font.getInfo(); // → { familyName, styleName, ... }
font.setInfo({ familyName: 'New Name', weightClass: 700 });

font.getGlyph('A'); // → glyph object
font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 600, path: '...' });
font.removeGlyph('A');

font.getKerning('A', 'V'); // → -80
font.addKerning({ left: 'A', right: 'V', value: -80 });
font.removeKerning('A', 'V');

font.export({ format: 'ttf' }); // → ArrayBuffer
font.toJSON(); // → string
font.validate(); // → { valid, errors, warnings }
```

### Thin Wrapper vs. Full Encapsulation — Tradeoffs

**Option A — Thin wrapper**: The `FontFlux` object holds `.data` (the plain simplified
object) and methods are sugar on top. Users can still reach in and read/edit `.data`
directly if they want to.

```javascript
const font = FontFlux.open(buffer);
font.data.font.familyName; // ← direct access still works
font.data.glyphs[5].contours; // ← can read/edit raw data
font.setInfo({ familyName: 'New' }); // ← or use methods
```

- **Pro**: Low friction. Power users can poke internals. Easy migration from current API.
  Existing code that uses the plain object shape still works — just wrap it.
- **Pro**: JSON serialization is trivial — `fontToJSON(font.data)` still works.
- **Con**: No change tracking. Methods can't know if the user also mutated `.data` directly.
  The reconciliation problem isn't fully solved — it's just better-documented.
- **Con**: Nothing prevents invalid states (e.g., duplicate unicode mappings, orphaned kerning).

**Option B — Full encapsulation**: Data is private. All access through getters/setters.
The object tracks what changed internally.

```javascript
const font = FontFlux.open(buffer);
font.getInfo().familyName; // ← getter returns a copy/view
font.setInfo({ familyName: 'New' }); // ← setter marks font info as dirty
font.getGlyphs(); // ← returns copies or read-only views
```

- **Pro**: Change tracking is reliable. Export knows exactly what was modified.
  Can rebuild only dirty tables (optimal for Scenario 1 preservation).
- **Pro**: Validation can happen on every mutation if desired.
- **Con**: Higher friction. Users can't just read `font.glyphs[5].contours`.
  Every access requires a method call. Feels heavy for a JS library.
- **Con**: JSON round-trip is harder — need custom serialization for the opaque object.
- **Con**: Returns copies — modifying a returned glyph object doesn't automatically update
  the font. Users must call `font.setGlyph(name, modifiedGlyph)` to commit.

**Option C — Hybrid (recommended)**: Data is readable directly (`.info`, `.glyphs`,
`.kerning`), but modifications should go through methods. Methods handle coordination
and can mark sections dirty, but direct reads are zero-friction.

```javascript
const font = FontFlux.open(buffer);

// Reading: direct access (zero friction, no copies)
font.info.familyName;                    // ← direct read
font.glyphs[5].contours;                // ← direct read
font.kerning;                            // ← direct read of array

// Writing: through methods (handles coordination)
font.setInfo({ familyName: 'New' });     // ← marks font info dirty
font.addGlyph({...});                    // ← handles ordering, marks glyphs dirty
font.removeGlyph('A');                   // ← cleans up kerning refs, marks dirty

// Export: automatic reconciliation using dirty tracking
font.export({ format: 'ttf' });          // ← rebuilds only dirty decomposed tables
```

The key insight: **reads are free, writes go through methods.** If a user bypasses
methods and mutates `.info.familyName` directly, we have two fallback strategies:

1. **Accept it**: On export, always rebuild from current simplified state anyway (the
   hybrid reconciliation approach already proposed). Direct mutation still works — it
   just doesn't get the benefit of dirty tracking optimization.
2. **Proxy (future)**: Could use JS Proxy to intercept writes and auto-mark dirty. This
   is an optimization, not required for correctness.

### Static Entry Points

```javascript
// Create from scratch (Scenario 2)
FontFlux.create(options?)
// options: { family, style?, unitsPerEm?, ascender?, descender?, format? }
// Returns: FontFlux instance with .notdef + space, ready for addGlyph()
// Minimal internals: font info object, empty glyphs array (with .notdef/space),
// no _header, no tables — pure Scenario 2 shape

// Load existing (Scenario 1)
FontFlux.open(buffer)
// buffer: ArrayBuffer of TTF/OTF/WOFF/WOFF2/TTC/OTC
// Returns: FontFlux instance wrapping importFont() result
// Internals: full simplified object with _header, tables, font, glyphs, etc.

// Load from JSON (either scenario)
FontFlux.fromJSON(jsonString)
// Returns: FontFlux instance — detects whether it has _header (Scenario 1) or not (Scenario 2)

// WOFF2 init (unchanged, still needed before open() on WOFF2 files)
FontFlux.initWoff2()
```

### Minimal Data Behind `FontFlux.create()`

What's the absolute minimum to produce a valid font?

```javascript
FontFlux.create({ family: 'My Font' })
// Internally creates:
{
  font: {
    familyName: 'My Font',
    styleName: 'Regular',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    lineGap: 0,
  },
  glyphs: [
    { name: '.notdef', advanceWidth: 500,
      contours: [[{x:50,y:0,onCurve:true},{x:50,y:700,onCurve:true},
                   {x:450,y:700,onCurve:true},{x:450,y:0,onCurve:true}]] },
    { name: 'space', unicode: 32, advanceWidth: 250 },
  ],
  kerning: [],
  // No _header, no tables — buildRawFromSimplified() generates everything on export
}
```

On export, `buildRawFromSimplified()` auto-generates: head, hhea, maxp, OS/2, name,
post, cmap, hmtx, glyf (or CFF), loca. That's 10+ tables from just a family name
and two glyphs. The user never thinks about tables.

### Font Info — Batch Update Pattern

Batch setters accept a partial object and merge with existing values:

```javascript
font.setInfo({ familyName: 'New Name', weightClass: 700 });
// Only updates the fields you pass — everything else preserved
// Equivalent to: Object.assign(font.info, { familyName: 'New Name', weightClass: 700 })
// Plus: marks font info as dirty for export reconciliation
```

Exposed info fields (matching current `font.*` simplified schema):

```
Identity:    familyName, styleName, fullName, postScriptName, uniqueID
Strings:     copyright, trademark, manufacturer, designer, description,
             vendorURL, designerURL, license, licenseURL, sampleText, version
Metrics:     unitsPerEm, ascender, descender, lineGap
Style:       italicAngle, underlinePosition, underlineThickness,
             isFixedPitch, weightClass, widthClass
OS/2:        fsType, fsSelection, achVendID, panose
Timestamps:  created, modified
```

### Complete Method Inventory (Idealized)

#### Font Identity & Metadata

```javascript
font.getInfo(); // → { familyName, styleName, ... }
font.setInfo(partialInfo); // merge partial updates
```

#### Glyphs

```javascript
font.listGlyphs(); // → [{ name, unicode, index }, ...]  (lightweight)
font.getGlyph(id); // → full glyph object (by name, unicode, or hex)
font.addGlyph(glyphOrOptions); // add/replace glyph (auto-wraps in createGlyph if needed)
font.removeGlyph(id); // remove by name/unicode/hex, cleans up kerning refs
font.hasGlyph(id); // → boolean
font.glyphCount; // → number (property, not method)
```

#### Kerning

```javascript
font.getKerning(left, right); // → number | undefined
font.addKerning(pairsOrInput); // accepts all createKerning() input formats
font.removeKerning(left, right); // remove specific pair
font.listKerning(); // → [{ left, right, value }, ...]
font.clearKerning(); // remove all kerning
```

#### Variable Font Axes

```javascript
font.listAxes(); // → [{ tag, name, min, default, max }, ...]
font.getAxis(tag); // → axis object or undefined
font.addAxis(axisDefinition); // add new axis
font.removeAxis(tag); // remove axis + clean up instances
font.setAxis(tag, partialUpdate); // update axis properties
```

#### Named Instances (Variable Fonts)

```javascript
font.listInstances(); // → [{ name, coordinates }, ...]
font.addInstance(instance); // add named instance
font.removeInstance(name); // remove by name
```

#### Features (GSUB/GPOS/GDEF — Passthrough for Now)

```javascript
font.getFeatures(); // → { GPOS, GSUB, GDEF } (raw parsed objects)
font.setFeatures(partialFeatures); // replace/update feature tables
// Future: font.addLigature(['f','i'], 'fi'), font.addAlternate('A', [...])
```

#### Hinting (TrueType)

```javascript
font.getHinting(); // → { gasp, cvt, fpgm, prep }
font.setHinting(partialHinting); // update hinting tables
```

#### SVG Path Utilities (Static — Don't Need Font Context)

```javascript
FontFlux.svgToContours(pathData, format); // → contours array
FontFlux.contoursToSVG(contours); // → SVG path string
```

#### CFF Charstring Utilities (Static)

```javascript
FontFlux.compileCharString(contours)     // → bytecode array
FontFlux.assembleCharString(text)        // → bytecode array
FontFlux.interpretCharString(bytes, ...) // → { contours, width }
FontFlux.disassembleCharString(bytes)    // → assembly text string
```

#### Export & Serialization

```javascript
font.export(options?)                    // → ArrayBuffer  { format: 'ttf'|'otf'|'woff'|'woff2' }
font.toJSON(indent?)                     // → JSON string
font.validate()                          // → { valid, errors, warnings, infos }
font.detach()                            // strip _header/tables → pure Scenario 2 object
```

#### Subsetting

```javascript
font.subset(options); // → new FontFlux instance (non-destructive)
// options: { unicodes, glyphs, unicodeRanges }
```

#### Direct Data Access (Thin Wrapper Reads)

```javascript
font.info; // → the font metadata object (direct ref)
font.glyphs; // → the glyphs array (direct ref)
font.kerning; // → the kerning pairs array (direct ref)
font.axes; // → axes array or undefined
font.instances; // → instances array or undefined
font.features; // → { GPOS, GSUB, GDEF } or undefined
font.tables; // → stored raw tables (Scenario 1) or undefined
font.format; // → 'truetype' | 'cff' | 'cff2' (detected from glyphs)
```

### How This Solves the Reconciliation Problem

With the Font object model, export becomes straightforward:

```javascript
font.export({ format: 'ttf' });
// Internally:
// 1. Always rebuild decomposed tables from font.info/glyphs/kerning/axes/etc.
// 2. If font.tables exists (Scenario 1 import), merge in non-decomposed tables
// 3. If font.tables is absent (Scenario 2 create), only built tables exist — that's fine
// No ambiguity. No silent data loss. The simplified model IS the source of truth.
```

The `_header` / `tables` distinction becomes an internal implementation detail that the
user never needs to think about. The Font object always exports from simplified fields —
with stored tables as a fallback pool for tables that can't be rebuilt from simplified.

### How This Solves Multi-Font Workflows

```javascript
const source = FontFlux.open(existingBuffer);
const target = FontFlux.create({ family: 'My Remix' });

// Copy glyphs between fonts
for (const g of source.listGlyphs()) {
	if (g.unicode >= 0x41 && g.unicode <= 0x5a) {
		// A-Z
		target.addGlyph(source.getGlyph(g.name));
	}
}

// Each font is independent — no shared state
const buf1 = source.export({ format: 'woff2' });
const buf2 = target.export({ format: 'ttf' });
```

### Migration Path from Current API

The Font object wraps the existing infrastructure. No rewrite needed:

- `FontFlux.open(buffer)` calls `importFont(buffer)` internally, wraps result
- `FontFlux.create(options)` builds the minimal plain object, wraps it
- `font.export()` calls `exportFont()` internally (with the reconciliation fix)
- `font.addGlyph()` calls `createGlyph()` internally if raw options are passed
- `font.addKerning()` calls `createKerning()` internally for normalization
- `font.toJSON()` calls `fontToJSON()` internally
- `FontFlux.fromJSON()` calls `fontFromJSON()` internally, wraps result

The standalone functions (`importFont`, `exportFont`, `createGlyph`, etc.) can remain
exported from main.js for backward compatibility. The Font object is a higher-level
API layered on top.

### What About Collections (TTC/OTC)?

```javascript
const collection = FontFlux.open(ttcBuffer);
// Returns: FontFlux instance for the first font? Or a collection wrapper?

// Option A: Collection-aware open
const fonts = FontFlux.openAll(ttcBuffer); // → FontFlux[] array
fonts[0].getInfo().familyName; // "MS Gothic"
fonts[1].getInfo().familyName; // "MS PGothic"

// Option B: Single open returns first, with accessor for others
const font = FontFlux.open(ttcBuffer); // → first font
font.collection; // → { fonts: FontFlux[], numFonts: 3 }

// Export collection
FontFlux.exportCollection(fonts, { format: 'ttc' }); // → ArrayBuffer
```

**Decision**: Option A (`FontFlux.openAll`) is cleaner. `FontFlux.open()` on a collection
should throw or warn — asking the user to use `openAll()` instead. This avoids the
implicit "first font wins" surprise and makes multi-font handling explicit. A single-font
file with `openAll()` just returns a one-element array.

```javascript
// Final API:
FontFlux.open(buffer)       // → FontFlux (single font; throws on TTC/OTC)
FontFlux.openAll(buffer)    // → FontFlux[] (works for single AND collection files)
FontFlux.exportCollection(fonts, options?) // → ArrayBuffer (TTC/OTC output)
```

---

## Resolved Design Decisions

### 1. Naming: `FontFlux`

**Decision**: Use `FontFlux` as the class name.

- Avoids collision with the browser `FontFace` API and any DOM `Font` type.
- Matches the package name (`font-flux-js`) — instantly recognizable.
- Short enough for comfortable use: `const font = FontFlux.open(buf)`.
- `Font` alone is too generic and too likely to collide in user code.

### 2. Wrapper Style: Hybrid (Option C)

**Decision**: Readable properties, writable through methods.

- `font.info`, `font.glyphs`, `font.kerning` etc. return **live references** — direct
  reads are zero-friction, no copies.
- Mutations **should** go through methods (`setInfo`, `addGlyph`, etc.) for coordination,
  validation, and cleanup (e.g. removing kerning refs when a glyph is deleted).
- But direct mutation (`font.info.familyName = 'New'`) **also works** — export always
  rebuilds from the current simplified state regardless. Methods are better practice,
  not a hard requirement.
- This is the pragmatic JS approach: don't fight the language. Plain objects are the
  lingua franca of JavaScript. The wrapper adds convenience, not walls.

### 3. Immutability of getGlyph(): Return Live References

**Decision**: `font.getGlyph('A')` returns the actual internal glyph object, not a copy.

- Consistent with the hybrid philosophy — reads are free, direct mutation is tolerated.
- A user can do `font.getGlyph('A').advanceWidth = 700` and it takes effect on export.
- No confusing "modify then commit" pattern. What you see is what you get.
- `font.glyphs[5]` and `font.getGlyph(...)` return the same object reference.
- Cost: no change tracking from direct mutation. Acceptable — export rebuilds anyway.

### 4. Dirty Tracking: Not Initially, Always-Rebuild

**Decision**: Export always rebuilds all decomposed tables. No dirty tracking in v1.

- `buildRawFromSimplified()` is fast — the bottleneck is binary serialization, not table
  building. Even NotoSerifCJK (25MB, 65K+ glyphs) completes in seconds.
- Dirty tracking adds complexity and fragility for marginal gain. If a user mutates
  `.info.familyName` directly (bypassing `setInfo()`), dirty tracking misses it anyway.
- Always-rebuild is **correct by construction** — the simplified model is always the
  source of truth, and the export always reflects it. No stale data possible.
- Future optimization: if profiling reveals `buildRawFromSimplified()` as a bottleneck
  for very large fonts, dirty tracking (or JS Proxy-based write interception) can be added
  later without changing the public API. The methods already have the right call sites.

### 5. Event Hooks: Not in v1, But Design for Them

**Decision**: No event system initially. But the object model makes it trivial to add later.

- Font editors will eventually want `font.on('glyphAdded', fn)` or similar. The method-based
  mutation API is the natural place to emit events.
- For v1: don't add the machinery. Keep the implementation simple.
- For future: adding `on()`/`off()` to the FontFlux prototype is non-breaking. Mutation
  methods already centralize the write paths — adding `this.emit('glyphAdded', glyph)` is
  a one-liner in each method.

### 6. Clean Break: FontFlux Is the API (Major Version)

**Decision**: The FontFlux object is the sole public API. Standalone functions are removed
from the public surface.

- This is a **major version** (v2.0). Breaking changes are expected and acceptable.
  The current standalone-function API (`importFont`, `exportFont`, `createGlyph`, etc.)
  was the v1 API. It served its purpose but has a fundamental design flaw (the
  reconciliation bug) that can't be fixed cleanly without a new surface.
- `main.js` exports **only** `FontFlux` (and `initWoff2` as a standalone since it's
  a one-time global init, not font-scoped).
- The standalone functions (`importFont`, `exportFont`, `createGlyph`, `createKerning`,
  `fontToJSON`, `fontFromJSON`, `buildSimplified`, `buildRawFromSimplified`,
  `validateJSON`, etc.) still exist internally — the FontFlux class calls them. They
  are **not** re-exported. They are implementation details.
- Utility functions that are truly font-independent (SVG path conversion, CFF charstring
  tools) become static methods on `FontFlux` — `FontFlux.svgToContours()`,
  `FontFlux.compileCharString()`, etc.
- No backward-compatibility shims or deprecation warnings. Clean slate.
- Migration guide in docs: "v1 used `importFont(buffer)` → v2 uses `FontFlux.open(buffer)`"
  with a mapping table of old → new equivalents.

### 7. Setter Granularity: Batch for Metadata, Specific for Collections

**Decision**: Use batch `setInfo(partial)` for font metadata. Use specific methods for
collections (glyphs, kerning, axes, instances).

- **Metadata** (font info): Batch makes sense — users often set multiple fields at once
  (`familyName` + `styleName` + `weightClass`). A single `setInfo()` with partial merge is
  the right pattern. No need for `setFamilyName()`, `setAscender()`, etc.
- **Glyphs**: Specific methods (`addGlyph`, `removeGlyph`) because each glyph operation
  involves coordination (ordering, unicode dedup, kerning cleanup). Batch "replace all
  glyphs" is covered by setting `font.glyphs = newArray` directly (hybrid allows it).
- **Kerning**: Specific methods (`addKerning`, `removeKerning`) because pair deduplication
  is the whole point. `addKerning` accepts the full `createKerning()` input vocabulary.
- **Axes/Instances**: Specific methods (`addAxis`, `removeAxis`, `setAxis`) because axis
  operations cascade (removing an axis should clean up instances that reference it).
- **Features/Hinting**: Batch `setFeatures(partial)`/`setHinting(partial)` because these
  are opaque blobs the user either has or doesn't.

### 8. Reconciliation: Automatic, Always-Rebuild

**Decision**: Automatic reconciliation in export. No explicit `applyChanges()` call needed.

This follows directly from decisions #3 and #4:

- Since reads return live references and direct mutation is tolerated (decision #3)...
- And since export always rebuilds all decomposed tables (decision #4)...
- The export path **must** always treat simplified fields as the source of truth.
- There is no scenario where export should ignore the simplified model — that was the bug.
- The `_header`/`tables` stored data is a **fallback pool** for non-decomposed tables
  only (COLR, gvar, GSUB internal structure, bitmaps, etc.), never an override of
  simplified fields.

Concretely, `font.export()` will:

1. Call `buildRawFromSimplified()` with the current `font.info`, `glyphs`, `kerning`, etc.
2. Merge in non-decomposed tables from `font.tables` (if present, i.e. Scenario 1).
3. Produce binary via the existing `exportFont()` pipeline.

The old pure-passthrough path (`_header` present → return stored tables unchanged) is
removed. It only existed as a shortcut and was the root cause of the silent-discard bug.
