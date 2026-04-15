<p align="center">
  <img src="font-flux-js-logo.svg" alt="Font Flux JS" width="400">
</p>

# Font Flux JS

Convert fonts to JSON, make edits, then convert them back!

Font Flux JS is a JavaScript library for parsing OpenType/TrueType font binaries into structured JSON, then exporting that JSON back into a valid font binary. Every table is fully parsed into human-readable fields! If you're ambitious, you can also create a font JSON from scratch and turn it into a font.

Font Flux JS is part of the Glyphr Studio family. Any questions or feedback? We'd love to hear from you: mail@glyphrstudio.com

# April 2026

This is a fast-moving project with lots of breaking changes happening every day. **Do not depend on it for anything important**. V1 was incomplete but fairly stable, but we decided to go a completely different direction architecturally, so v2 exists, but it is in its early stages and may contain bugs or unexpected behavior.

## Demo

Try out the demo app! You can load a font, edit it's metadata, subset glyphs, and even save as different font file formats.

### [Font Flux JS Demo App](https://www.glyphrstudio.com/fontfluxjs)

## Installation

### npm (recommended)

```bash
npm install font-flux-js
```

### Standalone

You can also use `dist/font-flux-js.js` directly as a single-file ES module — no bundler or npm required. Everything is self-contained except for WOFF2 support, which requires the `brotli-wasm` package in browser environments (Node.js uses its built-in `zlib`). If you don't need WOFF2, the single file works with no other dependencies.

## Quick start

### Browser

```html
<script type="module">
	import { FontFlux } from 'font-flux-js';

	const response = await fetch('./fonts/MyFont.ttf');
	const buffer = await response.arrayBuffer();

	const font = FontFlux.open(buffer);

	// Modify anything — font metadata, glyphs, kerning...
	font.info.familyName = 'My Custom Font';

	const outputBuffer = font.export();

	// Download the modified font
	const blob = new Blob([outputBuffer], { type: 'font/ttf' });
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = 'MyFont-modified.ttf';
	a.click();
</script>
```

### Node.js

```js
import { readFile, writeFile } from 'node:fs/promises';
import { FontFlux } from 'font-flux-js';

// Open a font
const buffer = (await readFile('MyFont.ttf')).buffer;
const font = FontFlux.open(buffer);

// Inspect
console.log(font.info.familyName); // "Helvetica"
console.log(font.glyphCount); // 756
console.log(font.kerning?.length); // 1200

// Modify
font.info.familyName = 'My Custom Font';

// Add a glyph
font.addGlyph({
	name: 'bullet',
	unicode: 0x2022,
	advanceWidth: 500,
	contours: [
		[
			{ x: 100, y: 200, onCurve: true },
			{ x: 200, y: 300, onCurve: false },
			{ x: 300, y: 200, onCurve: true },
		],
	],
});

// Validate before export
const report = font.validate();
if (!report.valid) {
	console.error(report.issues);
}

// Export
const output = font.export();
await writeFile('MyFont-modified.ttf', Buffer.from(output));
```

### Create a font from scratch

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.create({
	family: 'Brand New Font',
	unitsPerEm: 1000,
	ascender: 800,
	descender: -200,
});

font.addGlyph({
	name: 'A',
	unicode: 65,
	advanceWidth: 600,
	contours: [
		[
			{ x: 0, y: 0, onCurve: true },
			{ x: 300, y: 700, onCurve: true },
			{ x: 600, y: 0, onCurve: true },
		],
	],
});

font.addKerning({ left: 'A', right: 'V', value: -50 });

// Add ligatures (GSUB)
font.addGlyph({
	name: 'f',
	unicode: 102,
	advanceWidth: 300,
	contours: [
		/*...*/
	],
});
font.addGlyph({
	name: 'i',
	unicode: 105,
	advanceWidth: 250,
	contours: [
		/*...*/
	],
});
font.addGlyph({
	name: 'fi',
	advanceWidth: 550,
	contours: [
		/*...*/
	],
});
font.addSubstitution({
	type: 'ligature',
	feature: 'liga',
	substitution: { components: ['f', 'i'], ligature: 'fi' },
});

