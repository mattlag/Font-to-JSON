# Creating Fonts

Use these guides when authoring Font Flux JSON from scratch.

## Choose a target format

- [Creating an OTF](./creating-otf.md)
- [Creating a TTF](./creating-ttf.md)
- [Creating a TTC / OTC Collection](./creating-ttc-otc.md)

## Shared workflow

1. Start from a minimal valid JSON shape with `header` and `tables`.
2. Add required tables for your target format first.
3. Add optional tables only when needed for features (layout, color, variations, metadata).
4. Run `validateJSON` frequently.
5. Export only when `report.valid === true`.

## JSON serialization

Use `fontToJSON` and `fontFromJSON` to safely convert font objects to and from JSON strings. This handles BigInt values (used for LONGDATETIME fields in `head.created` and `head.modified`), converts TypedArrays to plain arrays, and strips transient internal properties while preserving the data needed for lossless re-export.

```js
import { importFont, exportFont, fontToJSON, fontFromJSON } from 'font-flux-js';

// Import a font
const fontData = importFont(buffer);

// Serialize to JSON string (for saving, transmitting, or editing)
const jsonString = fontToJSON(fontData);

// Deserialize back to a font object
const restored = fontFromJSON(jsonString);

// Export back to binary
const binary = exportFont(restored);
```

`fontToJSON` accepts an optional `indent` parameter (default `2`, use `0` for compact output).

## Container formats (WOFF / WOFF2)

By default, `exportFont` outputs raw SFNT bytes. You can wrap the output in a WOFF or WOFF2 container using the `format` option:

```js
import { initWoff2, exportFont } from 'font-flux-js';

await initWoff2(); // Required once before WOFF2 use

const woff = exportFont(fontData, { format: 'woff' }); // WOFF 1.0 (zlib)
const woff2 = exportFont(fontData, { format: 'woff2' }); // WOFF 2.0 (Brotli)
```

Fonts imported from WOFF or WOFF2 files re-export to their original format by default. Use `format: 'sfnt'` to force raw SFNT output.

See [Validation guide](./guide/validation.md) and [All table references](./tables/index.md).
