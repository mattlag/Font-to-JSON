# Importing Legacy Formats

Font Flux JS can import several legacy font formats, converting them into the same simplified JSON structure used by modern OpenType fonts. Once imported, these fonts can be edited and exported as OTF, TTF, WOFF, or WOFF2.

## CFF

A CFF file contains the same data as the `CFF ` table inside an OTF — just without the SFNT wrapper. These are sometimes produced by font editors or PostScript workflows.

```js
import { FontFlux } from 'font-flux-js';

const buffer = await fetch('myfont.cff').then((r) => r.arrayBuffer());
const font = FontFlux.open(buffer);

console.log(font.glyphCount); // glyph outlines are preserved
console.log(font.format); // 'cff'
```

On import, Font Flux synthesizes the missing SFNT metadata (head, hhea, hmtx, name, OS/2, etc.) from CFF Top DICT values like `FontBBox` and the font name. Advance widths are extracted by interpreting each charstring.

### Exporting back to CFF

CFF fonts default to CFF format on export, producing raw CFF bytes without an SFNT wrapper:

```js
const cffBytes = font.export(); // defaults to 'cff' for CFF imports
const cffBytes2 = font.export({ format: 'cff' }); // explicit
```

You can also export to any other format:

```js
const otf = font.export({ format: 'sfnt' }); // full OTF with SFNT wrapper
const woff = font.export({ format: 'woff' }); // WOFF 1.0
```

> **Note:** CFF export is only available for fonts with CFF outlines. Attempting to export a TrueType font as CFF will throw an error.

## PFB (PostScript Type 1 Binary)

PFB is the most common Type 1 format on Windows. The file contains segments with a `0x80` marker byte, a type byte (1 = ASCII, 2 = binary, 3 = EOF), and a little-endian 32-bit length.

```js
const buffer = await fetch('myfont.pfb').then((r) => r.arrayBuffer());
const font = FontFlux.open(buffer);

// Type 1 glyphs are converted to cubic Bézier contours
console.log(font.glyphs[1].contours);
```

## PFA (PostScript Type 1 ASCII)

PFA is the plain-text counterpart to PFB. The encrypted portion follows the `currentfile eexec` marker and is hex-encoded.

```js
const buffer = await fetch('myfont.pfa').then((r) => r.arrayBuffer());
const font = FontFlux.open(buffer);
```

## What gets imported from Type 1

Font Flux extracts the following from PFB/PFA files:

| Data                               | Source                                                  |
| ---------------------------------- | ------------------------------------------------------- |
| Font name, family, weight, version | PostScript font dictionary                              |
| Units per em                       | Derived from `FontMatrix` (typically 1/0.001 = 1000)    |
| Bounding box, ascender, descender  | `FontBBox`                                              |
| Glyph outlines                     | Type 1 charstrings (converted to cubic Bézier contours) |
| Advance widths                     | `hsbw` / `sbw` charstring operators                     |
| Unicode mapping                    | Encoding vector (character code → glyph name)           |
| Italic angle, underline metrics    | PostScript font dictionary values                       |
| Blue values, stem hints            | Private dictionary                                      |

### What's different from a native OTF import

Type 1 fonts are simpler than modern OpenType, so the imported data will naturally be more limited:

- **No kerning** — Type 1 kerning is stored in separate `.afm` files, which Font Flux does not read. You can add kerning after import using `font.addKerning()`.
- **No OpenType features** — No GSUB/GPOS tables. Substitutions and features can be added after import.
- **No hinting preservation** — Type 1 stem hints are read but not converted to TrueType hinting instructions.
- **Encoding-based Unicode** — Unicode mappings come from the font's encoding vector, which typically only covers the first 256 code points.

### Exporting Type 1 imports

After import, Type 1 fonts behave like any other font and can be exported to modern formats:

```js
const buffer = readFileSync('legacy-font.pfb');
const font = FontFlux.open(buffer.buffer);

// Add kerning that wasn't in the Type 1 file
font.addKerning({ left: 'A', right: 'V', value: -80 });

// Export as modern OTF
const otf = font.export({ format: 'sfnt' });
writeFileSync('modernized.otf', Buffer.from(otf));
```

## Format detection

`FontFlux.open()` automatically detects the format from the file's magic bytes:

| Format  | Magic bytes                                   |
| ------- | --------------------------------------------- |
| TTF     | `0x00010000`                                  |
| OTF     | `OTTO`                                        |
| TTC/OTC | `ttcf`                                        |
| WOFF    | `wOFF`                                        |
| WOFF2   | `wOF2`                                        |
| CFF     | `0x01 0x00` (major=1, minor=0, valid offSize) |
| PFB     | `0x80 0x01` or `0x80 0x02`                    |
| PFA     | `%!` (0x25 0x21)                              |

No file extension or MIME type is needed — just pass the `ArrayBuffer` to `FontFlux.open()`.