const buffer = font.export();
```

## FontFlux API

### Static factories

| Method                                   | Description                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `FontFlux.open(buffer)`                  | Parse an `ArrayBuffer` into a `FontFlux` instance. Handles TTF, OTF, TTC, OTC, WOFF, WOFF2. |
| `FontFlux.openAll(buffer)`               | Parse a font collection (TTC/OTC), returning an array of `FontFlux` instances.              |
| `FontFlux.create(options)`               | Create a new empty font from metadata (family, unitsPerEm, etc.).                           |
| `FontFlux.fromJSON(jsonString)`          | Deserialize a JSON string into a `FontFlux` instance.                                       |
| `FontFlux.exportCollection(fonts, opts)` | Export multiple `FontFlux` instances as a single TTC/OTC collection.                        |
| `FontFlux.initWoff2()` / `initWoff2()`   | Initialize WOFF2 support (async). Must be awaited once before WOFF2 use.                    |

### Instance properties (live references)

| Property         | Description                                                                         |
| ---------------- | ----------------------------------------------------------------------------------- |
| `.info`          | Font metadata object (familyName, styleName, unitsPerEm, ascender, descender, etc.) |
| `.glyphs`        | Array of glyph objects (name, unicode, advanceWidth, contours, ...)                 |
| `.kerning`       | Array of kerning pairs `{ left, right, value }`                                     |
| `.substitutions` | Array of GSUB substitution rules (ligatures, small caps, alternates, etc.)          |
| `.axes`          | Variable font axes (from fvar)                                                      |
| `.instances`     | Named instances (from fvar)                                                         |
| `.features`      | OpenType layout features (GPOS, GSUB, GDEF)                                         |
| `.palettes`      | Color palettes (arrays of hex strings)                                              |
| `.colorGlyphs`   | Color glyph data (COLR layers or paint trees)                                       |
| `.tables`        | All parsed tables (for advanced/lossless access)                                    |
| `.glyphCount`    | Number of glyphs                                                                    |
| `.format`        | Font format string: `'truetype'`, `'cff'`, or `'cff2'`                              |

### Glyph methods

| Method                      | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| `.listGlyphs()`             | List all glyph names                                      |
| `.getGlyph(id)`             | Get glyph by name, code point, or hex string (`'U+0041'`) |
| `.hasGlyph(id)`             | Check if a glyph exists                                   |
| `.addGlyph(glyphOrOptions)` | Add a glyph (raw object or options for createGlyph)       |
| `.removeGlyph(id)`          | Remove a glyph (also cleans up kerning references)        |

### Font info methods

| Method              | Description                            |
| ------------------- | -------------------------------------- |
| `.getInfo()`        | Get the font metadata (live reference) |
| `.setInfo(partial)` | Merge partial updates into font info   |

### Kerning methods

| Method                        | Description                                    |
| ----------------------------- | ---------------------------------------------- |
| `.getKerning(left, right)`    | Look up kerning value between two glyphs       |
| `.addKerning(input)`          | Add kerning pair(s) from flexible input format |
| `.removeKerning(left, right)` | Remove a specific kerning pair                 |
| `.listKerning()`              | List all kerning pairs                         |
| `.clearKerning()`             | Remove all kerning                             |

### Axis & instance methods

| Method                   | Description                     |
| ------------------------ | ------------------------------- |
| `.listAxes()`            | List all variation axes         |
| `.getAxis(tag)`          | Get axis by tag (e.g. `'wght'`) |
| `.addAxis(axis)`         | Add a variation axis            |
| `.removeAxis(tag)`       | Remove a variation axis         |
| `.setAxis(tag, changes)` | Update axis properties          |
| `.listInstances()`       | List named instances            |
| `.addInstance(instance)` | Add a named instance            |
| `.removeInstance(name)`  | Remove a named instance         |

### Substitution methods (GSUB)

| Method                                | Description                                                      |
| ------------------------------------- | ---------------------------------------------------------------- |
| `.listSubstitutions(filter?)`         | List all substitution rules, optionally filtered by type/feature |
| `.getSubstitution(glyphId, options?)` | Find substitution rules for a specific glyph                     |
| `.addSubstitution(input)`             | Add substitution rule(s) from flexible input format              |
| `.removeSubstitution(filter)`         | Remove rules matching a filter (type, feature, from, ligature)   |
| `.clearSubstitutions()`               | Remove all substitutions                                         |

See [Creating Substitutions](https://www.glyphrstudio.com/fontfluxjs/creating-substitutions) for a full guide with examples.

### Color font methods

| Method                                        | Description                                |
| --------------------------------------------- | ------------------------------------------ |
| `.getPalette(index)`                          | Get a palette by index                     |
| `.addPalette(colors)`                         | Add a palette (array of hex strings)       |
| `.removePalette(index)`                       | Remove a palette                           |
| `.setPaletteColor(paletteIdx, colorIdx, hex)` | Update one color in a palette              |
| `.getColorGlyph(id)`                          | Get color data for a glyph                 |
| `.addColorGlyph(input)`                       | Add color layers or paint tree for a glyph |
| `.removeColorGlyph(id)`                       | Remove color data for a glyph              |
| `.listColorGlyphs()`                          | List all glyphs with color data            |

### Feature & hinting methods

| Method               | Description                                         |
| -------------------- | --------------------------------------------------- |
| `.getFeatures()`     | Get OpenType features (GPOS, GSUB, GDEF)            |
| `.setFeatures(data)` | Replace or update feature tables                    |
| `.getHinting()`      | Get TrueType hinting tables (gasp, cvt, fpgm, prep) |
| `.setHinting(data)`  | Update TrueType hinting tables                      |

### Export & serialization

| Method              | Description                                                             |
| ------------------- | ----------------------------------------------------------------------- | ------ | ---------- |
| `.export(options?)` | Export to binary `ArrayBuffer`. Options: `{ format: 'sfnt'              | 'woff' | 'woff2' }` |
| `.toJSON(indent?)`  | Serialize to JSON string                                                |
| `.validate()`       | Check for structural issues. Returns `{ valid, errors, warnings, ... }` |
| `.detach()`         | Strip stored tables/header, converting to a pure hand-authored shape    |

### Static utilities

| Method                                     | Description                                                  |
| ------------------------------------------ | ------------------------------------------------------------ |
| `FontFlux.svgToContours(d, format?)`       | Parse an SVG path `d` string into font contour data          |
| `FontFlux.contoursToSVG(contours)`         | Convert font contours to an SVG path `d` string              |
| `FontFlux.interpretCharString(bytes, ...)` | Interpret CFF charstring bytecode into cubic Bézier contours |
| `FontFlux.disassembleCharString(bytes)`    | Disassemble CFF charstring into human-readable text          |
| `FontFlux.compileCharString(contours)`     | Compile CFF contours into Type 2 charstring bytes            |
| `FontFlux.assembleCharString(text)`        | Assemble human-readable charstring text into bytes           |

### WOFF2 initialization

```js
import { FontFlux, initWoff2 } from 'font-flux-js';

