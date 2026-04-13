# Creating Fonts

Use these guides when creating fonts with Font Flux JS.

## Quick start

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.create({
	family: 'My Font',
	unitsPerEm: 1000,
	ascender: 800,
	descender: -200,
});

// .notdef and space glyphs are created automatically
font.addGlyph({
	name: 'A',
	unicode: 65,
	advanceWidth: 600,
	path: 'M 0 0 L 300 700 L 600 0 Z',
});

const buffer = font.export();
```

`FontFlux.create()` accepts `family` (required), plus optional `style`, `unitsPerEm`, `ascender`, and `descender`. It automatically creates `.notdef` and `space` glyphs.

## Choose a target format

- [Creating an OTF](./creating-otf.md)
- [Creating a TTF](./creating-ttf.md)

## Creating glyph data

See the [Creating Glyphs](./creating-glyphs.md) guide for a detailed reference on glyph metadata, outline formats (SVG path, CFF/PostScript, TrueType), and common patterns like `.notdef`, space, and composite glyphs.

## Shared workflow

1. Create a font with `FontFlux.create()` or open an existing one with `FontFlux.open()`.
2. Add glyphs with `.addGlyph()`, kerning with `.addKerning()`.
3. Run `.validate()` frequently.
4. Export only when `report.valid === true`.

## JSON serialization

Use `.toJSON()` and `FontFlux.fromJSON()` to safely convert fonts to and from JSON strings. This handles BigInt values (used for LONGDATETIME fields in `head.created` and `head.modified`), converts TypedArrays to plain arrays, and strips transient internal properties while preserving the data needed for lossless re-export.

```js
import { FontFlux } from 'font-flux-js';

// Open a font
const font = FontFlux.open(buffer);

// Serialize to JSON string (for saving, transmitting, or editing)
const jsonString = font.toJSON();

// Deserialize back to a FontFlux instance
const restored = FontFlux.fromJSON(jsonString);

// Export back to binary
const binary = restored.export();
```

`.toJSON()` accepts an optional `indent` parameter (default `2`, use `0` for compact output).

## Container formats (WOFF / WOFF2)

By default, `.export()` outputs raw SFNT bytes. You can wrap the output in a WOFF or WOFF2 container using the `format` option:

```js
import { FontFlux, initWoff2 } from 'font-flux-js';

await initWoff2(); // Required once before WOFF2 use

const woff = font.export({ format: 'woff' }); // WOFF 1.0 (zlib)
const woff2 = font.export({ format: 'woff2' }); // WOFF 2.0 (Brotli)
```

Fonts opened from WOFF or WOFF2 files re-export to their original format by default. Use `format: 'sfnt'` to force raw SFNT output.

See [Validation guide](./guide/validation.md) and [All table references](./tables/index.md).
