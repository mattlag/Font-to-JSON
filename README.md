# Font Flux JS

Convert a font file to JSON... and back!

Font Flux JS is a JavaScript library for parsing OpenType/TrueType font binaries into structured JSON, then exporting that JSON back into a valid font binary. Every table is fully parsed into human-readable fields — no opaque byte blobs for editable data.

## Installation

```bash
npm install font-flux-js
```

## Quick start

### Browser

```html
<script type="module">
	import { importFont, exportFont } from './dist/font-flux-js.js';

	const response = await fetch('./fonts/MyFont.ttf');
	const buffer = await response.arrayBuffer();

	const fontData = importFont(buffer);

	// Modify anything — font metadata, glyphs, kerning, tables...
	fontData.font.familyName = 'My Custom Font';

	const outputBuffer = exportFont(fontData);

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
import { importFont, exportFont, validateJSON } from 'font-flux-js';

// Import
const buffer = (await readFile('MyFont.ttf')).buffer;
const fontData = importFont(buffer);

// Inspect the simplified structure
console.log(fontData.font.familyName); // "Helvetica"
console.log(fontData.glyphs.length); // 756
console.log(fontData.kerning?.length); // 1200

// Modify
fontData.font.familyName = 'My Custom Font';
fontData.font.version = 'Version 2.0';

// Validate before export
const report = validateJSON(fontData);
if (!report.valid) {
	console.error(report.issues);
}

// Export
const output = exportFont(fontData);
await writeFile('MyFont-modified.ttf', Buffer.from(output));
```

## What `importFont` returns

`importFont` returns a **simplified** structure that consolidates data from many tables into a single coherent view:

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
  features: { GPOS, GSUB, GDEF },  // OpenType layout features
  tables: { ... },           // ALL original parsed tables (for lossless round-trip)
  _header: { ... },          // SFNT header
}
```

The top-level fields (`font`, `glyphs`, `kerning`) are the human-friendly editing interface. The `tables` object preserves every parsed table for lossless binary round-trip.

## API

| Function                             | Description                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `importFont(buffer)`                 | Parse an `ArrayBuffer` into a simplified font object. Handles TTF, OTF, TTC, and OTC. |
| `exportFont(fontData)`               | Convert a font object back to binary. Returns an `ArrayBuffer`.                       |
| `validateJSON(fontData)`             | Check a font object for structural issues. Returns `{ valid, issues[] }`.             |
| `buildSimplified(raw)`               | Convert raw `{ header, tables }` into the simplified structure above.                 |
| `buildRawFromSimplified(simplified)` | Convert a simplified object back to `{ header, tables }`.                             |
| `importFontTables(buffer)`           | Low-level import returning raw `{ header, tables }` without simplification.           |

## Supported formats

- **TTF** (`.ttf`) and **OTF** (`.otf`) — single fonts
- **TTC** (`.ttc`) and **OTC** (`.otc`) — font collections

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