await initWoff2(); // Call once at startup

const font = FontFlux.open(woff2Buffer);
const woff2Output = font.export({ format: 'woff2' });
```

## What `FontFlux.open()` gives you

`FontFlux.open(buffer)` returns a `FontFlux` instance whose `.info`, `.glyphs`, `.kerning`, and other properties expose a **simplified** structure:

```js
{
  font: {                    // Metadata from head, name, OS/2, hhea, post
    familyName, styleName, unitsPerEm, ascender, descender, ...
  },
  glyphs: [                  // Per-glyph data from glyf/CFF + hmtx + cmap + post
    { name, unicode, advanceWidth, contours, components, ... }
  ],
  kerning: [                 // Pair adjustments from kern / GPOS
    { left, right, value }
  ],
  axes: [...],               // Variable font axes (fvar)
  instances: [...],          // Named instances (fvar)
  substitutions: [            // GSUB rules (ligatures, small caps, alternates, ...)
    { type: 'ligature', feature: 'liga', components: ['f', 'i'], ligature: 'fi' }
  ],
  features: { GPOS, GDEF },  // Non-decomposed layout features
  tables: { ... },           // ALL original parsed tables (for lossless round-trip)
  _header: { ... },          // SFNT header
}
```

The top-level fields (`font`, `glyphs`, `kerning`) are the human-friendly editing interface. The `tables` object preserves every parsed table for lossless binary round-trip.

## Supported formats

- **TTF** (`.ttf`) and **OTF** (`.otf`) — single fonts
- **TTC** (`.ttc`) and **OTC** (`.otc`) — font collections
- **WOFF** (`.woff`) — Web Open Font Format 1.0 (zlib compression)
- **WOFF2** (`.woff2`) — Web Open Font Format 2.0 (Brotli compression)

## Supported tables

### Shared SFNT tables

`BASE`, `CBDT`, `CBLC`, `COLR`, `CPAL`, `DSIG`, `EBDT`, `EBLC`, `EBSC`, `GDEF`, `GPOS`, `GSUB`, `HVAR`, `JSTF`, `LTSH`, `MATH`, `MERG`, `MVAR`, `OS/2`, `PCLT`, `STAT`, `SVG `, `VDMX`, `VVAR`, `avar`, `cmap`, `fvar`, `hdmx`, `head`, `hhea`, `hmtx`, `kern`, `maxp`, `meta`, `name`, `post`, `sbix`, `vhea`, `vmtx`

### OTF-specific tables

`CFF `, `CFF2`, `VORG`

### TTF-specific tables

`cvar`, `cvt `, `fpgm`, `gasp`, `glyf`, `gvar`, `loca`, `prep`

### Apple AAT tables

`bloc`, `bdat`, `ltag`

> Tables not in this list (e.g. vendor-specific tables like `FFTM`) are preserved as raw bytes for lossless round-trip.
